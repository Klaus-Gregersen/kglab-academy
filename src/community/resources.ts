export const categories = [
  'Terminal',
  'Git',
  'Linux',
  'Web',
  'Containers',
  'Kubernetes',
  'Security',
] as const;
export type Category = (typeof categories)[number];
export type Resource = {
  id: string;
  title: string;
  publisher: string;
  category: Category;
  format: string;
  level: string;
  description: string;
  access: string;
  url: string;
  repository?: string;
};

// Curated resources, including learner recommendations. Vote counts come from the API.
// Review the linked material and access requirements before adding an entry.
export const resources: Resource[] = [
  {
    id: 'missing-semester',
    title: 'The Missing Semester',
    publisher: 'MIT · Missing Semester team',
    category: 'Terminal',
    format: 'Lessons & exercises',
    level: 'After the basics',
    description:
      'Get more comfortable with the shell, development tools, and the small habits that make everyday work easier.',
    access: 'Open notes and videos. A local shell is needed for exercises.',
    url: 'https://missing.csail.mit.edu/',
  },
  {
    id: 'pro-git',
    title: 'Pro Git',
    publisher: 'Scott Chacon & Ben Straub',
    category: 'Git',
    format: 'Book',
    level: 'Beginner onward',
    description:
      'Learn to track changes, work with branches, and understand how a shared Git workflow fits together.',
    access: 'Read the full book online for free. Install Git to follow along.',
    url: 'https://git-scm.com/book/en/v2',
  },
  {
    id: 'learn-git-branching',
    title: 'Learn Git Branching',
    publisher: 'Learn Git Branching contributors',
    category: 'Git',
    format: 'Interactive visual tutorial',
    level: 'Beginner onward',
    description:
      'Watch the commit tree change as you practice Git commands. Learn through visual explanations, guided challenges, and a sandbox for experimenting.',
    access:
      'Free, open-source browser simulator. JavaScript is required; no account or local Git installation needed.',
    url: 'https://learngitbranching.js.org/',
    repository: 'https://github.com/pcottle/learnGitBranching',
  },
  {
    id: 'introduction-to-linux',
    title: 'Introduction to Linux',
    publisher: 'Linux Foundation · LFS101',
    category: 'Linux',
    format: 'Course',
    level: 'Beginner',
    description:
      'Build a foundation in Linux, from the desktop to the command line and everyday system tools.',
    access: 'Free training course. Registration is required by the provider.',
    url: 'https://training.linuxfoundation.org/training/introduction-to-linux/',
  },
  {
    id: 'mdn-learn',
    title: 'Learn web development',
    publisher: 'MDN Web Docs',
    category: 'Web',
    format: 'Guides & challenges',
    level: 'Beginner',
    description:
      'Start with HTML, CSS, and JavaScript, then check your understanding through practical challenges.',
    access: 'Open written learning material. Partner courses have separate terms.',
    url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development',
  },
  {
    id: 'odin-project',
    title: 'The Odin Project',
    publisher: 'The Odin Project community',
    category: 'Web',
    format: 'Curriculum & projects',
    level: 'Beginner onward',
    description:
      'A project-based path into web development, with an open curriculum you can read and help improve.',
    access: 'Free curriculum. Plan for a local development environment.',
    url: 'https://www.theodinproject.com/paths',
    repository: 'https://github.com/TheOdinProject/curriculum',
  },
  {
    id: 'docker-getting-started',
    title: 'Build and share a containerized application',
    publisher: 'Docker Docs',
    category: 'Containers',
    format: 'Tutorial',
    level: 'After terminal basics',
    description:
      'Follow an application from running a container to building an image and sharing it.',
    access:
      'Free tutorial. Requires Docker and Git; publishing uses a Docker account. Check Docker Desktop licensing for your use.',
    url: 'https://docs.docker.com/get-started/tutorials/run-an-app/',
  },
  {
    id: 'kubernetes-basics',
    title: 'Learn Kubernetes Basics',
    publisher: 'Kubernetes project',
    category: 'Kubernetes',
    format: 'Tutorials',
    level: 'After containers',
    description:
      'Explore deploying, inspecting, scaling, and updating a containerized application in a practice cluster.',
    access: 'Open tutorials. Set up a learning cluster such as Minikube to follow along.',
    url: 'https://kubernetes.io/docs/tutorials/kubernetes-basics/',
  },
  {
    id: 'killercoda-kubernetes',
    title: 'Killercoda Kubernetes',
    publisher: 'Killercoda',
    category: 'Kubernetes',
    format: 'Interactive labs & playgrounds',
    level: 'After containers',
    description:
      'Practice Kubernetes in temporary browser-based environments, with hands-on scenarios and playgrounds that don’t require setting up your own cluster.',
    access:
      'Free scenarios require an account. Free sessions last up to one hour; longer sessions and separate courses are paid options.',
    url: 'https://killercoda.com/kubernetes',
  },
  {
    id: 'webgoat',
    title: 'WebGoat',
    publisher: 'OWASP · WebGoat project',
    category: 'Security',
    format: 'Practice lab & repository',
    level: 'After web basics',
    description:
      'Explore web application security through lessons in an intentionally vulnerable application.',
    access:
      'Free local lab. Requires Docker or Java and a local lab account. Follow the project’s isolation instructions; keep it off the public internet.',
    url: 'https://github.com/WebGoat/WebGoat',
  },
];

export function filterResources(
  category: Category | 'All',
  query: string,
  favorites: string[],
  onlyFavorites: boolean,
) {
  const search = query.trim().toLocaleLowerCase();
  return resources.filter(
    (resource) =>
      (category === 'All' || resource.category === category) &&
      (!onlyFavorites || favorites.includes(resource.id)) &&
      `${resource.title} ${resource.publisher} ${resource.category} ${resource.description}`
        .toLocaleLowerCase()
        .includes(search),
  );
}
