# Project: Hermit

## Quick Context

Hermit is a self-hosted terminal relay system. Users run an agent on their machines that connects to a relay server, enabling terminal access from anywhere via a web interface. Sessions persist via tmux.

**Current Session:** 4
**Current Milestone:** M1 (Basic Connection)
**Current Epic:** E1.3 Complete, E1.4 in progress

## Tech Stack

| Component      | Technology                                                |
| -------------- | --------------------------------------------------------- |
| Monorepo       | pnpm workspaces + Turborepo                               |
| Agent          | TypeScript + Bun (compiles to single binary)              |
| Relay          | TypeScript + Node.js + Hono                               |
| Web            | Next.js 16.1.x + Panda CSS                                |
| Database       | PostgreSQL                                                |
| Testing        | Vitest + MSW (including WebSocket mocking)                |
| Shared configs | @slango.configs/\* (eslint, prettier, typescript, vitest) |

## Architecture

```
User Machine                    Server (k8s)                 Browser
┌─────────────┐                ┌─────────────┐              ┌─────────────┐
│   Agent     │──── WSS ──────▶│   Relay     │◀──── WSS ───│    Web      │
│  (Bun)      │                │  (Hono)     │              │  (Next.js)  │
└─────────────┘                └─────────────┘              └─────────────┘
      │                              │
      ▼                              ▼
   [tmux]                      [PostgreSQL]
```

## Package Structure

```
hermit/
├── apps/
│   ├── agent/      # @hermit/agent (in progress)
│   ├── relay/      # @hermit/relay ✓
│   └── web/        # @hermit/web (not yet created) - Next.js + Panda CSS
├── packages/
│   └── protocol/   # @hermit/protocol ✓
└── docker/
    └── docker-compose.yml  # postgres for dev ✓
```

## Development Rules

### Dependencies

1. **Always use latest versions** - Do not rely on training data. Check npm or use web search for current versions.
2. **Pin exact versions** - Use `"1.2.3"` not `"^1.2.3"` or `"~1.2.3"` in package.json.
3. **Check before installing** - Run `npm view <package> version` to get the latest version.

### Code Style

- Follow patterns in @slango.configs/\* packages
- Use `type` over `interface` for type definitions (consistency with protocol)
- Prefer explicit returns over implicit
- No default exports (except where framework requires, e.g., Next.js pages)

### Testing Strategy

- **Framework:** Vitest for all packages
- **Mocking:** MSW for HTTP and WebSocket mocking
- **Coverage:** Unit tests + integration tests from the start

**Test location:** Co-located with source, NOT in `__tests__/` folders:

```
src/
├── auth.ts
├── auth.test.ts        # ✓ co-located
├── router.ts
├── router.test.ts      # ✓ co-located
```

**Coverage targets:**

| Package  | Target | Rationale                                 |
| -------- | ------ | ----------------------------------------- |
| protocol | 90%    | Pure logic, highly testable               |
| relay    | 80%    | Business logic + I/O                      |
| agent    | 70%    | More I/O, tmux interaction harder to test |
| web      | 70%    | UI components, harder to cover all states |

**Coverage exclusions:**

- `*.config.{js,ts}` — config files
- `dist/**` — build output
- `**/*.d.ts` — type definitions
- `**/index.ts` — barrel exports (re-exports only)

**Test focus per package:**

| Package  | Test Focus                                                 |
| -------- | ---------------------------------------------------------- |
| protocol | Type compilation, schema validation                        |
| relay    | Auth logic, WebSocket routing, REST endpoints              |
| agent    | Config parsing, tmux commands (mocked), reconnection logic |
| web      | Component tests with @testing-library/react                |

### Git Commits

- Reference milestone/epic/story IDs: `M1/E1.1/1.1.1: description`
- Keep commits atomic
- Co-author with Claude when AI-assisted

## Key Files

- `docs/plans/2025-01-24-hermit-design.md` - Full design document
- `docs/plans/2025-01-24-m1-implementation.md` - M1 implementation plan (E1.1, E1.2)
- `docs/plans/2025-01-24-e1.3-relay-foundation.md` - E1.3 implementation plan
- `docs/plans/2025-01-26-e1.4-agent-foundation.md` - E1.4 implementation plan
- `docs/roadmap.md` - Milestone roadmap and stories
- `SCRATCHPAD.md` - Session handoff notes

## Current State

- [x] Design document approved
- [x] Monorepo scaffolding (E1.1)
- [x] Protocol package (E1.2)
- [x] Relay foundation (E1.3)
- [ ] Agent foundation (E1.4)
- [ ] Web foundation (E1.5)

## Milestones

- **M1:** Basic Connection - agent connects to relay, web shows sessions
- **M2:** Bidirectional I/O - full terminal through relay
- **M3:** Production Ready - reconnection, multi-tab, Docker deployment
- **M4:** Polish - OAuth, PWA, viewer mode
