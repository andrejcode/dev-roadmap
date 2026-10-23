import type { RoadmapDefinition } from './types'

export const frontendRoadmap = {
  id: 'frontend',
  title: 'Frontend Development',
  description:
    'Learn how to build modern web applications using HTML, CSS, JavaScript, and React.',
  entryNodeId: 'html',
  // completed: 10%
  nodes: [
    {
      id: 'html',
      title: 'HTML',
      description:
        'Learn the basics of HTML, the standard markup language for creating web pages.',
      // status: 'started' | 'not-started' | 'completed',
      next: {
        required: {
          id: 'css',
          orientation: 'down',
        },
      },
    },
    {
      id: 'css',
      title: 'CSS',
      description:
        'Learn the basics of CSS, the language used to style HTML elements on web pages.',
      // status: 'started' | 'not-started' | 'completed',
      next: {
        required: {
          id: 'javascript',
          orientation: 'down',
        },
        optional: {
          id: 'scss',
          orientation: 'right',
        },
      },
    },
    {
      id: 'scss',
      title: 'SCSS',
      description:
        'Learn the basics of SCSS, a CSS preprocessor that adds features like variables, nested rules, and mixins.',
    },
    {
      id: 'javascript',
      title: 'JavaScript',
      description:
        'Learn the basics of JavaScript, the programming language used to create dynamic web content.',
      next: {
        required: {
          id: 'react',
          orientation: 'down',
        },
        optional: [
          {
            id: 'typescript',
            orientation: 'right',
          },
          {
            id: 'javascript-testing',
            orientation: 'left',
          },
        ],
      },
    },
    {
      id: 'javascript-testing',
      title: 'JavaScript Testing',
      description:
        'Test JavaScript functions and application logic with unit tests.',
    },
    {
      id: 'typescript',
      title: 'TypeScript',
      description:
        'Learn the basics of TypeScript, a typed superset of JavaScript that compiles to plain JavaScript.',
    },
    {
      id: 'react',
      title: 'React',
      description:
        'Learn the basics of React, a popular JavaScript library for building user interfaces.',
      next: {
        required: {
          id: 'frontend-completion',
          orientation: 'down',
        },
        optional: [
          {
            id: 'nextjs',
            orientation: 'right',
          },
          {
            id: 'react-testing',
            orientation: 'left',
          },
        ],
      },
    },
    {
      id: 'nextjs',
      title: 'Next.js',
      description:
        'Learn the basics of Next.js, a React framework for building server-side rendered and static web applications.',
      next: {
        required: {
          id: 'auth',
          orientation: 'up',
        },
        optional: [
          {
            id: 'nextjs-testing',
            orientation: 'right',
          },
        ],
      },
    },
    {
      id: 'auth',
      title: 'Auth',
      description: 'Authentication and authorization in Next.js applications.',
    },
    {
      id: 'react-testing',
      title: 'React Testing',
      description:
        'Test React components and user interactions with React Testing Library.',
      next: {
        optional: {
          id: 'testing-fundamentals',
          orientation: 'up',
        },
      },
    },
    {
      id: 'testing-fundamentals',
      title: 'Testing Fundamentals',
      description:
        'Learn test assertions, test cases, and the fundamentals of reliable automated testing.',
    },
    {
      id: 'nextjs-testing',
      title: 'Next.js Testing',
      description:
        'Test Next.js applications and user interactions with appropriate testing tools.',
    },
    {
      id: 'frontend-completion',
      title: 'Frontend Completion',
      description:
        'You have completed the core frontend development learning path.',
    },
  ],
} satisfies RoadmapDefinition
