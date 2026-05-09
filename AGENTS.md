<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Memora Agent Map

Before making domain changes, review:

- `.agents/README.md`
- `docs/codex-project-guide.md`

Specialized agent profiles available in this repo:

- `.agents/topics-agent.md`
- `.agents/flashcards-agent.md`
- `.agents/study-agent.md`
- `.agents/ui-agent.md`

Core project rules:

- Respect `UI -> queries -> services -> repositories`.
- Keep feature and product documentation up to date as part of implementation.
- If a change affects UX, also update `docs/ui-product-rules.md`.
