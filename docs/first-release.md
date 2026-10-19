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

Signed commit `245e52fafaaa37850cd4ffca88b9079bbf321595` corrected the directory destination and added build-time checks for the entry point and runtime imports. The [corrected Academy CI run](https://github.com/Klaus-Gregersen/kglab-academy/actions/runs/39011512107) passed, including the production container build and constrained startup.

After that successful run, ruleset **25267613** was extended to require pull requests, passing Academy checks from GitHub Actions, up-to-date branches, and resolved review conversations. Force pushes and deletion remain blocked, with no bypass actors. Effective rules for main were read back to confirm activation.

Preparation of image publishing and the homelab rollout is tracked in [the k3s deployment guide](k3s-deployment.md). The successful first-release run did not publish a registry image or deploy a cluster workload.

Public hosting remains a separate operation. Follow [public hosting requirements](public-hosting.md) for image scanning, HTTPS/proxy configuration, network isolation, durable storage, backup/restore, resource limits, and monitoring. Use GitHub-hosted CI for untrusted contributions; keep lab credentials out of the application repository and its pull-request jobs. Anonymous votes are not verified individual people.
