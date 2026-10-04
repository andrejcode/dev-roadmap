<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Git Commits

Use the Conventional Commits format for every commit message: `<type>(optional-scope): <description>`. Use an appropriate standard type such as `feat`, `fix`, `docs`, `refactor`, `test`, `build`, `ci`, or `chore`, and include a breaking-change marker or footer when applicable.

Omit the body when the subject fully explains a small, self-contained change. Add a body when the motivation, user-visible behavior, tradeoffs, migration steps, or non-obvious consequences need explanation. Separate it from the subject with a blank line, write concise paragraphs or bullets, and focus on why the change was made and what changed rather than narrating the implementation line by line.
