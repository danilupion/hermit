# Hermit Development Scratchpad

Session handoff notes. Most recent at top.

---

## Session 6 → Session 7

**Date:** 2025-01-31

### Completed

- E2.1: Terminal I/O
  - 2.1.1: Add terminal input to web UI (from previous session)
  - 2.1.2: Verify resize handling - fixed initial size not sent after attach
  - 2.1.4: Add session creation from web UI
- Fixed many pre-existing lint errors across codebase
- Fixed port configuration (default ports were 3001, relay runs on 3550)
- Fixed API to use relative URLs for Next.js proxy
- Fixed hydration mismatch errors (added mounted state to auth-guarded pages)
- Moved styled-system outside src and gitignored
- Cleaned git history with git-filter-repo

### Files Modified

- `apps/web/src/stores/relay.ts` - Added `addSession` method
- `apps/web/src/stores/relay.test.ts` - Added tests for `addSession`
- `apps/web/src/hooks/useWebSocket.ts` - Handle `session_started`, fixed WS URL
- `apps/web/src/lib/api.ts` - Use relative URLs for proxy
- `apps/web/src/app/machines/[machineId]/page.tsx` - New Session button, hydration fix
- `apps/web/src/app/machines/[machineId]/[sessionId]/page.tsx` - Initial resize fix, hydration fix
- `apps/web/src/app/machines/page.tsx` - Hydration fix
- `apps/web/src/app/login/page.tsx` - Hydration fix
- `apps/web/src/app/page.tsx` - Hydration fix
- `apps/agent/src/tmux.ts` - Fixed lint errors, typed decodeOctal
- `apps/agent/src/tmux.test.ts` - Added decodeOctal tests
- `apps/relay/src/db/pool.ts` - Added drizzle db export
- `apps/relay/src/db/schema.ts` - Removed unused serial import
- `apps/web/next.config.ts` - Removed unnecessary async

### Infrastructure

- `docker-compose.yml` at project root
- PostgreSQL 18 on port 5490
- styled-system gitignored, lives at `apps/web/styled-system/`

### Test Status

- **Protocol:** 12 tests passing
- **Agent:** 47 tests passing
- **Relay:** 44 tests passing
- **Web:** 32 tests passing
- **Total:** 135 tests passing

### Remaining E2.1 Stories

- 2.1.3: Handle multiple attached clients

### Missing Feature (add to backlog)

- **Machine registration from web UI** - Currently requires curl to register a machine and get token. Should add a "Register Machine" button on machines page that shows the token once for user to copy.

### Next Session Priorities

1. Add machine registration from web UI (new story)
2. Complete 2.1.3: Handle multiple attached clients
3. Begin E2.2: Session Persistence

### Demo Instructions

To test the system:

```bash
# Terminal 1 - Database
docker compose up

# Terminal 2 - Relay
pnpm --filter @hermit/relay dev

# Terminal 3 - Web
pnpm --filter @hermit/web dev

# Create user
curl -s -X POST http://localhost:3550/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"test123"}'

# Register machine (use accessToken from above)
curl -s -X POST http://localhost:3550/api/machines \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <TOKEN>' \
  -d '{"name":"my-laptop"}'

# Configure agent (~/.hermit/config.json)
{
  "relayUrl": "ws://localhost:3550/ws/agent",
  "machineName": "my-laptop",
  "machineId": "<ID>",
  "token": "<TOKEN>"
}

# Terminal 4 - Agent
pnpm --filter @hermit/agent cli connect
```

Then open http://localhost:3500, login, see machine, create session, use terminal.

---

## Session 5 → Session 6

**Date:** 2025-01-28

### Completed

- E1.5: Web Foundation (all 6 stories complete)
  - 1.5.1: Created @hermit/web package with Next.js + Panda CSS (from session 4)
  - 1.5.2: Implemented login page (auth store, API client, LoginForm component)
  - 1.5.3: Implemented WebSocket context provider (ws client, relay store, useWebSocket hook)
  - 1.5.4: Implemented machine list page (MachineCard, MachineList components)
  - 1.5.5: Implemented session list page (SessionCard, SessionList components)
  - 1.5.6: Implemented terminal view (read-only with xterm.js)

**M1: Basic Connection is now complete!**

- M2: Bidirectional I/O started
  - 2.1.1: Add terminal input to web UI

### Files Created/Modified

**New files:**

- `apps/web/src/stores/auth.ts` - Auth state (token, user)
- `apps/web/src/stores/auth.test.ts` - Auth store tests
- `apps/web/src/stores/relay.ts` - WebSocket connection state
- `apps/web/src/stores/relay.test.ts` - Relay store tests
- `apps/web/src/lib/api.ts` - REST API client
- `apps/web/src/lib/api.test.ts` - API client tests
- `apps/web/src/lib/ws.ts` - WebSocket client wrapper
- `apps/web/src/lib/ws.test.ts` - WebSocket client tests
- `apps/web/src/hooks/useWebSocket.ts` - WebSocket hook with auto-reconnect
- `apps/web/src/components/auth/LoginForm.tsx` - Login form component
- `apps/web/src/components/machines/MachineCard.tsx` - Machine card component
- `apps/web/src/components/machines/MachineList.tsx` - Machine list component
- `apps/web/src/components/sessions/SessionCard.tsx` - Session card component
- `apps/web/src/components/sessions/SessionList.tsx` - Session list component
- `apps/web/src/components/terminal/Terminal.tsx` - xterm.js terminal component
- `apps/web/src/app/machines/page.tsx` - Machine list page
- `apps/web/src/app/machines/[machineId]/page.tsx` - Session list page
- `apps/web/src/app/machines/[machineId]/[sessionId]/page.tsx` - Terminal view page

**Modified files:**

- `apps/web/src/app/page.tsx` - Auth-aware redirect
- `apps/web/src/app/login/page.tsx` - Full login implementation

### Test Status

- **Protocol:** 12 tests passing
- **Agent:** 39 tests passing
- **Relay:** 44 tests passing
- **Web:** 30 tests passing
- **Total:** 125 tests passing

### Notes

- Terminal is now **interactive** - input support added in M2/2.1.1
- WebSocket reconnection uses fixed 2s delay - exponential backoff will be added in M3
- Catppuccin-style dark theme used throughout
- xterm.js CSS imported statically for build compatibility

---

## Session 4 → Session 5

**Date:** 2025-01-27

### Completed

- E1.4: Agent Foundation (all 8 stories complete)
  - 1.4.1-1.4.8: All agent commands implemented
  - Bug fix: Handle tmux "error connecting" when server not running
- E1.5: Web Foundation (1 of 6 stories complete)
  - 1.5.1: Created @hermit/web package with Next.js + Panda CSS
- Created E1.5 implementation plan

### Files Created/Modified

**New files:**

- `apps/web/` - Web package skeleton
  - `package.json` - Next.js 16.1.5, Panda CSS, xterm.js
  - `panda.config.ts` - Dark theme design tokens
  - `src/app/layout.tsx` - Root layout
  - `src/app/page.tsx` - Home redirect to login
  - `src/app/login/page.tsx` - Login page placeholder
  - `src/styled-system/` - Panda CSS generated files
- `docs/plans/2025-01-27-e1.5-web-foundation.md` - Implementation plan

### Test Status

- **Protocol:** 12 tests passing
- **Agent:** 39 tests passing
- **Relay:** 44 tests passing
- **Web:** 0 tests (passWithNoTests enabled)
- **Total:** 95 tests passing

### Dependency Versions Used

| Package       | Version |
| ------------- | ------- |
| next          | 16.1.5  |
| react         | 19.2.3  |
| @pandacss/dev | 1.8.1   |
| @xterm/xterm  | 6.0.0   |
| zustand       | 5.0.10  |
| concurrently  | 9.2.1   |

### Next Session Priorities

1. Continue E1.5: Web Foundation
   - 1.5.2: Implement login page (auth store, API client, form)
   - 1.5.3: Implement WebSocket context provider
   - 1.5.4: Implement machine list page
   - 1.5.5: Implement session list page
   - 1.5.6: Implement terminal view (read-only)
2. After E1.5, M1 is complete - can do integration demo

### Notes

- Web uses Next.js App Router with Panda CSS
- Design tokens set up with dark Catppuccin-style theme
- xterm.js included for terminal rendering in 1.5.6
- See `docs/plans/2025-01-27-e1.5-web-foundation.md` for detailed implementation plan

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
