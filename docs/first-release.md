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

The initial source push must complete [Academy CI](https://github.com/Klaus-Gregersen/kglab-academy/actions/workflows/checks.yml), including the container build/startup checks. Then activate the prepared policy requiring pull requests and passing Academy checks on main, with resolved conversations and no force pushes or deletion. Record the verified run and effective policy here after bootstrap.

Public hosting remains a separate operation. Follow [public hosting requirements](public-hosting.md) for image scanning, HTTPS/proxy configuration, network isolation, durable storage, backup/restore, resource limits, and monitoring. Use GitHub-hosted CI for untrusted contributions; keep lab credentials out of the application repository and its pull-request jobs. Anonymous votes are not verified individual people.
