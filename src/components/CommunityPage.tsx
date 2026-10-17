import { useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  ArrowUp,
  Bookmark,
  Check,
  GitBranch,
  Search,
} from 'lucide-react';
import { categories, filterResources, type Category } from '../community/resources';
import { loadFavorites, saveFavorites } from '../community/favorites';
import { browserStorage } from '../state/progress';
import { useCommunityVotes } from '../community/useCommunityVotes';
import { orderResources, type ResourceOrder } from '../community/voting';

const REPO = 'https://github.com/Klaus-Gregersen/kglab-academy';

export function CommunityPage() {
  const [category, setCategory] = useState<Category | 'All'>('All');
  const [query, setQuery] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [favorites, setFavorites] = useState(() => loadFavorites(browserStorage()));
  const [saved, setSaved] = useState(true);
  const [notice, setNotice] = useState('');
  const [order, setOrder] = useState<ResourceOrder>('votes');
  const voting = useCommunityVotes();
  const matches = orderResources(
    filterResources(category, query, favorites, onlyFavorites),
    voting.votes,
    order,
  );

  function toggleFavorite(id: string, title: string) {
    const wasSaved = favorites.includes(id);
    const next = wasSaved ? favorites.filter((item) => item !== id) : [...favorites, id];
    const persisted = saveFavorites(next, browserStorage());
    setFavorites(next);
    setSaved(persisted);
    setNotice(
      `${title} ${wasSaved ? 'removed from' : 'added to'} your favorites.${persisted ? '' : ' Favorites are available for this visit only.'}`,
    );
  }

  return (
    <main id="community" className="community page-width">
      <section className="community-intro">
        <div className="eyebrow">
          <span className="status-dot" /> THE COMMUNITY SHELF
        </div>
        <h1>
          Good learning travels<span className="green">.</span>
        </h1>
        <p className="community-lead">
          A useful repo. A clear explanation. A course that made something click. Pass it on.
        </p>
        <p>
          Our goal is to help you learn, wherever that happens. Explore free learning material from
          people and projects we can learn from, too.
        </p>
        <a className="text-link" href="#share-resource">
          Know something worth sharing? <ArrowDown size={14} />
        </a>
      </section>

      <section aria-labelledby="shelf-title">
        <div className="shelf-heading">
          <div>
            <h2 id="shelf-title">Find your next rabbit hole.</h2>
            <p>Upvote what helped you. Community votes bring useful links to the top.</p>
          </div>
          <span className="shelf-note">Free learning material · External sites</span>
        </div>
        <div className="resource-controls">
          <label className="resource-search">
            <Search size={16} />
            <span className="sr-only">Search resources</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search a topic, project, or tool…"
            />
          </label>
          <label className="resource-sort">
            <span className="sr-only">Sort resources</span>
            <select
              aria-label="Sort resources"
              value={order}
              onChange={(event) => setOrder(event.target.value as ResourceOrder)}
            >
              <option value="votes">Most upvoted</option>
              <option value="title">A–Z</option>
            </select>
          </label>
          <button
            className="favorites-filter"
            type="button"
            aria-pressed={onlyFavorites}
            onClick={() => setOnlyFavorites(!onlyFavorites)}
          >
            <Bookmark size={15} /> My favorites <span>{favorites.length}</span>
          </button>
        </div>
        <div className="category-filters" role="group" aria-label="Resource category">
          {(['All', ...categories] as const).map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={category === item}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="resource-results">
          <span role="status">
            {matches.length} {matches.length === 1 ? 'resource' : 'resources'}
          </span>
          <span>
            {saved
              ? 'Bookmarks stay on this device. Upvotes are shared.'
              : 'Favorites are available for this visit only; your browser could not save them.'}
          </span>
        </div>
        <div className="voting-status">
          <p role="status">
            {voting.error ||
              (voting.loading && !voting.votes
                ? 'Loading community votes…'
                : 'One upvote per resource per browser. Click again to undo.')}
          </p>
          {voting.error && (
            <button
              type="button"
              className="text-link"
              disabled={voting.loading || !!voting.pending}
              onClick={() => void voting.refresh()}
            >
              {voting.loading ? 'Refreshing…' : 'Refresh votes'}
            </button>
          )}
        </div>
        <p className="sr-only" role="status">
          {notice}
        </p>
        <p className="sr-only" role="status">
          {voting.notice}
        </p>
        <div className="resource-list">
          {matches.map((resource) => {
            const favorite = favorites.includes(resource.id);
            const vote = voting.votes?.[resource.id];
            return (
              <article
                className="resource-card"
                key={resource.id}
                aria-labelledby={`resource-${resource.id}`}
              >
                <div className="resource-category">
                  {resource.category}
                  <span>{resource.format}</span>
                </div>
                <div className="resource-copy">
                  <span className="resource-publisher">{resource.publisher}</span>
                  <h3 id={`resource-${resource.id}`}>
                    <a href={resource.url} target="_blank" rel="noreferrer">
                      {resource.title}
                      <ArrowUpRight size={17} />
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  </h3>
                  <p>{resource.description}</p>
                  <p className="resource-access">{resource.access}</p>
                  <div className="resource-meta">
                    <span>{resource.level}</span>
                    <button
                      className="resource-bookmark"
                      type="button"
                      aria-pressed={favorite}
                      aria-label={`${favorite ? 'Unsave' : 'Save'} ${resource.title}`}
                      onClick={() => toggleFavorite(resource.id, resource.title)}
                    >
                      {favorite ? <Check size={12} /> : <Bookmark size={12} />}
                      {favorite ? 'Saved' : 'Save for later'}
                    </button>
                    {resource.repository && (
                      <a href={resource.repository} target="_blank" rel="noreferrer">
                        <GitBranch size={12} /> Explore the repository <ArrowUpRight size={12} />
                      </a>
                    )}
                  </div>
                </div>
                <button
                  className="resource-upvote"
                  type="button"
                  aria-pressed={vote?.voted ?? false}
                  aria-label={`${vote?.voted ? 'Remove upvote for' : 'Upvote'} ${resource.title}`}
                  aria-describedby={`votes-${resource.id}`}
                  disabled={!voting.available || !!voting.pending}
                  aria-busy={voting.pending === resource.id}
                  onClick={() => void voting.toggleVote(resource.id, resource.title)}
                >
                  <ArrowUp size={18} />
                  <strong>{vote ? vote.count.toLocaleString() : '—'}</strong>
                  <span className="sr-only" id={`votes-${resource.id}`}>
                    {vote ? `${vote.count} community upvotes` : 'Community votes unavailable'}
                  </span>
                  <span>
                    {voting.pending === resource.id
                      ? 'Saving…'
                      : vote?.count === 1
                        ? 'upvote'
                        : 'upvotes'}
                  </span>
                </button>
              </article>
            );
          })}
          {!matches.length && (
            <div className="resource-empty">
              <h3>{onlyFavorites ? 'Your shelf is waiting.' : 'No resources found.'}</h3>
              <p>
                {onlyFavorites
                  ? 'Save a resource to find it here later. Try another category or search if you already have favorites.'
                  : 'Try a broader search or another category.'}
              </p>
              <button
                className="text-link"
                type="button"
                onClick={() => {
                  setCategory('All');
                  setQuery('');
                  setOnlyFavorites(false);
                }}
              >
                Browse all resources <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="community-share" id="share-resource" aria-labelledby="share-title">
        <GitBranch size={26} />
        <div>
          <div className="eyebrow">FOUND SOMETHING THAT HELPED?</div>
          <h2 id="share-title">Leave a good trail for the next person.</h2>
          <p>
            Recommend a free repo, course, lab, or guide through a pull request. Tell us who it
            helps, what you learned, and whether it needs an account or local setup.
          </p>
          <details className="resource-contribute">
            <summary>How to suggest a resource</summary>
            <ol>
              <li>Fork the KG LAB Academy repository and create a branch.</li>
              <li>
                Add an entry to <code>src/community/resources.ts</code>. Include the original link,
                category, a short reason, and access requirements.
              </li>
              <li>
                Check that the learning material is free, run the project checks, then commit, push,
                and open a pull request for review.
              </li>
            </ol>
            <p>
              Start with <code>CONTRIBUTING.md</code> in the repository. Guided Git contributions
              will come with Git Fundamentals.
            </p>
            <a className="text-link" href={REPO} target="_blank" rel="noreferrer">
              Open the project on GitHub <ArrowUpRight size={14} />
            </a>
          </details>
          <p className="community-promise">
            Our manifesto: recommend what helps, credit the people who made it, and keep the path
            open. Upvotes help the community surface useful links; new additions still go through an
            open review. This collection started with editorial picks, and every vote comes from a
            visitor.
          </p>
        </div>
      </section>
    </main>
  );
}
