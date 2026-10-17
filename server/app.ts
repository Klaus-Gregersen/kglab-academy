import { randomBytes } from 'node:crypto';
import { TrafficLimits, resolveClient, privateAddressKey, SafetyError } from './limits.ts';
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { realpath, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { createVotingService } from './voting.ts';
import { serveApi } from './http.ts';

const mime: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

export function createAppServer(options: {
  databasePath: string;
  distPath: string;
  publicOrigin?: string;
  secureCookie?: boolean;
  trustedProxies?: string[];
  clientHeader?: string;
  maxVotes?: number;
  identitiesPerHour?: number;
}) {
  const voting = createVotingService(options);
  const root = resolve(options.distPath);
  const traffic = new TrafficLimits({ requestsPerMinute: 240, globalPerMinute: 2400 });
  const trafficSecret = randomBytes(32).toString('hex');
  const server = createServer(async (request, response) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (options.secureCookie) response.setHeader('Strict-Transport-Security', 'max-age=31536000');
    if (options.publicOrigin && request.headers.host !== new URL(options.publicOrigin).host) {
      response.writeHead(421);
      response.end('Unexpected host');
      return;
    }
    response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
    );
    if (request.url === '/healthz' && ['GET', 'HEAD'].includes(request.method ?? 'GET')) {
      response.writeHead(204);
      response.end();
      return;
    }
    try {
      traffic.check(
        privateAddressKey(
          resolveClient(request, options.trustedProxies, options.clientHeader),
          trafficSecret,
        ),
      );
    } catch (cause) {
      response.writeHead(cause instanceof SafetyError ? cause.status : 400, {
        'Cache-Control': 'no-store',
        ...(cause instanceof SafetyError && cause.retryAfter
          ? { 'Retry-After': String(cause.retryAfter) }
          : {}),
      });
      response.end('Request limited or invalid');
      return;
    }
    if (request.url?.startsWith('/api/')) {
      await serveApi(request, response, voting.handle, options);
      return;
    }
    if (!['GET', 'HEAD'].includes(request.method ?? 'GET')) {
      response.writeHead(405, { Allow: 'GET, HEAD' });
      response.end();
      return;
    }
    try {
      const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
      if (
        pathname
          .split('/')
          .some(
            (part) =>
              part.startsWith('.') ||
              /^(?:id_rsa|id_ed25519|kubeconfig)/i.test(part) ||
              /\.(?:pem|key|p12|pfx|sqlite(?:-wal|-shm)?)$/i.test(part),
          )
      ) {
        response.writeHead(404);
        response.end();
        return;
      }
      const path = resolve(root, `.${pathname}`);
      if (path !== root && !path.startsWith(`${root}${sep}`)) {
        response.writeHead(404);
        response.end();
        return;
      }
      // App navigation uses hashes; never fall back to HTML for missing assets or data files.
      const file = pathname === '/' ? resolve(root, 'index.html') : path;
      const canonical = await realpath(file);
      const realRoot = await realpath(root);
      if (!canonical.startsWith(`${realRoot}${sep}`)) {
        response.writeHead(404);
        response.end();
        return;
      }
      const info = await stat(canonical);
      if (!info.isFile()) {
        response.writeHead(404);
        response.end();
        return;
      }
      response.writeHead(200, {
        'Content-Type': mime[extname(file)] ?? 'application/octet-stream',
        'Content-Length': info.size,
        'Cache-Control': pathname.startsWith('/assets/')
          ? 'public, max-age=31536000, immutable'
          : 'no-cache',
      });
      if (request.method === 'HEAD') response.end();
      else
        createReadStream(canonical)
          .on('error', () => response.destroy())
          .pipe(response);
    } catch {
      response.writeHead(404);
      response.end('Not found');
    }
  });
  server.maxConnections = 128;
  server.maxRequestsPerSocket = 100;
  server.requestTimeout = 10000;
  server.headersTimeout = 10000;
  server.on('close', () => voting.close());
  return server;
}
