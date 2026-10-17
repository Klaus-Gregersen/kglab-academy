import { describe, expect, it } from 'vitest';
import { resources } from './resources';
import { orderResources, parseVotes, type VoteSnapshot } from './voting';

describe('community rankings', () => {
  const votes: VoteSnapshot = Object.fromEntries(
    resources.map(({ id }) => [id, { count: 0, voted: false }]),
  );
  it('puts most-upvoted resources first without changing the input or inventing tie-break scores', () => {
    const scores = {
      ...votes,
      'odin-project': { count: 4, voted: false },
      'pro-git': { count: 2, voted: true },
    };
    const ranked = orderResources(resources, scores, 'votes');
    expect(ranked.slice(0, 2).map((resource) => resource.id)).toEqual(['odin-project', 'pro-git']);
    expect(resources[0].id).toBe('missing-semester');
    expect(orderResources(resources, votes, 'votes')).toEqual(resources);
    expect(orderResources(resources, null, 'votes')).toEqual(resources);
  });
  it('can sort the filtered collection alphabetically', () => {
    const web = resources.filter((resource) => resource.category === 'Web');
    expect(orderResources(web, votes, 'title').map((resource) => resource.id)).toEqual([
      'mdn-learn',
      'odin-project',
    ]);
  });
  it('accepts only complete, valid server counts', () => {
    expect(parseVotes({ votes })).toEqual(votes);
    for (const data of [
      null,
      {},
      { votes: {} },
      { votes: { ...votes, 'pro-git': { count: -1, voted: false } } },
      { votes: { ...votes, 'pro-git': { count: 1, voted: 'true' } } },
    ])
      expect(() => parseVotes(data)).toThrow('Invalid vote response');
  });
});
