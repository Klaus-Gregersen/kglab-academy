# Deploying Academy on the existing homelab

This is the staged deployment guide for `academy.kglab.dk`. Source preparation is not a claim that the app is deployed. The operator runs cluster commands and signs commits; no access to a password manager is needed by the coding agent.

## Confirmed starting point

The operator's read-only output confirmed one `amd64` node named `homelab`, Ready on K3s `v1.36.4+k3s1`. Snapshots showed 6–8% CPU and 56% memory usage, approximately 3.8 GiB available system memory, and 74 GiB free on the root filesystem. These snapshots indicate room for a small launch, not a load-test result.

- Traefik serves the existing website at `kglab.dk` in namespace `default`.
- `local-path` is the default StorageClass, with `WaitForFirstConsumer`, reclaim policy `Delete`, and no volume expansion.
- Argo CD applications `website` and `observability` are Synced and Healthy.
- The website application uses project `default`, repository `git@github.com:Klaus-Gregersen/homelab-gitops.git`, revision `main`, and path `apps/website`.
- Traefik's pod IP was `10.42.0.61` at inspection. This is an observed, changeable address, not a permanently trusted network range.

Public traffic follows Cloudflare Tunnel on the Ubuntu host, Traefik, a Kubernetes Service, then a workload. Private administration uses Tailscale and SSH. The Academy will be a separate application beside the website, retaining the existing website deployment.

## 1. Publish a tested container

Review the publishing workflow in a pull request. `Academy checks` keeps a read-only token and runs the existing tests, builds the image, scans it with a pinned Grype version, and checks startup with a read-only root filesystem and resource limits. High or critical image findings block the check; a scanner error also fails the job. A passing scan only establishes that the scanner found no blocking known vulnerabilities at that point.

The runtime installs pinned, patched Alpine OpenSSL/zlib packages and removes unneeded package managers after findings in the public Node base image. [The image security review](image-security.md) records the findings, correction, and remaining full-image verification requirement.

For successful pushes to protected `main`, CI saves the exact tested image as a one-day artifact. A separate publisher downloads that artifact with digest verification and pushes it to `ghcr.io/klaus-gregersen/kglab-academy:<commit>`. Only that main-branch job receives `packages: write`; pull requests cannot run it. The publisher uses the built-in short-lived `GITHUB_TOKEN`, without a personal token, cluster credentials, or GitOps write token. It does not rebuild the tested image or deploy the cluster.

Registry login configuration uses a runner-temporary directory in the publishing and cleanup steps. The `runner` context is available in step-level environment settings, but not in job-level environment settings. Validate workflow changes with `actionlint .github/workflows/checks.yml`; YAML parsing and shell syntax checks alone do not validate GitHub's expression contexts.

Pin the scanner installer with its full upstream release tag, including the `v` prefix (`v0.120.1`). A bare numeric version is not that release tag and causes installer failure before any scan occurs. A scanner installation failure is a blocked check, not a vulnerability finding.

The CI summary records the published image digest. Use that digest in GitOps, rather than a moving `latest` tag. This initial workflow builds `linux/amd64`, matching the confirmed server.

GitHub makes a new container package private by default. After the first successful publication, the owner can make this package public under its package settings. The image contains public application code, not runtime voting data or cluster credentials. Verify an unauthenticated pull from the server before deployment. This avoids creating or copying a registry credential into the Academy namespace. Keep the existing website's registry secret unchanged.

References: [GHCR authentication, visibility, and digests](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry), [Anchore scan action](https://github.com/anchore/scan-action).

## 2. Deploy internally through Argo CD

After publication succeeds, prepare and review a separate `apps/academy` workload in `homelab-gitops`, plus an Academy Argo CD application. Use one replica and a replacement strategy compatible with a single SQLite writer, persistent storage, non-root execution, a read-only root filesystem, no service-account token, explicit resource requests/limits, health probes with the configured Host header, and enforced network restrictions.

Keep initial access internal until checks pass. A PVC survives pod replacement, but the observed `local-path` Delete policy can delete its backing storage when the claim is deleted. Do not delete the claim during rollback or enable automatic pruning of voting storage. Local-path capacity requests are not a substitute for checking actual disk quotas and node disk usage. Verify storage permissions and backup/restore before inviting visitors.

## 3. Verify the proxy boundary and publish the route

Use `https://academy.kglab.dk` as the configured public origin. Verify the actual source peer, Cloudflare visitor header, Traefik forwarding behavior, and origin access restrictions before trusting forwarded addresses. Never assume that a browser-supplied forwarding header is trustworthy. Restrict application ingress to the ingress controller and deny unnecessary outbound traffic; confirm the cluster enforces those policies.

Check static assets, course completion, Secure voting cookies, shared counts from separate browsers, request limits, storage after pod replacement, and a restore from backup. Then configure the Cloudflare hostname and Traefik route, verify HTTPS through the complete path, and add the Academy link to the personal website.

Each step records what actually ran. A prepared workflow or manifest does not establish that publication, deployment, network isolation, or recovery has succeeded.
