import type { IncomingMessage, ServerResponse } from 'node:http';
import { resolveClient, SafetyError } from './limits.ts';

class BodyError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function readBody(request: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    const cleanup = () => {
      clearTimeout(timer);
      request.off('data', data);
      request.off('end', end);
      request.off('error', error);
      request.off('aborted', aborted);
    };
    const fail = (cause: BodyError) => {
      cleanup();
      request.resume();
      reject(cause);
    };
    const data = (chunk: Buffer) => {
      size += chunk.length;
      if (size > 256) fail(new BodyError(413, 'Vote request is too large.'));
      else chunks.push(chunk);
    };
    const end = () => {
      cleanup();
      resolve(Buffer.concat(chunks).toString('utf8'));
    };
    const error = () => fail(new BodyError(400, 'Invalid vote request.'));
    const aborted = () => fail(new BodyError(400, 'Vote request was interrupted.'));
    const timer = setTimeout(() => fail(new BodyError(408, 'Vote request timed out.')), 5000);
    request.on('data', data);
    request.once('end', end);
    request.once('error', error);
    request.once('aborted', aborted);
  });
}

export async function serveApi(
  request: IncomingMessage,
  response: ServerResponse,
  handle: (request: Request, context: { clientAddress: string }) => Promise<Response>,
  options: { trustedProxies?: string[]; clientHeader?: string } = {},
) {
  try {
    const clientAddress = resolveClient(request, options.trustedProxies, options.clientHeader);
    const headers = new Headers();
    for (const [name, value] of Object.entries(request.headers))
      if (value) headers.set(name, Array.isArray(value) ? value.join(', ') : value);
    const init: RequestInit = { method: request.method, headers };
    if (Number(request.headers['content-length'] ?? 0) > 256)
      throw new BodyError(413, 'Vote request is too large.');
    if (!['GET', 'HEAD'].includes(request.method ?? 'GET')) init.body = await readBody(request);
    const result = await handle(new Request(`http://${request.headers.host}${request.url}`, init), {
      clientAddress,
    });
    response.writeHead(result.status, Object.fromEntries(result.headers));
    response.end(Buffer.from(await result.arrayBuffer()));
  } catch (cause) {
    if (!response.headersSent)
      response.writeHead(
        cause instanceof BodyError || cause instanceof SafetyError ? cause.status : 400,
        {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      );
    response.end(
      JSON.stringify({
        error:
          cause instanceof BodyError || cause instanceof SafetyError
            ? cause.message
            : 'Invalid request.',
      }),
    );
  }
}
