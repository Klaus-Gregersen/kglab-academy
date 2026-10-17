import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { get } from 'node:http';
import type { AddressInfo } from 'node:net';
import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createAppServer } from './app.ts';

test('production HTTP server serves the build and keeps shared votes after restart', async () => {
  const folder = mkdtempSync(join(tmpdir(), 'kglab-http-check-'));
  const databasePath = join(folder, 'votes.sqlite');
  async function start() {
    const server = createAppServer({ databasePath, distPath: resolve('dist') });
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    return { server, origin: `http://127.0.0.1:${(server.address() as AddressInfo).port}` };
  }
  let current = await start();
  async function stop() {
    current.server.close();
    await once(current.server, 'close');
  }
  try {
    const page = await fetch(current.origin);
    assert.equal(page.status, 200);
    assert.match(page.headers.get('content-security-policy')!, /connect-src 'self'/);
    const html = await page.text();
    const asset = html.match(/src="(\/assets\/[^\"]+\.js)"/)![1];
    const script = await fetch(`${current.origin}${asset}`);
    assert.equal(script.status, 200);
    assert.match(script.headers.get('content-type')!, /javascript/);
    assert.match(script.headers.get('cache-control')!, /immutable/);
    assert.equal((await fetch(`${current.origin}/data/votes.sqlite`)).status, 404);
    assert.equal((await fetch(`${current.origin}/api/missing`)).status, 404);
    for (const path of [
      '/.env',
      '/server/voting.ts',
      '/%2e%2e%2fpackage.json',
      '/assets/missing.js',
    ])
      assert.equal((await fetch(`${current.origin}${path}`)).status, 404);
    assert.match(page.headers.get('permissions-policy')!, /camera=\(\)/);
    assert.equal(current.server.maxConnections, 128);
    const initial = await fetch(`${current.origin}/api/community/votes`);
    const cookie = initial.headers.get('set-cookie')!.split(';')[0];
    async function put(body: string) {
      return fetch(`${current.origin}/api/community/votes/pro-git`, {
        method: 'PUT',
        headers: {
          Cookie: cookie,
          Origin: current.origin,
          'Content-Type': 'application/json',
          'X-KGLAB-Vote': '1',
        },
        body,
      });
    }
    assert.equal((await put('x'.repeat(300))).status, 413);
    assert.equal((await put('{broken')).status, 400);
    assert.equal((await put('{"voted":true}')).status, 200);
    await stop();
    current = await start();
    const restored = await fetch(`${current.origin}/api/community/votes`, {
      headers: { Cookie: cookie },
    });
    assert.deepEqual((await restored.json()).votes['pro-git'], { count: 1, voted: true });
    const other = await fetch(`${current.origin}/api/community/votes`);
    assert.deepEqual((await other.json()).votes['pro-git'], { count: 1, voted: false });
  } finally {
    await stop();
    rmSync(folder, { recursive: true, force: true });
  }
});

test('static serving rejects symlinks outside dist and unexpected production hosts', async () => {
  const folder = mkdtempSync(join(tmpdir(), 'kglab-path-check-'));
  const root = join(folder, 'public');
  const { mkdirSync } = await import('node:fs');
  mkdirSync(root);
  writeFileSync(join(folder, 'private.txt'), 'private test fixture');
  symlinkSync(join(folder, 'private.txt'), join(root, 'leak.txt'));
  const server = createAppServer({
    databasePath: ':memory:',
    distPath: root,
    publicOrigin: 'https://academy.test',
    secureCookie: true,
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  try {
    assert.equal((await fetch(`${origin}/leak.txt`)).status, 421);
    const checked = await new Promise<{
      status: number | undefined;
      hsts: string | string[] | undefined;
    }>((resolve, reject) => {
      get(`${origin}/leak.txt`, { headers: { Host: 'academy.test' }, agent: false }, (response) => {
        response.resume();
        response.on('end', () =>
          resolve({
            status: response.statusCode,
            hsts: response.headers['strict-transport-security'],
          }),
        );
      }).on('error', reject);
    });
    assert.equal(checked.status, 404);
    assert.equal(checked.hsts, 'max-age=31536000');
  } finally {
    server.close();
    await once(server, 'close');
    rmSync(folder, { recursive: true, force: true });
  }
});

test('production startup fails closed without a configured HTTPS origin', async () => {
  const { spawnSync } = await import('node:child_process');
  const child = spawnSync(process.execPath, ['server/start.ts'], {
    env: { ...process.env, NODE_ENV: 'production', KGLAB_PUBLIC_ORIGIN: '' },
    encoding: 'utf8',
  });
  assert.notEqual(child.status, 0);
  assert.match(child.stderr, /Production requires KGLAB_PUBLIC_ORIGIN/);
});
