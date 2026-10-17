# Security review · 16 October 2026

**Remediation update:** the findings below record the initial review. The subsequent hardening implementation adds secret guards, connection/global quotas, storage limits, stricter serving and production configuration, pinned images, and CI/policy artifacts. See [current hosting requirements](public-hosting.md) and [repository security](repository-security.md) for implemented controls and remaining deployment work.

This is a source/configuration review and dependency advisory check, not a penetration test or a guarantee of safety. No deployment, network, GitHub account, or infrastructure settings were changed during the review.

## Publishing source

A normal source push publishes committed files and Git metadata. It does not open a router port or give readers access to the developer's computer. External deployment automation could act on a push if configured elsewhere; no deployment workflow is present in this checkout.

The main publishing risk is accidentally including credentials, private configuration, data, or personal information. At review time, this checkout had no commits or tracked application files. Its `data/` directory, SQLite files, build output, dependencies, and test results are excluded from Git. The Docker build context also excludes runtime data and SQLite files.

A pattern scan of project text files, excluding runtime data and generated/dependency directories, found no obvious private-key blocks or common GitHub/cloud/API token patterns. This is limited pattern matching, not a comprehensive secret scan, and it does not inspect image contents. Review the exact staged files and screenshots before publication. Git ignore rules do not remove previously committed secrets; a leaked credential must be revoked or rotated.

**Recommended before the first push:** explicitly exclude `.env` variants and private key/certificate files from both Git and Docker build context, keeping only deliberately public example configuration. These patterns are currently absent. Confirm GitHub secret scanning/push protection and account security settings; their live state was not inspected. Review contributed code before running it locally or merging it, especially scripts, dependency changes, and future CI workflows.

## Existing application boundaries

- Terminal commands operate on JavaScript objects in the learner's browser. There is no server shell, arbitrary process execution endpoint, Kubernetes connection, or cluster credential in the application source checked.
- Server routes serve built frontend files and the community vote API. The database is outside the served asset directory; path resolution rejects paths outside that directory. Symlinks and independently modified deployment files were not audited.
- Vote writes use a resource allowlist, parameterized SQL, a unique resource/voter constraint, signed anonymous cookies, origin/custom-header checks, bounded bodies, and a per-identity rate limit. These controls reduce several common risks; the origin header is not authentication against scripted clients.
- The production server sets CSP and other response headers. The Docker runtime uses a non-root user. Secure voting cookies require HTTPS configuration as documented in the README.
- Development and the standalone server default to listening on `127.0.0.1`. The Vite development server should stay private and should not be used as the public application server.

## Findings before an internet-facing deployment

1. **Anonymous voting can be abused.** Fresh cookies create fresh voting identities, bypassing the per-identity write limit. There is no site-wide/IP/edge limit on new identities or reads, nor a maximum database size. An automated client could inflate counts, grow storage, or consume CPU/disk. Use edge/proxy traffic limits and appropriate abuse controls, monitor storage, and set resource limits before public exposure.
2. **The Docker example publishes broadly.** `-p 8080:8080` binds the published port to all host interfaces by default. Actual reachability depends on routing and firewall settings. For host-local access use `-p 127.0.0.1:8080:8080`; for a containerized proxy, use an intentionally private container network and expose only the proxy. Do not forward or tunnel the Vite development port.
3. **Deployment isolation remains an operator responsibility.** Run the app with access only to its own data volume. Do not mount home directories, SSH keys, kubeconfig, or the Docker socket. Restrict reachability to private homelab services and avoid unnecessary cluster permissions. A container alone is not a guarantee that a compromised service cannot affect other systems.
4. **Maintain the runtime and supply chain.** The dependency lockfile and frozen installation are present, but Docker base tags are mutable and not pinned by digest. Keep Node, container images, and dependencies patched; scan the actual image and review dependency/contribution changes. The Docker image has not been built or scanned in this environment.

HTTPS, the correct public origin, secure cookies, backups, and network/resource isolation must be checked on the actual hosting environment. This review did not inspect the router, Cloudflare configuration, Kubernetes policies, running containers, or GitHub account protections.

## Dependency advisory result

`pnpm audit --json --fetch-retries=0 --fetch-timeout=15000` completed against the package registry and reported **zero known advisories**, including development dependencies, at review time. This does not establish that the packages, Node runtime, container images, or application code have no vulnerabilities.

## References

- [GitHub push protection](https://docs.github.com/en/code-security/concepts/secret-security/push-protection)
- [GitHub secret scanning and credential remediation](https://docs.github.com/en/code-security/concepts/secret-security/secret-scanning)
- [GitHub authentication and account protections](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/about-authentication-to-github)
- [Docker port publishing](https://docs.docker.com/engine/network/port-publishing/)
- [Vite server options and security considerations](https://vite.dev/config/server-options)
