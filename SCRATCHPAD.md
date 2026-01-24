# Hermit Development Scratchpad

Session handoff notes. Most recent at top.

---

## Session 1 → Session 2

**Date:** 2025-01-24

### Completed
- Design brainstorming and decisions
- Created design document: `docs/plans/2025-01-24-hermit-design.md`
- Created CLAUDE.md with project context and development rules
- Created README.md with AI continuation prompt

### Decisions Made
| Decision | Choice |
|----------|--------|
| Package manager | pnpm workspaces |
| Agent runtime | Bun (single binary) |
| Relay runtime | Node.js + Hono |
| Web framework | Next.js 16.1.x |
| Database | PostgreSQL |
| Testing | Vitest + MSW (with WebSocket support) |
| Auth (MVP) | JWT + machine tokens |

### Files Created
- `docs/plans/2025-01-24-hermit-design.md`
- `CLAUDE.md`
- `README.md`
- `SCRATCHPAD.md`

### Test Status
- N/A (no code yet)

### Next Session Priorities
1. Create `docs/roadmap.md` with M1 epics and stories
2. Initialize monorepo scaffolding (pnpm workspace, turbo, configs)
3. Create `@hermit/protocol` package with shared types
4. Begin relay or agent skeleton

### Notes
- MSW supports WebSocket mocking via `ws` namespace (since Nov 2024)
- Use @slango.configs/* packages for eslint, prettier, typescript, vitest
- Reference gifcept for monorepo patterns
