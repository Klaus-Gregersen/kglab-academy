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

- **Protect main history** ruleset **25267613** is active, blocking force pushes and deletion, with no bypass actors.
- Dependabot security updates and private vulnerability reporting are enabled.
- Default workflow token permission is read-only; Actions cannot approve pull requests.
- All external contributors' fork workflows require maintainer approval.
- The local staged-secret hook is configured through `core.hooksPath=.githooks`.
- The after-bootstrap PR/status-check policy remains prepared locally until main exists and its CI check has run.

The implementation's final verification records the settings actually applied. Source files alone do not activate GitHub settings, and a local test pass does not mean GitHub CI has run.

## Local safeguards

`.gitignore` and `.dockerignore` exclude environment files, private keys, credential files, runtime data, and test output. `.env.example` is deliberately public and contains no secrets. Ignore rules do not protect secrets that are already tracked.

`pnpm security:check` checks candidate files for private paths and common credential patterns. `pnpm security:staged` reads the actual staged versions. The local pre-commit hook runs the staged check when configured with `pnpm security:hooks`; it requires Node on the Git client's PATH. Local hooks can be bypassed, so GitHub push protection and review remain necessary. The scanner does not prove there are no secrets and does not scan image contents or Git history.

## First push and protected main

The repository is still empty. The baseline ruleset in `deploy/security/main-baseline.json` blocks deleting `main` and rewriting its history, with no bypass actors. It allows the initial normal push; this task does not publish application files or create the first commit.

After the initial, reviewed source push and the first successful **Academy checks** run, the policy in `deploy/security/main-after-bootstrap.json` should replace/extend the baseline:

- Changes to `main` go through a pull request.
- **Academy checks** must pass and the branch must be up to date.
- Review conversations must be resolved.
- Force pushes and branch deletion stay blocked.
- No administrative bypass is configured in the policy.

The supplied after-bootstrap policy is a configuration artifact, not a claim that these rules are already enabled. In GitHub, open Settings → Rules → Rulesets to apply/inspect it, or use the authenticated rulesets API after bootstrap. Do not require a status check that has never run while trying to establish an empty default branch.

This is currently a single-maintainer setup: the template requires a PR but **zero independent approving reviews**, because an author cannot approve their own PR. Public contributors still cannot merge without write permission. `.github/CODEOWNERS` routes review to the repository owner; routing alone does not enforce approval. Before granting others write access, require at least one trusted independent approval and enable code-owner review. Review the collaborator list before granting access. Requiring approvals without another eligible reviewer would lock normal changes until the policy is adjusted.

## CI and dependency changes

`.github/workflows/checks.yml` uses GitHub-hosted disposable runners, a read-only contents token, no persisted checkout credential, immutable Action commit IDs, and no deployment steps or production secrets. It runs the secret guard, formatting, unit tests, build, HTTP security checks, browser tests, and dependency audit. It uses `pull_request`, never `pull_request_target` to execute contributor code.

Require approval of workflows from external contributors in GitHub Actions settings before spending runner time. Keep workflow permissions read-only and disable Actions approving pull requests. Do not attach a privileged homelab/self-hosted runner to untrusted public pull requests.

Dependabot configuration proposes npm, Docker, and Action updates weekly. Review changes; there is no automatic merge or automatic deployment. Docker base images and Actions are pinned to verified digests/commits; updates intentionally require a reviewed change.

Secret push protection detects supported credential patterns before a push. Branch rules control what can land on `main`. CI checks behavior after a push/PR. These are separate layers, not substitutes for one another. If a credential is leaked, revoke/rotate it even if the file is later deleted.

References: [rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets), [protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches), [secret push protection](https://docs.github.com/en/code-security/concepts/secret-security/push-protection), [secure Actions use](https://docs.github.com/en/actions/reference/security/secure-use).
