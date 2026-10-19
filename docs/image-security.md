# Runtime image security review

## Base-image scan, 2026-10-19

Grype `v0.120.1`, with its valid 2026-10-19 database, scanned the Linux amd64 variant of the public base image `node:24-alpine@sha256:44fce696f38ba8c987c4db89954051000bbd05ffd8d8659ba15ed4a8602e937f` directly from the registry. This was a base-image scan, not a scan of a deployed Academy or of the homelab host. The exact digest was still the current official Node 24 Alpine digest when checked.

The scan reported 13 High, 20 Medium, and 9 Low package/vulnerability matches. A CVE affecting two libraries can produce two matches; these are not counts of independently exploitable Academy vulnerabilities. The application dependency audit did not cover these operating-system libraries or npm's own bundled dependencies.

## Runtime correction

| Component                  | Base-image version                                                            | Runtime correction                                                               |
| -------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| libcrypto3 and libssl3     | 3.5.8-r0                                                                      | Install the official Alpine 3.24 packages at 3.5.9-r0                            |
| zlib                       | 1.3.2-r0                                                                      | Install the official Alpine 3.24 package at 1.3.2-r1                             |
| npm's bundled dependencies | Included http-cache-semantics 4.2.0, undici 6.28.0, and brace-expansion 5.0.9 | Remove npm and the other package-manager installations from the production image |

The OpenSSL advisory identifies 3.5.9 as the corrected 3.5 release for the matched September advisories. The exact package versions and dependencies were confirmed in Alpine's official `v3.24/main/x86_64/APKINDEX.tar.gz`, rather than guessed from the moving base-image tag.

The application runtime uses Node built-ins, including SQLite, and serves prebuilt frontend files. It does not need npm, npx, Corepack, or Yarn. Removing these tools from the final filesystem removes their installed dependency trees; the build stage retains its package manager. The startup command remains `node server/start.ts`.

The Dockerfile pins the three upgraded Alpine package versions. These pins need reviewed updates as new security fixes appear; Dependabot's base-image updates alone do not update the package pins. The existing immutable base image remains pinned.

## Verification boundary

The publishing workflow continues to fail on High or Critical image findings and scanner errors. It includes no suppression for these findings. GitHub CI must build and scan the complete corrected runtime and verify its constrained startup before publication. A local package-identifier check or a review of upstream fixes does not replace that full-image check.

The corrected complete production image was built for `linux/amd64` using Docker Desktop's BuildKit and scanned locally with Grype `v0.120.1` and the same valid database. The full-image result was **zero High or Critical matches and three Medium matches**. All three Medium matches identify `CVE-2025-60876` against BusyBox-derived packages (`busybox`, `busybox-binsh`, and `ssl_client` at 1.37.0-r31); the feed did not report a fixed version. These remain visible and unsuppressed. This is not a vulnerability-free claim.

The corrected image then passed actual HTTP tests in a temporary local container with UID 1000, a read-only root filesystem, dropped capabilities, no-new-privileges, 256 MiB memory, a 0.5 CPU limit, and bounded temporary SQLite storage. Checks covered readiness, frontend serving, private-path and Host rejection, Secure/HttpOnly cookies, a real SQLite upvote, duplicate-request deduplication, cross-origin rejection, and undo. Runtime checks confirmed npm and Yarn were absent. The temporary test container was removed afterward.

The base scan and local build used temporary caches and a separate Docker configuration with no registry credentials. No server, cluster, or password-manager access was used. GitHub CI must independently repeat the complete-image scan and startup check on the owner-signed follow-up commit before merge; registry publication and the k3s rollout remain pending.

References: [OpenSSL advisory](https://openssl-library.org/news/secadv/20260929.txt), [Alpine package index](https://dl-cdn.alpinelinux.org/alpine/v3.24/main/x86_64/APKINDEX.tar.gz), [Undici advisory](https://github.com/nodejs/undici/security/advisories/GHSA-rfgv-xxqx-mfg5).
