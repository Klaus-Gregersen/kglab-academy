import { resources, type Resource } from './resources';

export type VoteSnapshot = Record<string, { count: number; voted: boolean }>;
export type ResourceOrder = 'votes' | 'title';

export function parseVotes(data: unknown): VoteSnapshot {
  const votes = (data as { votes?: unknown } | null)?.votes;
  if (!votes || typeof votes !== 'object') throw new Error('Invalid vote response');
  const result: VoteSnapshot = {};
  for (const { id } of resources) {
    const entry = (votes as VoteSnapshot)[id];
    if (
      !entry ||
      !Number.isSafeInteger(entry.count) ||
      entry.count < 0 ||
      typeof entry.voted !== 'boolean'
    )
      throw new Error('Invalid vote response');
    result[id] = { count: entry.count, voted: entry.voted };
  }
  return result;
}

export function orderResources(list: Resource[], votes: VoteSnapshot | null, order: ResourceOrder) {
  return [...list].sort((a, b) =>
    order === 'title'
      ? a.title.localeCompare(b.title)
      : (votes?.[b.id]?.count ?? 0) - (votes?.[a.id]?.count ?? 0),
  );
}
