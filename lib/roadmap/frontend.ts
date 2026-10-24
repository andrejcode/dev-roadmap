import type { JSONContent } from '@tiptap/core'

import type { RoadmapDefinition } from './types'

function paragraph(text: string): JSONContent {
  return { type: 'paragraph', content: [{ type: 'text', text }] }
}

function heading(text: string): JSONContent {
  return {
    type: 'heading',
    attrs: { level: 3 },
    content: [{ type: 'text', text }],
  }
}

function lesson({
  title,
  introduction,
  goals,
  practice,
  resources,
  example,
  table,
}: {
  title: string
  introduction: string
  goals: string[]
  practice: string
  resources: [label: string, href: string][]
  example?: { language: string; code: string }
  table?: string[][]
}): JSONContent {
  const content: JSONContent[] = [
    heading(title),
    paragraph(introduction),
    heading('Learning goals'),
    {
      type: 'bulletList',
      content: goals.map((goal) => ({
        type: 'listItem',
        content: [paragraph(goal)],
      })),
    },
  ]
  if (example) {
    content.push({
      type: 'codeBlock',
      attrs: { language: example.language },
      content: [{ type: 'text', text: example.code }],
    })
  }
  if (table) {
    content.push({
      type: 'table',
      content: table.map((row, index) => ({
        type: 'tableRow',
        content: row.map((cell) => ({
          type: index === 0 ? 'tableHeader' : 'tableCell',
          content: [paragraph(cell)],
        })),
      })),
    })
  }
  content.push(heading('Try it'), paragraph(practice), heading('Read next'), {
    type: 'bulletList',
    content: resources.map(([label, href]) => ({
      type: 'listItem',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: label,
              marks: [{ type: 'link', attrs: { href } }],
            },
          ],
        },
      ],
    })),
  })
  return { type: 'doc', content }
}

export const frontendRoadmap = {
  id: 'frontend',
  title: 'Frontend Development',
  description:
    'Learn how to build modern web applications using HTML, CSS, JavaScript, and React.',
  entryNodeId: 'web-foundations',
  // completed: 10%
  nodes: [
    {
      id: 'web-foundations',
      title: 'Web Foundations',
      description:
        'Understand what happens between entering a URL and seeing a page.',
      content: lesson({
        title: 'Follow a request from browser to server',
        introduction:
          'Frontend development starts with the web platform. A browser resolves a hostname, establishes a connection, requests a resource, and turns HTML, CSS, and JavaScript into an interactive page. Understanding that journey makes loading failures and performance problems easier to diagnose.',
        goals: [
          'Explain URLs, DNS, HTTP requests and responses, and why HTTPS matters.',
          'Read status codes, headers, and resource timings in the Network panel.',
          'Distinguish the DOM, CSS layout, painting, and JavaScript execution.',
        ],
        practice:
          'Open a familiar site with DevTools. Reload with the Network panel recording, find the document request, and explain its status, content type, and the resources it loads. Repeat with the browser set offline.',
        resources: [
          [
            'MDN: How the web works',
            'https://developer.mozilla.org/en-US/docs/Learn_web_development/Getting_started/Web_standards/How_the_web_works',
          ],
          [
            'MDN: Overview of HTTP',
            'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview',
          ],
        ],
      }),
      next: { required: { id: 'html', orientation: 'down' } },
    },
    {
      id: 'html',
      title: 'HTML',
      description:
        'Learn the basics of HTML, the standard markup language for creating web pages.',
      // status: 'started' | 'not-started' | 'completed',
      content: lesson({
        title: 'Structure before styling',
        introduction:
          'HTML stands for HyperText Markup Language. It describes the structure and meaning of a page, rather than its visual appearance. Semantic elements give browsers, search engines, and assistive technologies useful information without custom JavaScript.',
        goals: [
          'Build a document with a language, useful title, logical headings, and landmarks.',
          'Choose links for navigation and buttons for actions. Add meaningful image alternatives.',
          'Create forms with labels, suitable input types, validation, and helpful error messages.',
        ],
        example: {
          language: 'html',
          code: '<main>\n  <h1>My first page</h1>\n  <p>A meaningful starting point.</p>\n  <form>\n    <label for="email">Email</label>\n    <input id="email" name="email" type="email" required>\n    <button type="submit">Subscribe</button>\n  </form>\n</main>',
        },
        table: [
          ['Element', 'Purpose'],
          ['main', 'The primary content of the page'],
          ['a', 'Navigation to a destination'],
          ['button', 'An action such as submitting a form'],
          ['label', 'The accessible name of a form control'],
        ],
        practice:
          'Build a personal profile with a navigation menu, an article, a meaningful image, and a contact form. Leave CSS out initially. Check the heading outline and use the entire form with only the keyboard.',
        resources: [
          [
            'MDN: Structuring content with HTML',
            'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content',
          ],
          [
            'MDN: Web forms',
            'https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms',
          ],
        ],
      }),
      next: {
        required: { id: 'css', orientation: 'down' },
        optional: { id: 'accessibility', orientation: 'left' },
      },
    },
    {
      id: 'accessibility',
      title: 'Accessibility',
      description:
        'Make interfaces usable with keyboards, assistive technology, and different abilities.',
      content: lesson({
        title: 'Design for more than a mouse',
        introduction:
          'Accessibility is part of correct interface behavior, not a final polish step. Semantic HTML provides a strong baseline, but focus order, error feedback, contrast, and dynamic announcements also need deliberate testing. Prefer native elements before adding ARIA.',
        goals: [
          'Test keyboard navigation, visible focus, zoom, and text contrast.',
          'Provide accessible names, descriptions, and understandable form errors.',
          'Manage focus in dialogs and announce important asynchronous updates without excessive noise.',
        ],
        practice:
          'Audit your profile form without a mouse, then with a screen reader. Fix unlabeled controls and missing focus styles. Zoom to 200% and verify that text and actions remain available. Use an automated audit as a supplement, not a replacement for manual checks.',
        resources: [
          [
            'W3C: Accessibility fundamentals',
            'https://www.w3.org/WAI/fundamentals/accessibility-intro/',
          ],
          ['W3C: ARIA Authoring Practices', 'https://www.w3.org/WAI/ARIA/apg/'],
        ],
      }),
    },
    {
      id: 'css',
      title: 'CSS',
      description:
        'Build predictable layouts with the cascade, the box model, Flexbox, and Grid.',
      // status: 'started' | 'not-started' | 'completed',
      content: lesson({
        title: 'Understand layout before collecting utilities',
        introduction:
          'CSS describes presentation. The cascade, inheritance, and sizing rules determine which declarations apply and how elements fit together. Learn these fundamentals before relying on a framework, so that unfamiliar layouts can be debugged rather than patched.',
        goals: [
          'Explain specificity, inheritance, box sizing, normal flow, and positioning.',
          'Use Flexbox for one-dimensional arrangements and Grid for two-dimensional layouts.',
          'Create reusable design tokens with custom properties and inspect computed styles.',
        ],
        example: {
          language: 'css',
          code: '* { box-sizing: border-box; }\n\n.cards {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));\n  gap: 1rem;\n}',
        },
        practice:
          'Style your profile page with a consistent spacing scale and a responsive grid of projects. Explain why each layout uses Grid or Flexbox, and fix one deliberate specificity conflict using DevTools.',
        resources: [
          [
            'MDN: CSS styling basics',
            'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics',
          ],
          ['web.dev: Learn CSS', 'https://web.dev/learn/css'],
        ],
      }),
      next: {
        required: { id: 'javascript', orientation: 'down' },
        optional: { id: 'responsive-design', orientation: 'right' },
      },
    },
    {
      id: 'responsive-design',
      title: 'Responsive Design',
      description:
        'Adapt content and layouts to small screens, large screens, and varied input methods.',
      content: lesson({
        title: 'Let the content determine the breakpoints',
        introduction:
          'A responsive interface is more than a narrower desktop page. Content should reflow naturally, controls should remain reachable, and images should not waste bandwidth. Start with a small-screen layout and add complexity only when the available space supports it.',
        goals: [
          'Use a viewport meta tag, flexible sizing, media queries, and container queries.',
          'Choose responsive images with srcset, sizes, and appropriate aspect ratios.',
          'Test long text, touch targets, reduced motion, and landscape orientation.',
        ],
        practice:
          'Test your project grid at 320px, 768px, and 1440px. Replace fixed widths that cause document overflow. Add a long project name and verify that it wraps without hiding actions or shifting neighboring controls.',
        resources: [
          ['web.dev: Learn responsive design', 'https://web.dev/learn/design'],
          [
            'MDN: Responsive images',
            'https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Responsive_images',
          ],
        ],
      }),
    },
    {
      id: 'javascript',
      title: 'JavaScript',
      description:
        'Learn the language fundamentals behind interactive interfaces and asynchronous work.',
      content: lesson({
        title: 'Model behavior with small, understandable functions',
        introduction:
          'JavaScript adds behavior to the page. Solid language fundamentals make both browser code and frameworks easier to reason about. Start with values, functions, and data transformations, then learn how asynchronous work interacts with the event loop.',
        goals: [
          'Work with primitives, objects, arrays, scope, closures, and ES modules.',
          'Understand reference equality, immutable updates, and common array methods.',
          'Use promises, async/await, and try/catch without losing error information.',
        ],
        example: {
          language: 'javascript',
          code: 'const tasks = [\n  { title: "Learn HTML", completed: true },\n  { title: "Learn JavaScript", completed: false },\n]\n\nconst remaining = tasks\n  .filter((task) => !task.completed)\n  .map((task) => task.title)',
        },
        practice:
          'Write functions to add, complete, filter, and summarize tasks without mutating the original array. Separate those functions from DOM code so they can be exercised independently.',
        resources: [
          [
            'MDN: JavaScript Guide',
            'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide',
          ],
          [
            'javascript.info: The JavaScript language',
            'https://javascript.info/js',
          ],
        ],
      }),
      next: {
        required: { id: 'typescript', orientation: 'down' },
        optional: [
          { id: 'tooling', orientation: 'left' },
          { id: 'browser-apis', orientation: 'right' },
        ],
      },
    },
    {
      id: 'tooling',
      title: 'Git & Tooling',
      description:
        'Work reproducibly with version control, package management, and automated checks.',
      content: lesson({
        title: 'Make a project easy to change and reproduce',
        introduction:
          'Professional frontend work includes reviewing changes, reproducing builds, and catching mistakes before deployment. A small toolchain with clear scripts is usually more useful than a large collection of tools whose purpose is unclear.',
        goals: [
          'Use Git commits, branches, diffs, and pull requests to communicate focused changes.',
          'Understand package manifests, lockfiles, scripts, and development dependencies.',
          'Run formatting, linting, type checks, tests, and production builds consistently.',
        ],
        example: {
          language: 'bash',
          code: 'git switch -c feat/task-filter\ngit diff\npnpm install --frozen-lockfile\npnpm lint\npnpm test\npnpm build',
        },
        practice:
          'Put your task project in Git, add a README with setup instructions, and make a focused feature branch. Verify that a fresh clone can install dependencies from the lockfile and run the same checks.',
        resources: [
          [
            'Git: Getting started',
            'https://git-scm.com/book/en/v2/Getting-Started-About-Version-Control',
          ],
          ['Vite: Getting started', 'https://vite.dev/guide/'],
        ],
      }),
    },
    {
      id: 'browser-apis',
      title: 'DOM & Browser APIs',
      description:
        'Connect JavaScript to user input, network requests, and browser capabilities.',
      content: lesson({
        title: 'Handle events and network failures deliberately',
        introduction:
          'The browser provides the DOM, events, networking, storage, and many other capabilities. Keep the interface responsive and treat network data as untrusted. Successful requests, empty results, slow connections, and errors are all normal states of a real application.',
        goals: [
          'Select and update DOM nodes safely, and understand event bubbling and delegation.',
          'Use fetch, response status checks, JSON parsing, and AbortController.',
          'Understand storage tradeoffs, same-origin restrictions, and why CORS is enforced by browsers.',
        ],
        example: {
          language: 'javascript',
          code: 'async function loadTasks(signal) {\n  const response = await fetch("/api/tasks", { signal })\n  if (!response.ok) {\n    throw new Error(`Request failed: ${response.status}`)\n  }\n  return response.json()\n}',
        },
        practice:
          'Build a searchable list using a public API or local fixture. Show loading, empty, success, and error states. Cancel outdated requests and insert user-provided text with textContent rather than innerHTML.',
        resources: [
          [
            'MDN: Introduction to the DOM',
            'https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Introduction',
          ],
          [
            'MDN: Using Fetch',
            'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch',
          ],
        ],
      }),
    },
    {
      id: 'typescript',
      title: 'TypeScript',
      description:
        'Describe data and component contracts while keeping runtime validation explicit.',
      content: lesson({
        title: 'Make invalid states harder to represent',
        introduction:
          'TypeScript checks JavaScript before it runs. It is especially useful for documenting boundaries and catching incompatible changes across a project. Types disappear at runtime, so a type annotation is not a substitute for validating data received from a user or an API.',
        goals: [
          'Use inference, object types, unions, generics, and strict null checking.',
          'Narrow unknown values with runtime checks instead of asserting them with as.',
          'Represent asynchronous UI states with discriminated unions.',
        ],
        example: {
          language: 'typescript',
          code: 'type LoadState<T> =\n  | { status: "loading" }\n  | { status: "success"; data: T }\n  | { status: "error"; message: string }\n\nfunction describe(state: LoadState<string[]>) {\n  if (state.status === "success") {\n    return `${state.data.length} tasks`\n  }\n  return state.status\n}',
        },
        practice:
          'Convert your task functions to TypeScript with strict mode enabled. Model a request so that error and success data cannot coexist. Parse unknown API data before treating it as a task.',
        resources: [
          [
            'TypeScript: The Handbook',
            'https://www.typescriptlang.org/docs/handbook/intro.html',
          ],
          [
            'TypeScript: Narrowing',
            'https://www.typescriptlang.org/docs/handbook/2/narrowing.html',
          ],
        ],
      }),
      next: { required: { id: 'react', orientation: 'down' } },
    },
    {
      id: 'react',
      title: 'React',
      description:
        'Learn the basics of React, a popular JavaScript library for building user interfaces.',
      content: lesson({
        title: 'Build interfaces from state and reusable components',
        introduction:
          'React describes what the interface should look like for a given state. Components compose into larger screens, while props and state make data flow explicit. Prefer deriving values during rendering over synchronizing duplicate state with effects.',
        goals: [
          'Compose components with JSX, props, stable keys, and semantic HTML.',
          'Handle user events and update state without mutating existing objects.',
          'Understand rendering, lifting state, controlled inputs, and when an effect is actually needed.',
        ],
        example: {
          language: 'tsx',
          code: 'function TaskFilter() {\n  const [query, setQuery] = useState("")\n\n  return (\n    <label>\n      Filter tasks\n      <input\n        value={query}\n        onChange={(event) => setQuery(event.target.value)}\n      />\n    </label>\n  )\n}',
        },
        practice:
          'Rebuild the task list as components with an accessible filter, a form, and a summary. Keep the source data in one place and derive filtered tasks during rendering. Explain each effect before adding it.',
        resources: [
          ['React: Learn', 'https://react.dev/learn'],
          [
            'React: You might not need an Effect',
            'https://react.dev/learn/you-might-not-need-an-effect',
          ],
        ],
      }),
      next: {
        required: { id: 'react-testing', orientation: 'down' },
        optional: [
          { id: 'state-data', orientation: 'left' },
          { id: 'nextjs', orientation: 'right' },
        ],
      },
    },
    {
      id: 'state-data',
      title: 'State & Data',
      description:
        'Separate local UI state, shareable URL state, and cached server data.',
      content: lesson({
        title: 'Put each kind of state in the right place',
        introduction:
          'Not all state needs a global store. A temporary input value belongs near its field, a shareable filter may belong in the URL, and remote data needs freshness and failure handling. Choosing the right owner reduces synchronization bugs and unnecessary complexity.',
        goals: [
          'Choose between local state, reducers, context, URL parameters, and a dedicated store.',
          'Distinguish client state from server state and understand query caching and invalidation.',
          'Plan form validation, optimistic updates, and rollback behavior for failed mutations.',
        ],
        practice:
          'Persist your task filter in URL search parameters so it survives refresh and can be shared. Then add remote tasks with loading and retry states. Document which values are stored and which are derived.',
        resources: [
          ['React: Managing state', 'https://react.dev/learn/managing-state'],
          [
            'TanStack Query: Overview',
            'https://tanstack.com/query/latest/docs/framework/react/overview',
          ],
        ],
      }),
    },
    {
      id: 'nextjs',
      title: 'Next.js',
      description:
        'Build routed React applications with server rendering and explicit client boundaries.',
      content: lesson({
        title: 'Choose where code runs',
        introduction:
          'Next.js adds routing, server rendering, and application conventions to React. Server Components can read server-side data without sending that code to the browser. Client Components provide interactivity. Learn the boundary instead of making the entire application client-side by default.',
        goals: [
          'Organize routes with layouts, pages, loading states, and error boundaries.',
          'Understand Server and Client Components and serializable data crossing their boundary.',
          'Read the installed version documentation for fetching, caching, mutations, and deployment behavior.',
        ],
        practice:
          'Create a task detail route whose data is loaded on the server, with a small client component for interaction. Add not-found, loading, and failure states. Verify that server-only values are not included in browser bundles.',
        resources: [
          ['Next.js: App Router', 'https://nextjs.org/docs/app'],
          [
            'Next.js: Server and Client Components',
            'https://nextjs.org/docs/app/getting-started/server-and-client-components',
          ],
        ],
      }),
      next: { required: { id: 'auth', orientation: 'right' } },
    },
    {
      id: 'auth',
      title: 'Security & Auth',
      description:
        'Protect user data with server-side authorization and safe browser practices.',
      content: lesson({
        title: 'Treat the browser as an untrusted client',
        introduction:
          'Authentication identifies a user. Authorization decides which data and actions that user may access. Hiding a button is not authorization: protected reads and writes must verify permissions on the server. Use established authentication libraries instead of inventing session or password handling.',
        goals: [
          'Distinguish authentication, authorization, sessions, and least-privilege access.',
          'Understand XSS, CSRF, secure cookie attributes, and why secrets must stay on the server.',
          'Validate input and destinations, and render untrusted text without executing it.',
        ],
        practice:
          'Write an access-control checklist for task owners and collaborators. Verify that an unauthorized direct request fails even if the UI hides the action. Review your app for exposed secrets, unsafe HTML insertion, and unvalidated redirects.',
        resources: [
          [
            'OWASP: Authorization Cheat Sheet',
            'https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html',
          ],
          [
            'MDN: Web security',
            'https://developer.mozilla.org/en-US/docs/Web/Security',
          ],
        ],
      }),
    },
    {
      id: 'react-testing',
      title: 'Testing',
      description:
        'Build confidence with behavior-focused component tests and a balanced test strategy.',
      content: lesson({
        title: 'Test the behavior users depend on',
        introduction:
          'Useful tests make important behavior explicit and fail when that behavior breaks. Combine fast checks of pure logic with component interactions and a few complete browser journeys. Avoid tests tied to private component state or styling details that do not affect behavior.',
        goals: [
          'Choose an appropriate unit, component, integration, or end-to-end test for each risk.',
          'Find controls by accessible role and name, and exercise observable user interactions.',
          'Cover loading, empty, error, keyboard, and permission-denied states as well as the happy path.',
        ],
        table: [
          ['Scope', 'A useful example'],
          ['Unit', 'Filtering tasks without mutating input'],
          ['Component', 'An invalid form shows a helpful error'],
          ['Browser', 'A user creates a task and sees it after reload'],
        ],
        practice:
          'Write a component test that adds a task through its labeled form. Assert the resulting task and summary, not hook internals. Add a keyboard-only case and a failed-save case.',
        resources: [
          [
            'Testing Library: Guiding principles',
            'https://testing-library.com/docs/guiding-principles/',
          ],
          [
            'Testing Library: React introduction',
            'https://testing-library.com/docs/react-testing-library/intro/',
          ],
        ],
      }),
      next: {
        required: { id: 'performance', orientation: 'down' },
        optional: [
          { id: 'javascript-testing', orientation: 'left' },
          { id: 'nextjs-testing', orientation: 'right' },
        ],
      },
    },
    {
      id: 'javascript-testing',
      title: 'Unit Testing',
      description:
        'Exercise pure logic, edge cases, and invariants with fast, repeatable tests.',
      content: lesson({
        title: 'Make failures small and reproducible',
        introduction:
          'Unit tests are most effective around logic with clear inputs and outputs. Table-driven examples describe known boundaries, while property-based tests explore many inputs against an invariant. Deterministic data and isolated tests make failures easier to reproduce.',
        goals: [
          'Structure tests with arrange, act, and assert, and use descriptive behavior names.',
          'Check empty inputs, duplicates, boundary values, invalid data, and input immutability.',
          'Use mocks only at real boundaries and treat coverage as a signal, not proof of correctness.',
        ],
        example: {
          language: 'typescript',
          code: 'import { expect, it } from "vitest"\n\nit("keeps only incomplete tasks", () => {\n  const tasks = [\n    { id: "1", completed: true },\n    { id: "2", completed: false },\n  ]\n  const remaining = tasks.filter((task) => !task.completed)\n  expect(remaining.map((task) => task.id)).toEqual(["2"])\n  expect(tasks).toHaveLength(2)\n})',
        },
        practice:
          'Test your task filtering function with empty data, all-complete data, and mixed data. Add a test proving that it does not mutate its input. Introduce a bug intentionally and check that the test fails for the right reason.',
        resources: [
          ['Vitest: Getting started', 'https://vitest.dev/guide/'],
          [
            'fast-check: Introduction',
            'https://fast-check.dev/docs/introduction/',
          ],
        ],
      }),
    },
    {
      id: 'nextjs-testing',
      title: 'End-to-End Testing',
      description:
        'Verify critical journeys in real browsers at desktop and mobile sizes.',
      content: lesson({
        title: 'Protect the journeys that matter',
        introduction:
          'End-to-end tests exercise the assembled application in a browser. They catch failures that isolated tests cannot, such as routing, hydration, focus management, or a layout that hides the submit button. Keep these journeys focused and use deterministic test data.',
        goals: [
          'Use resilient role-based locators and auto-waiting assertions instead of arbitrary delays.',
          'Check navigation, forms, dialogs, persistence, and failure handling across screen sizes.',
          'Use traces and screenshots to diagnose failures, and isolate external network dependencies.',
        ],
        example: {
          language: 'typescript',
          code: 'import { expect, test } from "@playwright/test"\n\ntest("creates a task", async ({ page }) => {\n  await page.goto("/tasks")\n  await page.getByRole("textbox", { name: "Task name" }).fill("Ship the project")\n  await page.getByRole("button", { name: "Add task", exact: true }).click()\n  await expect(page.getByText("Ship the project", { exact: true })).toBeVisible()\n})',
        },
        practice:
          'Automate creating and completing a task at desktop and mobile widths. Reload to check persistence. Stub a failing response and verify the user can retry without losing their input.',
        resources: [
          [
            'Playwright: Writing tests',
            'https://playwright.dev/docs/writing-tests',
          ],
          [
            'Playwright: Best practices',
            'https://playwright.dev/docs/best-practices',
          ],
        ],
      }),
    },
    {
      id: 'performance',
      title: 'Performance',
      description:
        'Measure loading, responsiveness, and visual stability before optimizing.',
      content: lesson({
        title: 'Measure a user problem before fixing it',
        introduction:
          'A fast interface loads useful content early, responds promptly, and avoids unexpected layout shifts. Performance work starts with evidence from realistic devices and networks. Reduce unnecessary work and payloads before adding memoization or complicated caching.',
        goals: [
          'Understand Largest Contentful Paint, Interaction to Next Paint, and Cumulative Layout Shift.',
          'Inspect network waterfalls, JavaScript bundles, long tasks, and rendering in DevTools.',
          'Optimize images, reserve media dimensions, split noncritical code, and avoid unnecessary client JavaScript.',
        ],
        practice:
          'Record your app on a throttled mobile connection. Identify the largest content element and one slow interaction. Make one targeted improvement, measure again under the same conditions, and record the result and tradeoff.',
        resources: [
          ['web.dev: Web Vitals', 'https://web.dev/articles/vitals'],
          [
            'Chrome DevTools: Performance',
            'https://developer.chrome.com/docs/devtools/performance',
          ],
        ],
      }),
      next: { required: { id: 'deployment', orientation: 'down' } },
    },
    {
      id: 'deployment',
      title: 'Deployment',
      description:
        'Ship a tested application with secure configuration, monitoring, and a rollback plan.',
      content: lesson({
        title: 'Turn a working project into a reliable release',
        introduction:
          'A project is not finished when it works on one laptop. Production builds, configuration, repeatable checks, and basic monitoring make releases predictable. Deployment also gives you feedback from real browsers and networks that local development cannot reproduce.',
        goals: [
          'Choose static or server hosting based on what the app actually needs.',
          'Run lint, type checks, tests, and a production build in continuous integration.',
          'Configure HTTPS and environment variables, monitor failures, and prepare a rollback.',
        ],
        practice:
          'Deploy your task application through a preview environment first. Verify direct links, refreshes, form failures, keyboard access, and mobile layouts. Publish a concise README with setup steps, architectural decisions, and known limitations.',
        resources: [
          [
            'Next.js: Deploying',
            'https://nextjs.org/docs/app/getting-started/deploying',
          ],
          [
            'GitHub Actions: Understanding workflows',
            'https://docs.github.com/en/actions/get-started/understand-github-actions',
          ],
        ],
      }),
    },
  ],
} satisfies RoadmapDefinition
