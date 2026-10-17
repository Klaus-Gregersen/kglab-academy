import { isIP } from 'node:net';
import { normalizeAddress } from './limits.ts';

export function securityConfig(env: NodeJS.ProcessEnv = process.env) {
  const production = env.NODE_ENV === 'production';
  const publicOrigin = env.KGLAB_PUBLIC_ORIGIN;
  if (production && !publicOrigin)
    throw new Error('Production requires KGLAB_PUBLIC_ORIGIN with an HTTPS origin.');
  if (publicOrigin) {
    const url = new URL(publicOrigin);
    if (
      url.username ||
      url.password ||
      url.pathname !== '/' ||
      url.search ||
      url.hash ||
      !['http:', 'https:'].includes(url.protocol) ||
      (production && url.protocol !== 'https:')
    )
      throw new Error('KGLAB_PUBLIC_ORIGIN must be a plain HTTPS origin in production.');
  }
  const trustedProxies = (env.KGLAB_TRUSTED_PROXIES ?? '')
    .split(',')
    .filter(Boolean)
    .map((address) => {
      const normalized = normalizeAddress(address.trim());
      if (!isIP(normalized)) throw new Error('Trusted proxies must be explicit IP addresses.');
      return normalized;
    });
  const clientHeader = env.KGLAB_CLIENT_IP_HEADER ?? 'x-real-ip';
  if (!['x-real-ip', 'cf-connecting-ip'].includes(clientHeader))
    throw new Error('Unsupported client IP header.');
  function integer(name: string, fallback: number, maximum: number) {
    const value = env[name] === undefined ? fallback : Number(env[name]);
    if (!Number.isSafeInteger(value) || value < 1 || value > maximum)
      throw new Error(`Invalid ${name}`);
    return value;
  }
  return {
    publicOrigin,
    secureCookie:
      production || env.KGLAB_SECURE_COOKIE === '1' || publicOrigin?.startsWith('https://'),
    trustedProxies,
    clientHeader,
    identitiesPerHour: integer('KGLAB_IDENTITIES_PER_HOUR', 10, 1000),
    maxVotes: integer('KGLAB_MAX_VOTES', 100000, 1000000),
  };
}
