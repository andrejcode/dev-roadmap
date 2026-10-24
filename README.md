# DevRoadmap

DevRoadmap is an application for sharing and tracking your progress in learning development skills with others.

## Roadmap navigation

Use the toolbar to zoom from 50% to 200% in 25% steps or reset to 100%. Zoom preserves the center of the current view where scrolling allows. Cards adapt to the screen size independently of zoom, while the toolbar and node detail sheets stay at their normal size.

## Roadmap rules

Roadmaps form a tree rooted at `entryNodeId`. The entry has no incoming connection, and every other node has exactly one. All nodes must be reachable from the entry, with unique IDs and existing connection targets.

Each node may define one required and up to three optional next connections. Each side (`up`, `right`, `down`, `left`) can hold only one connection, including incoming connections. For example, a downward connection occupies the target's top side, leaving at most three outgoing connections at that target.

Connections are single straight horizontal or vertical segments. The layout builds branches from the leaves upward and reserves space for each branch's nodes and edges. When branches would conflict, it extends an earlier connection and moves the entire child branch together, preserving every declared direction. Nodes never overlap, and edges neither intersect each other nor pass through other nodes. Invalid definitions throw an error from `layoutRoadmap`.

## Development and testing

Run `pnpm dev` for the development server at http://localhost:3000.

Run `pnpm test:roadmap` for the core layout tests and coverage gate. The suite checks invalid graphs, node and edge clearance, edge attachment points, canvas bounds, deterministic placement, input immutability, and a 1,000-node path. Property-based tests exercise 300 irregular trees using fixed seeds, so failures are reproducible and automatically reduced to a small example.

Layout coverage must remain at or above 98% for statements and lines, 95% for branches, and 100% for functions. The command writes reports to `coverage/`, including an HTML report at `coverage/index.html`.

Run `pnpm test:e2e` for browser tests. Playwright builds the app and starts its own production server at http://127.0.0.1:3100, leaving the development server on port 3000 running. Port 3100 must be free. The test server stops automatically when the tests finish.

Browser tests verify rendered geometry and edge attachments at multiple zoom levels, zoom limits and viewport anchoring, and node details across desktop, tablet, and mobile sizes.
