export const courses = [
  {
    id: 'terminal-fundamentals',
    title: 'Terminal Fundamentals',
    description: 'Your first conversation with a computer.',
    topics: 'Paths · files · everyday commands',
    status: 'available',
  },
  {
    id: 'git-fundamentals',
    title: 'Git Fundamentals',
    description: 'Track changes. Build with others.',
    topics: 'Commits · branches · collaboration',
    status: 'available',
  },
  {
    id: 'linux-fundamentals',
    title: 'Linux Fundamentals',
    description: 'Get to know the system underneath.',
    topics: 'Permissions · processes · services',
    status: 'planned',
  },
  {
    id: 'networking-fundamentals',
    title: 'Networking Fundamentals',
    description: 'Understand how everything connects.',
    topics: 'Addresses · DNS · connections',
    status: 'planned',
  },
  {
    id: 'docker-fundamentals',
    title: 'Docker Fundamentals',
    description: 'Give your applications a portable home.',
    topics: 'Images · containers · volumes',
    status: 'planned',
  },
  {
    id: 'kubernetes-fundamentals',
    title: 'Kubernetes Fundamentals',
    description: 'Bring your containers together.',
    topics: 'Pods · deployments · services',
    status: 'planned',
  },
  {
    id: 'gitops',
    title: 'GitOps with Argo CD',
    description: 'Let Git describe your homelab.',
    topics: 'Desired state · sync · rollbacks',
    status: 'planned',
  },
  {
    id: 'devsecops',
    title: 'DevSecOps Fundamentals',
    description: 'Build security into every step.',
    topics: 'Secrets · scanning · safer delivery',
    status: 'planned',
  },
  {
    id: 'ai-fundamentals',
    title: 'AI Fundamentals',
    description: 'Understand the tools. Make thoughtful choices.',
    topics: 'Prompting · agents · local, on-prem & cloud',
    status: 'available',
  },
] as const;

export const learningPath = courses.map(({ title, description }) => [title, description]);
