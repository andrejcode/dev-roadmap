# DevRoadmap

DevRoadmap is an application for sharing and tracking your progress in learning development skills with others.

## Roadmap navigation

Use the toolbar to zoom from 50% to 200% in 25% steps or reset to 100%. Zoom preserves the center of the current view where scrolling allows. Cards adapt to the screen size independently of zoom, while the toolbar and node detail sheets stay at their normal size.

## Topic learning material

The frontend roadmap contains 18 topics, from web foundations to deployment. Each topic includes an explanation, learning goals, a practical exercise, and two references. Some lessons also include code examples or tables.

Topic `content` uses Tiptap JSON. The lesson builder in `lib/roadmap/frontend.ts` keeps this seed data readable. The topic sheet uses Tiptap's static React renderer, with no editor instance, editable surface, or raw HTML insertion. Content authoring and persistence are not implemented yet.

`validateTopicContent` restricts the document to the supported schema, with H2/H3 headings, paragraphs, lists, quotes, basic formatting, code blocks, and simple tables. Limits are 30,000 text characters, 200,000 UTF-8 bytes of JSON, 500 document nodes, eight nesting levels, and tables up to 20 rows by six columns. Code and table text count toward the same character limit. Invalid documents show a fallback instead of rendering. Future write endpoints must call the same validator and enforce request size limits and authorization on the server.

Only absolute HTTPS resource URLs without embedded credentials are accepted. Resource actions always show the hostname and full URL for confirmation before opening a new tab with `noopener,noreferrer`. There is no direct link to bypass confirmation with a modifier click or context menu. HTTPS does not verify a destination's trustworthiness, and the app does not fetch link previews.

## Roadmap rules

Roadmaps form a tree rooted at `entryNodeId`. The entry has no incoming connection, and every other node has exactly one. All nodes must be reachable from the entry, with unique IDs and existing connection targets.

Each node may define one required and up to three optional next connections. Each side (`up`, `right`, `down`, `left`) can hold only one connection, including incoming connections. For example, a downward connection occupies the target's top side, leaving at most three outgoing connections at that target.

Connections are single straight horizontal or vertical segments. The layout builds branches from the leaves upward and reserves space for each branch's nodes and edges. When branches would conflict, it extends an earlier connection and moves the entire child branch together, preserving every declared direction. Nodes never overlap, and edges neither intersect each other nor pass through other nodes. Invalid definitions throw an error from `layoutRoadmap`.

## Development and testing

Run `pnpm dev` for the development server at http://localhost:3000.

Run `pnpm test:roadmap` for the core layout tests and coverage gate. The suite checks invalid graphs, node and edge clearance, edge attachment points, canvas bounds, deterministic placement, input immutability, and a 1,000-node path. Property-based tests exercise 300 irregular trees using fixed seeds, so failures are reproducible and automatically reduced to a small example.

Layout coverage must remain at or above 98% for statements and lines, 95% for branches, and 100% for functions. The command writes reports to `coverage/`, including an HTML report at `coverage/index.html`.

Run `pnpm test:e2e` for browser tests. Playwright builds the app and starts its own production server at http://127.0.0.1:3100, leaving the development server on port 3000 running. Port 3100 must be free. The test server stops automatically when the tests finish.

Browser tests verify rendered geometry and edge attachments at multiple zoom levels, zoom limits and viewport anchoring, and every topic's learning material across desktop, tablet, and mobile sizes. Resource tests cover confirmation, cancellation, keyboard and modifier activation, and opener/referrer isolation. External destinations are intercepted with local fixtures.
