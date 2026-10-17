# Security

KG LAB Academy keeps learner terminal commands in a browser-only simulation. The server exposes static assets and a bounded voting API, with no shell, Kubernetes, or host-file management endpoint.

Please do not post credentials, private network details, or exploit reports containing personal data in public issues. [Report a vulnerability privately through GitHub](https://github.com/Klaus-Gregersen/kglab-academy/security/advisories/new). Private vulnerability reporting is enabled on this repository. If you cannot access it, contact the maintainer through a trusted private channel you already use.

See [the security review](docs/security-review.md), [repository protections](docs/repository-security.md), and [public hosting requirements](docs/public-hosting.md). Only the current main branch is maintained. Dependency advisories and automated checks are useful safeguards, not a guarantee of safety.

Anonymous voting is an informal community signal, not a verified poll. Connection limits discourage cookie-reset abuse, but VPNs, shared networks, and determined distributed clients prevent a guarantee of one vote per person. Verified identity or an externally configured abuse challenge would be required for stronger vote integrity.
