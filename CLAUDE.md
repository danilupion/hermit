# Project: Hermit

## Quick Context

Hermit is a self-hosted terminal relay system. Users run an agent on their machines that connects to a relay server, enabling terminal access from anywhere via a web interface. Sessions persist via tmux.

**Current Session:** 1
**Current Milestone:** M1 (Basic Connection)

## Tech Stack

| Component | Technology |
|-----------|------------|
| Monorepo | pnpm workspaces + Turborepo |
| Agent | TypeScript + Bun (compiles to single binary) |
| Relay | TypeScript + Node.js + Hono |
| Web | Next.js 16.1.x |
| Database | PostgreSQL |
| Testing | Vitest + MSW (including WebSocket mocking) |
| Shared configs | @slango.configs/* (eslint, prettier, typescript, vitest) |

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
│   ├── agent/      # @hermit/agent
│   ├── relay/      # @hermit/relay
│   └── web/        # @hermit/web
├── packages/
│   └── protocol/   # @hermit/protocol (shared types)
└── docker/
    └── docker-compose.yml  # postgres for dev
```

## Development Rules

### Dependencies

1. **Always use latest versions** - Do not rely on training data. Check npm or use web search for current versions.
2. **Pin exact versions** - Use `"1.2.3"` not `"^1.2.3"` or `"~1.2.3"` in package.json.
3. **Check before installing** - Run `npm view <package> version` to get the latest version.

### Code Style

- Follow patterns in @slango.configs/* packages
- Use `type` over `interface` for type definitions (consistency with protocol)
- Prefer explicit returns over implicit
- No default exports (except where framework requires, e.g., Next.js pages)

### Testing Strategy

- **Framework:** Vitest for all packages
- **Mocking:** MSW for HTTP and WebSocket mocking
- **Coverage:** Unit tests + integration tests from the start
- **Test location:** `src/**/*.test.ts` co-located with source

| Package | Test Focus |
|---------|------------|
| protocol | Type compilation, schema validation |
| relay | Auth logic, WebSocket routing, REST endpoints |
| agent | Config parsing, tmux commands (mocked), reconnection logic |
| web | Component tests with @testing-library/react |

### Git Commits

- Reference milestone/epic/story IDs: `M1/E1.1/1.1.1: description`
- Keep commits atomic
- Co-author with Claude when AI-assisted

## Key Files

- `docs/plans/2025-01-24-hermit-design.md` - Full design document
- `docs/roadmap.md` - Milestone roadmap and stories (to be created)
- `SCRATCHPAD.md` - Session handoff notes (to be created)

## Current State

- [x] Design document approved
- [ ] Monorepo scaffolding
- [ ] Protocol package
- [ ] Relay basic structure
- [ ] Agent basic structure
- [ ] Web basic structure

## Milestones

- **M1:** Basic Connection - agent connects to relay, web shows sessions
- **M2:** Bidirectional I/O - full terminal through relay
- **M3:** Production Ready - reconnection, multi-tab, Docker deployment
- **M4:** Polish - OAuth, PWA, viewer mode
