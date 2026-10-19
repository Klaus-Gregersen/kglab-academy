# Repository and push protections

Public visibility lets people read and fork the code. It does not grant permission to push or merge into this repository. Contributors propose changes through pull requests; maintainers control merges. Protect the owner's GitHub account with a passkey or 2FA and keep recovery methods safe.

## Verified GitHub state

On 2026-10-16, authenticated API reads confirmed:

- Public repository, default branch named `main`, with no remote branches yet.
- Secret scanning enabled.
- Secret scanning push protection enabled.
- No repository rulesets existed at the start of this hardening work.
- Dependabot security updates were disabled at the start.

Subsequent authenticated reads confirmed the changes applied in this task:

- Ruleset **25267613** was extended to **Require PRs and passing checks** after the successful first release CI run. It requires pull requests, resolved review conversations, an up-to-date branch, and **Academy checks** from GitHub Actions (integration 15368). Force pushes and deletion are blocked, with no bypass actors.
- Dependabot security updates and private vulnerability reporting are enabled.
- Default workflow token permission is read-only; Actions cannot approve pull requests.
- All external contributors' fork workflows require maintainer approval.
- The local staged-secret hook is configured through `core.hooksPath=.githooks`.
- The owner published signed commits `47d1813` and `245e52f`; GitHub verified their signatures. [The corrected first-release CI run passed](https://github.com/Klaus-Gregersen/kglab-academy/actions/runs/39011512107), including container build and startup.

The implementation's final verification records the settings actually applied. Source files alone do not activate GitHub settings, and a local test pass does not mean GitHub CI has run.

## Local safeguards

`.gitignore` and `.dockerignore` exclude environment files, private keys, credential files, runtime data, and test output. `.env.example` is deliberately public and contains no secrets. Ignore rules do not protect secrets that are already tracked.

`pnpm security:check` checks candidate files for private paths and common credential patterns. `pnpm security:staged` reads the actual staged versions. The local pre-commit hook runs the staged check when configured with `pnpm security:hooks`; it requires Node on the Git client's PATH. Local hooks can be bypassed, so GitHub push protection and review remain necessary. The scanner does not prove there are no secrets and does not scan image contents or Git history.

## First push and protected main

The initial source push is complete. `deploy/security/main-baseline.json` records the baseline used to establish the default branch. That baseline has been replaced by the PR/check policy on GitHub.

After the first successful **Academy checks** run, the policy represented by `deploy/security/main-after-bootstrap.json` was activated, with the required check additionally bound to GitHub Actions:

- Changes to `main` go through a pull request.
- **Academy checks** must pass and the branch must be up to date.
- Review conversations must be resolved.
- Force pushes and branch deletion stay blocked.
- No administrative bypass is configured in the policy.

The active policy was verified through the effective rules for `main`. In GitHub, open Settings → Rules → Rulesets to inspect it. The JSON template omits the integration ID for portability; the active repository rule requires integration 15368. Future changes go through a branch and pull request, not a direct push to main.

This is currently a single-maintainer setup: the template requires a PR but **zero independent approving reviews**, because an author cannot approve their own PR. Public contributors still cannot merge without write permission. `.github/CODEOWNERS` routes review to the repository owner; routing alone does not enforce approval. Before granting others write access, require at least one trusted independent approval and enable code-owner review. Review the collaborator list before granting access. Requiring approvals without another eligible reviewer would lock normal changes until the policy is adjusted.

## CI and dependency changes

The `Academy checks` job in `.github/workflows/checks.yml` uses GitHub-hosted disposable runners, a read-only contents token, no persisted checkout credential, immutable Action commit IDs, and no deployment steps or production secrets. It runs the secret guard, formatting, unit tests, build, HTTP security checks, browser tests, dependency audit, image vulnerability scan, and constrained startup check. It uses `pull_request`, never `pull_request_target` to execute contributor code.

The container-publishing change adds a separate job that runs only after successful checks on a push to protected main. Only this publisher has `packages: write`. It downloads the exact tested image from the same workflow run with artifact digest verification, then publishes a commit-tagged image using the built-in `GITHUB_TOKEN`. It has no checkout, personal token, cluster credential, or GitOps write token. Pull requests cannot run the publisher. Source preparation does not establish that publication has run successfully; the deployment guide records those gates.

Require approval of workflows from external contributors in GitHub Actions settings before spending runner time. Keep workflow permissions read-only and disable Actions approving pull requests. Do not attach a privileged homelab/self-hosted runner to untrusted public pull requests.

Dependabot configuration proposes npm, Docker, and Action updates weekly. Review changes; there is no automatic merge or automatic deployment. Docker base images and Actions are pinned to verified digests/commits; updates intentionally require a reviewed change.

Secret push protection detects supported credential patterns before a push. Branch rules control what can land on `main`. CI checks behavior after a push/PR. These are separate layers, not substitutes for one another. If a credential is leaked, revoke/rotate it even if the file is later deleted.

References: [rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets), [protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches), [secret push protection](https://docs.github.com/en/code-security/concepts/secret-security/push-protection), [secure Actions use](https://docs.github.com/en/actions/reference/security/secure-use).
