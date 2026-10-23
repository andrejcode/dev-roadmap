# DevRoadmap

DevRoadmap is an application for sharing and tracking your progress in learning development skills with others.

## Roadmap rules

Roadmaps form a tree rooted at `entryNodeId`. The entry has no incoming connection, and every other node has exactly one. All nodes must be reachable from the entry, with unique IDs and existing connection targets.

Each node may define one required and up to three optional next connections. Each side (`up`, `right`, `down`, `left`) can hold only one connection, including incoming connections. For example, a downward connection occupies the target's top side, leaving at most three outgoing connections at that target.

Connections are single straight horizontal or vertical segments. Each connection places its target one grid step away in the declared direction. Branch spacing is fixed, so colliding branches are not automatically moved apart. Invalid definitions throw an error from `layoutRoadmap`.

## Development and testing

Run `pnpm dev` for the development server at http://localhost:3000.

Run `pnpm test:e2e` for browser tests. Playwright builds the app and starts its own production server at http://127.0.0.1:3100, leaving the development server on port 3000 running. Port 3100 must be free. The test server stops automatically when the tests finish.
