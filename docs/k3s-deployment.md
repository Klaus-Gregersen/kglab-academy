# Deploying Academy on k3s

This guide describes the deployment prerequisites and verification steps for Academy. `academy.example.com` is a placeholder for the public hostname chosen by the operator. Prepared source files do not establish that publication or deployment has succeeded.

## Prerequisites

Before preparing manifests, the operator should privately verify:

- Cluster health, available capacity, and compatibility with the image's CPU architecture.
- An ingress controller and an HTTPS routing plan for the chosen hostname.
- A StorageClass suitable for SQLite, including its reclaim policy and backup options.
- Argo CD access to the deployment repository and the intended application namespace.
- Support for enforcing the workload's network policies.

Keep node and pod inventories, internal addresses, host capacity snapshots, administrative access paths, and credentials out of public documentation and pull requests. Use placeholders in examples; configure actual environment values in operator-managed deployment configuration with appropriate access controls. Capacity snapshots help plan a launch but do not replace a load test.

## 1. Publish a tested container

Review the publishing workflow in a pull request. `Academy checks` keeps a read-only token and runs the existing tests, builds the image, scans it with a pinned Grype version, and checks startup with a read-only root filesystem and resource limits. High or critical image findings block the check; a scanner error also fails the job. A passing scan only establishes that the scanner found no blocking known vulnerabilities at that point.

The runtime installs pinned, patched Alpine OpenSSL/zlib packages and removes unneeded package managers after findings in the public Node base image. [The image security review](image-security.md) records the findings, correction, and remaining full-image verification requirement.

For successful pushes to protected `main`, CI saves the exact tested image as a one-day artifact. A separate publisher downloads that artifact with digest verification and pushes it to `ghcr.io/klaus-gregersen/kglab-academy:<commit>`. Only that main-branch job receives `packages: write`; pull requests cannot run it. The publisher uses the built-in short-lived `GITHUB_TOKEN`, without a personal token, cluster credentials, or GitOps write token. It does not rebuild the tested image or deploy the cluster.

Registry login configuration uses a runner-temporary directory in the publishing and cleanup steps. The `runner` context is available in step-level environment settings, but not in job-level environment settings. Validate workflow changes with `actionlint .github/workflows/checks.yml`; YAML parsing and shell syntax checks alone do not validate GitHub's expression contexts.

Pin the scanner installer with its full upstream release tag, including the `v` prefix (`v0.120.1`). A bare numeric version is not that release tag and causes installer failure before any scan occurs. A scanner installation failure is a blocked check, not a vulnerability finding.

The CI summary records the published image digest. Use that digest in GitOps, rather than a moving `latest` tag. This initial workflow builds `linux/amd64`; verify that the deployment target supports it.

GitHub makes a new container package private by default. After the first successful publication, the owner can make this package public under its package settings. The image contains public application code, not runtime voting data or cluster credentials. Verify an unauthenticated pull from the deployment environment before deployment. This avoids creating or copying a registry credential into the Academy namespace.

References: [GHCR authentication, visibility, and digests](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry), [Anchore scan action](https://github.com/anchore/scan-action).

## 2. Deploy internally through Argo CD

After publication succeeds, prepare and review a separate Academy workload in the deployment repository, plus an Academy Argo CD application. Use one replica and a replacement strategy compatible with a single SQLite writer, persistent storage, non-root execution, a read-only root filesystem, no service-account token, explicit resource requests/limits, health probes with the configured Host header, and enforced network restrictions.

Keep initial access internal until checks pass. A PVC survives pod replacement, but a StorageClass with reclaim policy `Delete` can delete its backing storage when the claim is deleted. Verify the selected policy privately. Do not delete the claim during rollback or enable automatic pruning of voting storage. For local-path storage, capacity requests are not a substitute for checking actual disk quotas and node disk usage. Verify storage permissions and backup/restore before inviting visitors.

## 3. Verify the proxy boundary and publish the route

Set `KGLAB_PUBLIC_ORIGIN` to the chosen HTTPS origin, for example `https://academy.example.com`. Verify the actual source peer, visitor-address header, proxy forwarding behavior, and origin access restrictions before trusting forwarded addresses. Configure trusted proxy addresses only after that verification; pod addresses can change. Never assume that a browser-supplied forwarding header is trustworthy. Restrict application ingress to the ingress controller and deny unnecessary outbound traffic; confirm the cluster enforces those policies.

Check static assets, course completion, Secure voting cookies, shared counts from separate browsers, request limits, storage after pod replacement, and a restore from backup. Then configure DNS and the ingress route, verify HTTPS through the complete path, and add the Academy link to the main website.

Record verification outcomes without publishing infrastructure inventories or sensitive output. A prepared workflow or manifest does not establish that publication, deployment, network isolation, or recovery has succeeded.
