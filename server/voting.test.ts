import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createVotingService, VoteStore } from './voting.ts';
import { resources } from '../src/community/resources.ts';

const cleanup: (() => void)[] = [];
afterEach(() => {
  for (const close of cleanup.splice(0).reverse()) close();
});
const base = 'http://academy.test/api/community/votes';
function service(options: Partial<Parameters<typeof createVotingService>[0]> = {}) {
  const voting = createVotingService({ databasePath: ':memory:', ...options });
  cleanup.push(() => voting.close());
  return voting;
}
async function visitor(voting: ReturnType<typeof service>) {
  const response = await voting.handle(new Request(base));
  expect(response.status).toBe(200);
  return response.headers.get('set-cookie')!.split(';')[0];
}
function vote(cookie: string, voted: boolean, id = 'pro-git', extra: Record<string, string> = {}) {
  return new Request(`${base}/${id}`, {
    method: 'PUT',
    headers: {
      Cookie: cookie,
      Origin: 'http://academy.test',
      'Content-Type': 'application/json',
      'X-KGLAB-Vote': '1',
      ...extra,
    },
    body: JSON.stringify({ voted }),
  });
}

describe('shared vote storage', () => {
  it('starts with real zero counts, deduplicates retries, shares totals, and removes only your vote', async () => {
    const voting = service();
    const alice = await visitor(voting),
      bob = await visitor(voting);
    const initial = await (
      await voting.handle(new Request(base, { headers: { Cookie: alice } }))
    ).json();
    expect(Object.keys(initial.votes)).toHaveLength(resources.length);
    expect(initial.votes['pro-git']).toEqual({ count: 0, voted: false });
    for (let i = 0; i < 3; i++) {
      const response = await voting.handle(vote(alice, true));
      expect((await response.json()).votes['pro-git']).toEqual({ count: 1, voted: true });
    }
    const other = await voting.handle(new Request(base, { headers: { Cookie: bob } }));
    expect((await other.json()).votes['pro-git']).toEqual({ count: 1, voted: false });
    expect((await (await voting.handle(vote(bob, true))).json()).votes['pro-git'].count).toBe(2);
    for (let i = 0; i < 2; i++)
      expect((await (await voting.handle(vote(alice, false))).json()).votes['pro-git']).toEqual({
        count: 1,
        voted: false,
      });
    expect(
      (await (await voting.handle(new Request(base, { headers: { Cookie: bob } }))).json()).votes[
        'pro-git'
      ],
    ).toEqual({ count: 1, voted: true });
  });
  it('retains totals and browser identity after closing and reopening the database', async () => {
    const folder = mkdtempSync(join(tmpdir(), 'kglab-vote-test-'));
    cleanup.push(() => rmSync(folder, { recursive: true, force: true }));
    const options = { databasePath: join(folder, 'votes.sqlite') };
    const first = createVotingService(options);
    const cookie = await visitor(first);
    await first.handle(vote(cookie, true));
    first.close();
    const restored = service(options);
    const response = await restored.handle(new Request(base, { headers: { Cookie: cookie } }));
    expect(response.headers.get('set-cookie')).toBeNull();
    expect((await response.json()).votes['pro-git']).toEqual({ count: 1, voted: true });
  });
  it('retains connection quotas across a database restart', async () => {
    const folder = mkdtempSync(join(tmpdir(), 'kglab-quota-test-'));
    cleanup.push(() => rmSync(folder, { recursive: true, force: true }));
    const databasePath = join(folder, 'votes.sqlite');
    const first = createVotingService({ databasePath, identitiesPerHour: 1 });
    await first.handle(new Request(base), { clientAddress: '192.0.2.1' });
    first.close();
    const restored = service({ databasePath, identitiesPerHour: 1 });
    expect((await restored.handle(new Request(base), { clientAddress: '192.0.2.1' })).status).toBe(
      429,
    );
  });
  it('also prevents duplicates at the database constraint, with no negative totals', () => {
    const store = new VoteStore(':memory:');
    cleanup.push(() => store.close());
    store.setVote('pro-git', 'visitor', true);
    expect(store.setVote('pro-git', 'visitor', true)['pro-git'].count).toBe(1);
    store.setVote('pro-git', 'visitor', false);
    expect(store.setVote('pro-git', 'visitor', false)['pro-git'].count).toBe(0);
    expect(() => store.setVote('unlisted', 'visitor', true)).toThrow('Unknown resource');
  });
});

describe('anonymous voting API', () => {
  it('sets a signed, HttpOnly cookie and prevents shared-cache reuse', async () => {
    const voting = service({ secureCookie: true });
    const response = await voting.handle(new Request(base));
    expect(response.headers.get('set-cookie')).toContain(
      'HttpOnly; SameSite=Lax; Max-Age=31536000; Secure',
    );
    expect(response.headers.get('set-cookie')).toContain('Path=/api/community');
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('vary')).toBe('Cookie');
  });
  it('rejects forged identity cookies and accepts the original cookie', async () => {
    const voting = service();
    const cookie = await visitor(voting);
    const forged = cookie.replace(/.$/, cookie.endsWith('a') ? 'b' : 'a');
    expect((await voting.handle(vote(forged, true))).status).toBe(409);
    expect((await voting.handle(vote('', true))).status).toBe(409);
    expect((await voting.handle(vote(cookie, true))).status).toBe(200);
  });
  it('requires same-origin JSON writes and supports an explicit reverse-proxy origin', async () => {
    const voting = service();
    const cookie = await visitor(voting);
    expect(
      (await voting.handle(vote(cookie, true, 'pro-git', { Origin: 'https://other.test' }))).status,
    ).toBe(403);
    expect(
      (await voting.handle(vote(cookie, true, 'pro-git', { 'X-KGLAB-Vote': '' }))).status,
    ).toBe(403);
    expect(
      (await voting.handle(vote(cookie, true, 'pro-git', { 'Content-Type': 'text/plain' }))).status,
    ).toBe(415);
    const proxied = service({ publicOrigin: 'https://learn.example.test' });
    const proxyCookie = await visitor(proxied);
    expect(
      (
        await proxied.handle(
          vote(proxyCookie, true, 'pro-git', { Origin: 'https://learn.example.test' }),
        )
      ).status,
    ).toBe(200);
  });
  it('rejects unknown resources, unsupported methods, malformed JSON, and oversized bodies', async () => {
    const voting = service();
    const cookie = await visitor(voting);
    expect((await voting.handle(vote(cookie, true, 'unknown'))).status).toBe(404);
    expect((await voting.handle(new Request(`${base}/pro-git`, { method: 'POST' }))).status).toBe(
      405,
    );
    for (const body of [
      '{broken',
      '{"voted":"true"}',
      '{"voted":true,"extra":1}',
      'x'.repeat(300),
    ]) {
      const request = vote(cookie, true);
      expect((await voting.handle(new Request(request, { body }))).status).toBe(400);
    }
    expect((await voting.handle(new Request('http://academy.test/api/unlisted'))).status).toBe(404);
  });
  it('bounds write frequency without changing counts when a write is rejected', async () => {
    const voting = service({ writesPerMinute: 1 });
    const cookie = await visitor(voting);
    await voting.handle(vote(cookie, true));
    const response = await voting.handle(vote(cookie, false));
    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBeTruthy();
    expect(
      (await (await voting.handle(new Request(base, { headers: { Cookie: cookie } }))).json())
        .votes['pro-git'].count,
    ).toBe(1);
  });
});
