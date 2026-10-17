# Public hosting requirements

The hardening controls reduce risk. They do not establish that an arbitrary homelab deployment is safe or make anonymous votes tamper-proof. Keep the local Vite server private. Publish through a deliberately configured HTTPS proxy/edge, not by forwarding the development port.

## Application controls

- Production (`pnpm start` or the Docker runtime) refuses to start without a valid public HTTPS origin. `pnpm preview` remains the explicit localhost development preview. Set `KGLAB_PUBLIC_ORIGIN`, preserve that Host header at the proxy, and terminate HTTPS there. Unexpected Host values receive 421. Production cookies are Secure, HttpOnly, SameSite, and signed.
- The app limits all non-health HTTP traffic to 240 requests/minute per connection scope and 2,400/minute overall. The vote API has stricter 120/minute per scope and 1,200/minute global limits. These are single-instance fixed-window limits, not a substitute for edge DDoS protection.
- New browser identities are limited to 10/hour per connection scope; vote writes to 30/minute. Those budgets persist in SQLite, so clearing cookies or restarting the server does not reset them. IPv4 addresses are scoped individually; IPv6 addresses are grouped by /64 to reduce address-rotation abuse. Shared networks share a budget. Configuring a higher identity budget for a classroom is a deliberate tradeoff.
- Only keyed HMAC identifiers are retained for connection quotas; raw IP addresses are not written to the database. Quota entries expire after their minute/hour window and are cleaned on subsequent quota activity. The quota table is bounded at 10,000 entries. Request counters live in bounded memory. Proxy/edge logging is separate and must be configured by the operator.
- Vote rows default to a maximum of 100,000; the database main-file growth is capped at 64 MiB with SQLite page limits. WAL/checkpoint settings limit ordinary journal growth but are not a filesystem quota; monitor the volume and set an actual disk quota at the host. Cached vote totals avoid scanning the entire vote table on each read. At capacity, existing votes can still be removed; quotas still apply.
- The server caps connections, requests per connection, header/request time, and request-body size. It rejects dotfiles, known private file types, traversal outside the asset directory, and symlinks escaping that directory. Security headers include CSP, HSTS in production, and disabled camera/microphone/geolocation permissions.

`KGLAB_IDENTITIES_PER_HOUR` defaults to 10 (valid range 1–1000). `KGLAB_MAX_VOTES` defaults to 100000 (valid range 1–1000000). Raising a row budget does not raise the SQLite file cap. The supported setup remains one app instance and one local data volume. If a pre-existing database already exceeds a storage cap, this configuration does not shrink or delete it.

## Proxy identity: configure deliberately

By default, forwarding headers are ignored and the socket peer is used. If a reverse proxy is present, **only its exact trusted socket IPs** go in `KGLAB_TRUSTED_PROXIES` (comma-separated). It must overwrite one single-address header: `x-real-ip` (default), or `cf-connecting-ip` selected through `KGLAB_CLIENT_IP_HEADER`. Never trust a header solely because it has a familiar name; do not accept arbitrary X-Forwarded-For chains.

For nginx directly facing clients, preserve `Host` and overwrite `X-Real-IP` using the actual client address. Behind Cloudflare Tunnel, configure the edge/proxy chain and trusted peer explicitly, verify that client addresses cannot be forged, and restrict access to the origin. Do not guess the Docker gateway/proxy address. A proxy identity misconfiguration either groups all visitors into one quota or undermines abuse protection.

## Prepared container configuration

`deploy/compose.yaml` is an optional standalone deployment template, not a change to the existing cluster. It runs a non-root container with a read-only root filesystem, only its data volume writable, dropped capabilities, no-new-privileges, bounded temporary storage, CPU/memory/process/log limits, a dedicated internal Docker network, and a localhost-only published port. It requires a public HTTPS origin.

An internal network reduces connectivity but does not prove that every host/private service is unreachable. Verify host firewall rules and the actual network boundary. Give the app no SSH keys, kubeconfig, home directory, Docker socket, cluster-admin token, or unrelated persistent volume. A Kubernetes deployment needs an explicit NetworkPolicy and restricted service account/resource configuration in that deployment's own reviewed configuration; none is installed by this task.

## Remaining launch checks

Before exposing the app:

1. Build and scan the actual Docker image, run the hardened configuration, and verify health/readiness and data-volume permissions.
2. Configure the real HTTPS origin, trusted proxy peer/client header, edge rate limits and bot/DDoS controls. Restrict direct access to the origin. Check Secure cookies, Host validation, and that forged forwarding headers do not bypass limits.
3. Verify network isolation from the rest of the homelab, filesystem/disk quotas, resource limits, backups/restore, and monitoring for errors, rate rejections, and disk usage.
4. Activate the after-bootstrap repository PR/check policy after the source is intentionally published and CI succeeds. Check GitHub account recovery, collaborator permissions, and vulnerability reporting settings.

Distributed clients can still manipulate anonymous voting within available quotas or attack an exposed service. If vote integrity becomes important, add verified sign-in or a configured abuse-challenge provider; do not label these votes as verified people. Edge and infrastructure settings cannot be made effective merely by adding source files.
