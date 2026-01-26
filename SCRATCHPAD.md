# Hermit Development Scratchpad

Session handoff notes. Most recent at top.

---

## Session 4 → Session 5

**Date:** 2025-01-26

### Completed

- E1.4: Agent Foundation (all 8 stories complete)
  - 1.4.1: Created @hermit/agent package skeleton
  - 1.4.2: Implemented config manager (~/.hermit/config.json)
  - 1.4.3: Implemented `hermit init` command
  - 1.4.4: Implemented tmux controller (list/create sessions)
  - 1.4.5: Implemented WebSocket connection to relay
  - 1.4.6: Implemented `hermit connect` command
  - 1.4.7: Implemented `hermit list` command
  - 1.4.8: Implemented `hermit new <name>` command
- Added Panda CSS as design system choice for web package
- Created E1.4 implementation plan

### Files Created/Modified

**New files:**

- `apps/agent/` - Complete agent package
  - `src/index.ts` - Version export
  - `src/cli.ts` - CLI entry point with commander.js
  - `src/config.ts` - Config manager for ~/.hermit/config.json
  - `src/config.test.ts` - Config manager tests (10 tests)
  - `src/tmux.ts` - Tmux controller (list/create/attach sessions)
  - `src/tmux.test.ts` - Tmux controller tests (12 tests)
  - `src/relay-connection.ts` - WebSocket client with reconnection
  - `src/relay-connection.test.ts` - Relay connection tests (17 tests)
  - `src/commands/init.ts` - Interactive init command
  - `src/commands/connect.ts` - Connect to relay command
  - `src/commands/list.ts` - List tmux sessions command
  - `src/commands/new.ts` - Create new session command
  - `src/commands/index.ts` - Barrel export
- `docs/plans/2025-01-26-e1.4-agent-foundation.md` - Implementation plan

### Test Status

- **Protocol:** 12 tests passing
- **Agent:** 39 tests passing
- **Relay:** 44 tests passing
- **Total:** 95 tests passing
- `pnpm check` passes all lint, type-check, and tests

### Dependency Versions Used

| Package   | Version |
| --------- | ------- |
| commander | 14.0.2  |
| ws        | 8.19.0  |
| tsx       | 4.21.0  |

### Next Session Priorities

1. Begin E1.5: Web Foundation
   - Create @hermit/web package with Next.js
   - Implement login page
   - Implement WebSocket context provider
   - Implement machine list page
2. Or run integration tests between agent and relay

### Notes

- Agent uses tsx for dev (Bun not installed on this machine)
- Bun is still target for production binary compilation
- Config stored at ~/.hermit/config.json
- Machine tokens use `hmt_` prefix
- WebSocket connection has exponential backoff (1s, 2s, 4s, 8s, 16s, 30s)
- tmux commands use execFileSync for shell injection safety

---

## Session 3 → Session 4

**Date:** 2025-01-24

### Completed

- E1.3: Relay Foundation (all 10 stories complete)
  - 1.3.1: Created @hermit/relay package skeleton
  - 1.3.2: Set up Hono with health endpoint
  - 1.3.3: Added PostgreSQL connection with migrations
  - 1.3.4: Implemented user registration endpoint
  - 1.3.5: Implemented login endpoint with JWT
  - 1.3.6: Implemented machine registration endpoint
  - 1.3.7: Added WebSocket endpoint for agents (/ws/agent)
  - 1.3.8: Added WebSocket endpoint for clients (/ws/client)
  - 1.3.9: Implemented agent registry (in-memory)
  - 1.3.10: Implemented session routing between clients and agents
- Fixed all lint errors in relay package

### Files Created/Modified

**New files:**

- `apps/relay/` - Complete relay package
  - `src/index.ts` - Main entry with Hono server
  - `src/db/index.ts` - PostgreSQL connection and migrations
  - `src/db/migrations/001-initial.sql` - Schema for users, machines, refresh_tokens
  - `src/services/auth.ts` - JWT + argon2 authentication
  - `src/repositories/users.ts` - User CRUD operations
  - `src/repositories/machines.ts` - Machine CRUD operations
  - `src/routes/auth.ts` - /auth/register, /auth/login endpoints
  - `src/routes/machines.ts` - /api/machines endpoints with auth
  - `src/registries/agents.ts` - In-memory agent tracking
  - `src/registries/clients.ts` - In-memory client tracking
  - `src/ws/agent-handler.ts` - WebSocket handler for agents
  - `src/ws/client-handler.ts` - WebSocket handler for clients
- `docs/plans/2025-01-24-e1.3-relay-foundation.md` - Implementation plan

### Test Status

- **Protocol:** 12 tests passing
- **Relay:** 44 tests passing
- **Total:** 56 tests passing
- `pnpm check` passes all lint, type-check, and tests

### Dependency Versions Used

| Package             | Version |
| ------------------- | ------- |
| hono                | 4.11.5  |
| @hono/node-server   | 1.19.9  |
| @hono/node-ws       | 1.3.0   |
| @hono/zod-validator | 0.5.0   |
| pg                  | 8.17.2  |
| jose                | 6.1.3   |
| argon2              | 0.44.0  |

### Next Session Priorities

1. Begin E1.4: Agent Foundation
   - Create @hermit/agent package skeleton
   - Implement config manager
   - Implement `hermit init` command
2. Alternatively, begin E1.5: Web Foundation if web UI is preferred first

### Notes

- WebSocket handlers use protocol messages from @hermit/protocol
- Auth middleware extracts JWT from Authorization header
- Machine tokens use `hmt_` prefix for identification
- Agent/client registries are in-memory (no persistence needed for MVP)
- Relay serves on port 3001 by default (configurable via PORT env)

---

## Session 2 → Session 3

**Date:** 2025-01-24

### Completed

- E1.1: Monorepo Scaffolding (all 4 stories complete)
- E1.2: Protocol Package (all 5 stories complete)

### Files Created

- Monorepo structure with pnpm workspaces + Turborepo
- Root configs (eslint, prettier, typescript, lint-staged)
- `docker/docker-compose.yml` for PostgreSQL
- `packages/protocol/` - Complete protocol package with types and Zod schemas

### Test Status

- Protocol: 12 tests passing

---

## Session 1 → Session 2

**Date:** 2025-01-24

### Completed

- Design brainstorming and decisions
- Created design document: `docs/plans/2025-01-24-hermit-design.md`
- Created CLAUDE.md with project context and development rules
- Created README.md with AI continuation prompt

### Decisions Made

| Decision        | Choice                                |
| --------------- | ------------------------------------- |
| Package manager | pnpm workspaces                       |
| Agent runtime   | Bun (single binary)                   |
| Relay runtime   | Node.js + Hono                        |
| Web framework   | Next.js 16.1.x                        |
| Database        | PostgreSQL                            |
| Testing         | Vitest + MSW (with WebSocket support) |
| Auth (MVP)      | JWT + machine tokens                  |

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
- Use @slango.configs/\* packages for eslint, prettier, typescript, vitest
- Reference gifcept for monorepo patterns
