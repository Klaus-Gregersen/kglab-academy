import { describe, expect, it } from 'vitest';
import type { IncomingMessage } from 'node:http';
import { TrafficLimits, resolveClient, privateAddressKey } from './limits.ts';
import { securityConfig } from './config.ts';
import { VoteStore, createVotingService } from './voting.ts';

describe('deployment security boundaries', () => {
  it('rejects missing or insecure production configuration', () => {
    expect(() => securityConfig({ NODE_ENV: 'production' })).toThrow('HTTPS');
    for (const origin of [
      'http://academy.test',
      'https://user:pass@academy.test',
      'https://academy.test/path',
    ])
      expect(() =>
        securityConfig({ NODE_ENV: 'production', KGLAB_PUBLIC_ORIGIN: origin }),
      ).toThrow();
    expect(
      securityConfig({ NODE_ENV: 'production', KGLAB_PUBLIC_ORIGIN: 'https://academy.test' })
        .secureCookie,
    ).toBe(true);
    expect(() => securityConfig({ KGLAB_TRUSTED_PROXIES: '0.0.0.0/0' })).toThrow();
    expect(() => securityConfig({ KGLAB_IDENTITIES_PER_HOUR: '0' })).toThrow();
  });
  it('ignores spoofed forwarding headers unless the socket peer is explicitly trusted', () => {
    const request = {
      socket: { remoteAddress: '::ffff:192.0.2.10' },
      headers: { 'x-real-ip': '198.51.100.5', 'cf-connecting-ip': '198.51.100.9' },
    } as unknown as IncomingMessage;
    expect(resolveClient(request)).toBe('192.0.2.10');
    expect(resolveClient(request, ['192.0.2.10'])).toBe('198.51.100.5');
    expect(resolveClient(request, ['192.0.2.10'], 'cf-connecting-ip')).toBe('198.51.100.9');
    request.headers['x-real-ip'] = '198.51.100.5, 198.51.100.6';
    expect(() => resolveClient(request, ['192.0.2.10'])).toThrow('valid client');
  });
  it('groups IPv6 addresses from the same /64 and stores only an HMAC key', () => {
    expect(privateAddressKey('2001:db8:1:2::1', 'test-secret')).toBe(
      privateAddressKey('2001:0db8:0001:0002::2', 'test-secret'),
    );
    expect(privateAddressKey('2001:db8:1:3::1', 'test-secret')).not.toBe(
      privateAddressKey('2001:db8:1:2::1', 'test-secret'),
    );
    expect(privateAddressKey('192.0.2.1', 'test-secret')).not.toContain('192.0.2.1');
  });
  it('bounds per-connection and global requests and recovers after the window', () => {
    const limited = new TrafficLimits({ requestsPerMinute: 1, globalPerMinute: 3 });
    limited.check('a', 1000);
    expect(() => limited.check('a', 1001)).toThrow('Too many');
    limited.check('b', 1002);
    expect(() => limited.check('c', 1003)).toThrow('busy');
    expect(() => limited.check('a', 62000)).not.toThrow();
  });
});

describe('bounded vote storage and identity issuance', () => {
  it('allows undo and idempotent retries at capacity, and caches totals correctly', () => {
    const store = new VoteStore(':memory:', 1);
    try {
      store.setVote('pro-git', 'a', true);
      expect(store.setVote('pro-git', 'a', true)['pro-git'].count).toBe(1);
      expect(() => store.setVote('pro-git', 'b', true)).toThrow('capacity');
      store.setVote('pro-git', 'a', false);
      expect(store.setVote('pro-git', 'b', true)['pro-git'].count).toBe(1);
    } finally {
      store.close();
    }
  });
  it('does not let fresh cookies bypass the connection identity budget', async () => {
    const service = createVotingService({ databasePath: ':memory:', identitiesPerHour: 1 });
    const request = () => new Request('http://academy.test/api/community/votes');
    try {
      const first = await service.handle(request(), { clientAddress: '192.0.2.1' });
      const second = await service.handle(request(), { clientAddress: '192.0.2.1' });
      expect(first.status).toBe(200);
      expect(second.status).toBe(429);
      expect(second.headers.get('set-cookie')).toBeNull();
      expect((await service.handle(request(), { clientAddress: '192.0.2.2' })).status).toBe(200);
      expect(
        (
          await service.handle(
            new Request(request(), {
              headers: { Cookie: first.headers.get('set-cookie')!.split(';')[0] },
            }),
            { clientAddress: '192.0.2.1' },
          )
        ).status,
      ).toBe(200);
    } finally {
      service.close();
    }
  });
});
