import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { resources } from '../src/community/resources.ts';
import { SafetyError, TrafficLimits, privateAddressKey } from './limits.ts';
import type { VoteSnapshot } from '../src/community/voting.ts';

export const VOTE_COOKIE = 'kglab-voter';
const route = '/api/community/votes';
const resourceIds = new Set(resources.map((resource) => resource.id));

export class VoteStore {
  private database: DatabaseSync;
  readonly secret: string;

  private readonly maxVotes: number;
  constructor(path: string, maxVotes = 100000) {
    this.maxVotes = maxVotes;
    if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    this.database = new DatabaseSync(path, { timeout: 5000 });
    this.database.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;
      PRAGMA journal_size_limit = 4194304;
      PRAGMA wal_autocheckpoint = 256;
      CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL) STRICT;
      CREATE TABLE IF NOT EXISTS votes (
        resource_id TEXT NOT NULL,
        voter TEXT NOT NULL,
        PRIMARY KEY (resource_id, voter)
      ) STRICT;
      CREATE INDEX IF NOT EXISTS votes_by_voter ON votes(voter);
      CREATE TABLE IF NOT EXISTS quota (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL) STRICT;
      CREATE INDEX IF NOT EXISTS quota_expiry ON quota(expires);
      CREATE TABLE IF NOT EXISTS vote_totals (resource_id TEXT PRIMARY KEY, count INTEGER NOT NULL CHECK(count >= 0)) STRICT;
      BEGIN IMMEDIATE;
      DELETE FROM vote_totals;
      INSERT INTO vote_totals SELECT resource_id, COUNT(*) FROM votes GROUP BY resource_id;
      COMMIT;
      CREATE TRIGGER IF NOT EXISTS vote_added AFTER INSERT ON votes BEGIN
        INSERT INTO vote_totals VALUES (NEW.resource_id, 1) ON CONFLICT(resource_id) DO UPDATE SET count=count+1;
      END;
      CREATE TRIGGER IF NOT EXISTS vote_removed AFTER DELETE ON votes BEGIN
        UPDATE vote_totals SET count=count-1 WHERE resource_id=OLD.resource_id;
      END;
    `);
    const pageSize = Number(
      (this.database.prepare('PRAGMA page_size').get() as { page_size: number }).page_size,
    );
    this.database.exec(`PRAGMA max_page_count = ${Math.floor((64 * 1024 * 1024) / pageSize)}`);
    this.database
      .prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)')
      .run('cookie-secret', randomBytes(32).toString('hex'));
    this.secret = (
      this.database.prepare('SELECT value FROM settings WHERE key = ?').get('cookie-secret') as {
        value: string;
      }
    ).value;
  }

  snapshot(voter: string): VoteSnapshot {
    const counts = this.database.prepare('SELECT resource_id, count FROM vote_totals').all() as {
      resource_id: string;
      count: number;
    }[];
    const mine = this.database
      .prepare('SELECT resource_id FROM votes WHERE voter = ?')
      .all(voter) as { resource_id: string }[];
    const voted = new Set(mine.map((row) => row.resource_id));
    const totals = new Map(counts.map((row) => [row.resource_id, row.count]));
    return Object.fromEntries(
      resources.map(({ id }) => [id, { count: totals.get(id) ?? 0, voted: voted.has(id) }]),
    );
  }

  // Set the intended state, rather than toggling: retried requests cannot add votes twice.
  setVote(id: string, voter: string, voted: boolean): VoteSnapshot {
    if (!resourceIds.has(id)) throw new Error('Unknown resource');
    if (
      voted &&
      !this.database.prepare('SELECT 1 FROM votes WHERE resource_id=? AND voter=?').get(id, voter)
    ) {
      const total = this.database
        .prepare('SELECT COALESCE(SUM(count),0) AS count FROM vote_totals')
        .get() as { count: number };
      if (total.count >= this.maxVotes)
        throw new SafetyError(
          503,
          'Voting capacity has been reached. Existing upvotes can still be removed.',
        );
    }
    if (voted)
      this.database
        .prepare('INSERT OR IGNORE INTO votes (resource_id, voter) VALUES (?, ?)')
        .run(id, voter);
    else
      this.database.prepare('DELETE FROM votes WHERE resource_id = ? AND voter = ?').run(id, voter);
    return this.snapshot(voter);
  }

  consumeQuota(key: string, maximum: number, period: number, now = Date.now()) {
    this.database.prepare('DELETE FROM quota WHERE expires <= ?').run(now);
    const previous = this.database
      .prepare('SELECT count, expires FROM quota WHERE key = ?')
      .get(key) as { count: number; expires: number } | undefined;
    if (previous && previous.count >= maximum)
      throw new SafetyError(
        429,
        'Voting activity from this connection is limited. Please try again later.',
        Math.max(1, Math.ceil((previous.expires - now) / 1000)),
      );
    if (
      !previous &&
      (this.database.prepare('SELECT COUNT(*) AS count FROM quota').get() as { count: number })
        .count >= 10000
    )
      throw new SafetyError(429, 'Voting is busy. Please try again later.', 60);
    this.database
      .prepare('INSERT INTO quota VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1')
      .run(key, now + period);
  }

  close() {
    this.database.close();
  }
}

function sign(id: string, secret: string) {
  return createHmac('sha256', secret).update(id).digest('base64url');
}

function identity(cookie: string | null, secret: string): string | null {
  const value = cookie
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${VOTE_COOKIE}=`))
    ?.slice(VOTE_COOKIE.length + 1);
  if (!value || !/^[a-f0-9]{64}\.[A-Za-z0-9_-]{43}$/.test(value)) return null;
  const [id, signature] = value.split('.');
  const expected = sign(id, secret);
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected)) ? id : null;
}

function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      Vary: 'Cookie',
      ...headers,
    },
  });
}

async function readVote(request: Request): Promise<boolean> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Missing body');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 256) {
        await reader.cancel();
        throw new Error('Body too large');
      }
      chunks.push(value);
    }
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!body || typeof body.voted !== 'boolean' || Object.keys(body).length !== 1)
      throw new Error('Invalid vote');
    return body.voted;
  } finally {
    reader.releaseLock();
  }
}

export function createVotingService(options: {
  databasePath: string;
  publicOrigin?: string;
  secureCookie?: boolean;
  writesPerMinute?: number;
  maxVotes?: number;
  identitiesPerHour?: number;
  requestsPerMinute?: number;
  globalPerMinute?: number;
}) {
  const store = new VoteStore(options.databasePath, options.maxVotes);
  const origin = options.publicOrigin ? new URL(options.publicOrigin).origin : undefined;
  const limits = new TrafficLimits(options);

  async function handle(
    request: Request,
    context: { clientAddress: string } = { clientAddress: 'unknown' },
  ): Promise<Response> {
    try {
      const client = privateAddressKey(context.clientAddress, store.secret);
      limits.check(client);
      const url = new URL(request.url);
      const existing = identity(request.headers.get('cookie'), store.secret);
      if (request.method === 'GET' && url.pathname === route) {
        if (!existing)
          store.consumeQuota(`identity:${client}`, options.identitiesPerHour ?? 10, 3600000);
        const id = existing ?? randomBytes(32).toString('hex');
        const headers: Record<string, string> = {};
        if (!existing)
          headers['Set-Cookie'] =
            `${VOTE_COOKIE}=${id}.${sign(id, store.secret)}; Path=/api/community; HttpOnly; SameSite=Lax; Max-Age=31536000${options.secureCookie ? '; Secure' : ''}`;
        return json(
          { votes: store.snapshot(createHash('sha256').update(id).digest('hex')) },
          200,
          headers,
        );
      }
      if (!url.pathname.startsWith(`${route}/`)) return json({ error: 'Not found.' }, 404);
      if (request.method !== 'PUT')
        return json({ error: 'Method not allowed.' }, 405, { Allow: 'PUT' });
      if (
        request.headers.get('origin') !== (origin ?? url.origin) ||
        request.headers.get('x-kglab-vote') !== '1'
      )
        return json({ error: 'Vote from the community page on this site.' }, 403);
      if (!existing)
        return json(
          {
            error:
              'Cookies are needed to remember your vote. Enable cookies, then refresh the shelf.',
          },
          409,
        );
      const id = url.pathname.slice(route.length + 1);
      if (!resourceIds.has(id)) return json({ error: 'This resource is not on the shelf.' }, 404);
      if (
        request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !==
        'application/json'
      )
        return json({ error: 'Send a JSON vote.' }, 415);
      const voter = createHash('sha256').update(existing).digest('hex');
      store.consumeQuota(`write:${client}`, options.writesPerMinute ?? 30, 60000);
      let voted: boolean;
      try {
        voted = await readVote(request);
      } catch {
        return json({ error: 'Send voted as true or false.' }, 400);
      }
      return json({ votes: store.setVote(id, voter, voted) });
    } catch (cause) {
      if (cause instanceof SafetyError)
        return json(
          { error: cause.message },
          cause.status,
          cause.retryAfter ? { 'Retry-After': String(cause.retryAfter) } : {},
        );
      return json({ error: 'Voting is temporarily unavailable. Please try again.' }, 503);
    }
  }

  return { handle, close: () => store.close() };
}
