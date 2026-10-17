# First release: 0.1.0

The first release publishes the application source. It does not expose a public application, connect the homelab, or install GitOps.

## Scope

- One complete beginner terminal course with seven missions, optional walkthroughs, completion, history, hints, and saved progress.
- Ten curated community resources with search, categories, bookmarks, shared upvotes, and undo.
- A browser-only simulated terminal and a bounded Node/SQLite voting service.
- Repository checks, secret safeguards, hardened server/container configuration, and deployment documentation. Future courses remain marked planned.

## Local review, 2026-10-17

- 114 unit tests, 3 production HTTP checks, and 34 desktop/mobile browser checks passed.
- Strict TypeScript checking, the production build, and formatting passed.
- The locked dependency audit reported no known vulnerabilities. This is a point-in-time result, not a guarantee.
- The candidate-file secret guard passed. Runtime votes, dependencies, generated assets, environment files, and private credential paths are excluded from the commit.
- All five included screenshots were visually reviewed for private information. They record earlier UI iterations; the current automated browser tests cover the release behavior.

## Publication and hosting gates

The owner published signed commit `47d1813b15b820a391ef5e47beec1093ba32dd86`; GitHub verified its signature. The [initial Academy CI run](https://github.com/Klaus-Gregersen/kglab-academy/actions/runs/39011209833) passed the secret guard, formatting, unit tests, build, HTTP checks, browser checks, dependency audit, and container build. The final container startup check failed because `/app/server/start.ts` was missing from the image: the multi-source Docker COPY destination lacked its directory slash.

The local correction makes `server/` an explicit directory and checks the entry point and runtime imports during the image build. It still needs a signed commit/push and a successful GitHub CI run.

After that successful run, activate the prepared policy requiring pull requests and passing Academy checks on main, with resolved conversations and no force pushes or deletion. The original history-protection ruleset remains active in the meantime. The PR/check policy is not yet enabled.

Public hosting remains a separate operation. Follow [public hosting requirements](public-hosting.md) for image scanning, HTTPS/proxy configuration, network isolation, durable storage, backup/restore, resource limits, and monitoring. Use GitHub-hosted CI for untrusted contributions; keep lab credentials out of the application repository and its pull-request jobs. Anonymous votes are not verified individual people.
