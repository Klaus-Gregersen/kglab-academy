import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';
import type { IncomingMessage } from 'node:http';

export class SafetyError extends Error {
  status: number;
  retryAfter?: number;
  constructor(status: number, message: string, retryAfter?: number) {
    super(message);
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

export function normalizeAddress(value: string): string {
  const address = value.startsWith('::ffff:') ? value.slice(7) : value;
  if (isIP(address) === 6) return new URL(`http://[${address}]`).hostname.slice(1, -1);
  return isIP(address) ? address.toLowerCase() : '';
}

export function resolveClient(
  request: IncomingMessage,
  trustedProxies: string[] = [],
  clientHeader = 'x-real-ip',
): string {
  const peer = normalizeAddress(request.socket.remoteAddress ?? '');
  if (!peer) return 'unknown';
  if (!trustedProxies.includes(peer)) return peer;
  const forwarded = request.headers[clientHeader];
  const address = typeof forwarded === 'string' ? normalizeAddress(forwarded.trim()) : '';
  // A trusted proxy must overwrite this single-address header. No arbitrary X-Forwarded-For chain.
  if (!address)
    throw new SafetyError(400, 'A valid client address is required from the configured proxy.');
  return address;
}

export function privateAddressKey(address: string, secret: string) {
  const normalized = normalizeAddress(address) || address;
  let scope = normalized;
  if (isIP(normalized) === 6) {
    const [left, right = ''] = normalized.split('::');
    const first = left ? left.split(':') : [];
    const last = right ? right.split(':') : [];
    scope =
      [...first, ...Array(8 - first.length - last.length).fill('0'), ...last]
        .slice(0, 4)
        .map((part) => parseInt(part, 16).toString(16))
        .join(':') + '::/64';
  }
  return createHmac('sha256', secret).update(`address:${scope}`).digest('hex');
}

export class TrafficLimits {
  private clients = new Map<string, { count: number; until: number }>();
  private global = { count: 0, until: 0 };
  constructor(privateLimit: { requestsPerMinute?: number; globalPerMinute?: number } = {}) {
    this.perClient = privateLimit.requestsPerMinute ?? 120;
    this.globalLimit = privateLimit.globalPerMinute ?? 1200;
  }
  private perClient: number;
  private globalLimit: number;

  check(client: string, now = Date.now()) {
    if (this.global.until <= now) {
      this.global = { count: 0, until: now + 60000 };
      this.clients.clear();
    }
    if (++this.global.count > this.globalLimit)
      throw new SafetyError(
        429,
        'The shelf is busy. Please try again shortly.',
        Math.max(1, Math.ceil((this.global.until - now) / 1000)),
      );
    const current = this.clients.get(client);
    const bucket = current && current.until > now ? current : { count: 0, until: now + 60000 };
    if (!current && this.clients.size >= 10000)
      throw new SafetyError(429, 'The shelf is busy. Please try again shortly.', 60);
    this.clients.set(client, bucket);
    if (++bucket.count > this.perClient)
      throw new SafetyError(
        429,
        'Too many requests. Please try again shortly.',
        Math.max(1, Math.ceil((bucket.until - now) / 1000)),
      );
  }
}
