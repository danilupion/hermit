# Hermit Design Document

**Date:** 2025-01-24
**Status:** Approved

## Overview

Hermit is a self-hosted system that allows users to "carry" their terminal sessions with them. A local agent connects terminal sessions (especially Claude Code sessions) to a relay server, enabling access from anywhere via a web interface. Sessions persist even when disconnected.

## Technology Decisions

| Decision          | Choice               | Rationale                                                     |
| ----------------- | -------------------- | ------------------------------------------------------------- |
| Package manager   | pnpm workspaces      | Established, familiar tooling                                 |
| Agent runtime     | Bun                  | Compiles to single binary for easy distribution               |
| Relay runtime     | Node.js              | Battle-tested for long-running WebSocket servers, runs in k8s |
| Relay framework   | Hono + @hono/node-ws | Lightweight, TypeScript-first, good WebSocket support         |
| Web framework     | Next.js 16.1.x       | SSR, routing, familiar                                        |
| Design system     | Panda CSS            | Type-safe CSS-in-JS, zero runtime, great DX                   |
| Database          | PostgreSQL           | Proper database from the start, k8s-friendly                  |
| Auth (MVP)        | JWT + machine tokens | Simple, secure, OAuth can be added later                      |
| Shared configs    | @slango.configs/\*   | Reuse existing eslint, prettier, typescript, vitest configs   |
| Package namespace | @hermit/\*           | Consistent naming for workspace packages                      |

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER'S MACHINE                                 │
│  ┌─────────────┐    ┌─────────────┐                                     │
│  │ Claude Code │    │   Other     │                                     │
│  │  Session 1  │    │  Terminals  │                                     │
│  └──────┬──────┘    └──────┬──────┘                                     │
│         └────────┬─────────┘                                            │
│                  ▼                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                         hermit-agent                                ││
│  │  • Manages tmux sessions                                            ││
│  │  • Outbound WSS to relay                                            ││
│  │  • Multiplexes PTYs                                                 ││
│  │  • Reconnects with backoff                                          ││
│  └─────────────────────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────────────────┘
                                     │ WSS (outbound)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           hermit-relay (Hono/Node.js)                    │
│  • WebSocket hub (agents + clients)                                      │
│  • Authentication                                                        │
│  • Session routing                                                       │
│  • Machine presence tracking                                             │
│  • REST API for management                                               │
└─────────────────────────────────────┬───────────────────────────────────┘
                                     │ WSS
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           hermit-web (Next.js)                           │
│  • Session browser (machines → sessions)                                 │
│  • Multi-tab terminal interface                                          │
│  • Split panes                                                           │
│  • Mobile-responsive PWA                                                 │
└─────────────────────────────────────────────────────────────────────────┘
```

## Monorepo Structure

```
hermit/
├── pnpm-workspace.yaml
├── package.json
├── turbo.json
├── eslint.config.js
├── prettier.config.js
├── lint-staged.config.js
├── .nvmrc
├── apps/
│   ├── agent/                # @hermit/agent - Bun runtime
│   │   ├── package.json
│   │   └── src/
│   ├── relay/                # @hermit/relay - Node.js/Hono
│   │   ├── package.json
│   │   └── src/
│   └── web/                  # @hermit/web - Next.js
│       ├── package.json
│       └── src/
├── packages/
│   └── protocol/             # @hermit/protocol - shared types
│       ├── package.json
│       └── src/
│           └── index.ts
├── docker/
│   └── docker-compose.yml    # postgres only (infra for dev)
└── docs/
    └── plans/
```

## Agent Architecture

The agent runs on user machines, managing tmux sessions and maintaining a persistent WebSocket connection to the relay.

**Components:**

- `ConfigManager` - Loads ~/.hermit/config.json, stores machine token and relay URL
- `TmuxController` - Spawns/lists/attaches tmux sessions, wraps tmux CLI
- `RelayConnection` - WebSocket to relay with exponential backoff reconnection
- `SessionMultiplexer` - Routes I/O between relay and multiple tmux sessions

**Config file** (`~/.hermit/config.json`):

```json
{
  "machineId": "dani-workstation",
  "machineName": "Workstation",
  "relayUrl": "wss://hermit.example.com/agent",
  "token": "hmt_xxxxxxxxxxxx"
}
```

**CLI commands:**

- `hermit init` - prompts for relay URL, registers with relay, saves config
- `hermit connect` - establishes WebSocket, syncs existing tmux sessions
- `hermit connect --daemon` - same but backgrounds the process
- `hermit new <name>` - creates tmux session, notifies relay
- `hermit list` - shows local tmux sessions + connection status
- `hermit attach <session>` - local tmux attach (for direct use)

**Reconnection:** On disconnect, agent buffers outbound data (limited size) and reconnects with exponential backoff (1s → 2s → 4s → max 30s).

## Relay Architecture

The relay is the hub — accepts connections from agents and web clients, routes terminal I/O, and manages authentication.

**Components:**

- `HTTP Server` - Hono with @hono/node-ws for WebSocket
- `AgentRegistry` - Connected agents indexed by machineId, tracks online status
- `ClientRegistry` - Connected web clients and their session subscriptions
- `SessionRouter` - Routes data between clients and agent sessions
- `AuthService` - Validates machine tokens (DB), issues/validates client JWTs
- `Database` - PostgreSQL via connection pool

**WebSocket Endpoints:**

- `/ws/agent` - agents connect here, authenticate with machine token
- `/ws/client` - web clients connect here, authenticate with JWT

**REST Endpoints:**

- `POST /auth/login` - email/password → JWT
- `POST /auth/register` - create account (can disable in prod)
- `GET /api/machines` - list user's machines (requires JWT)
- `POST /api/machines` - register new machine, returns token

## Web Architecture

Next.js 16.1.x app providing the terminal UI.

**Pages:**

- `/login` - email/password form
- `/` - dashboard: list of machines, online status
- `/machines/[machineId]` - sessions for that machine
- `/terminal/[machineId]/[sessionId]` - full terminal view

**Key Components:**

- `MachineList` - shows machines with online/offline status
- `SessionList` - shows sessions for selected machine
- `Terminal` - xterm.js wrapped in React, handles resize
- `TerminalTabs` - multi-session tab bar (Milestone 3)

**State Management:**

- WebSocket connection managed via React context
- Server state (machines, sessions) from WebSocket events
- Local UI state with useState/useReducer

**Terminal rendering:** xterm.js with xterm-addon-fit for auto-resize.

## Database Schema

```sql
-- Users table
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Machines registered by users
CREATE TABLE machines (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  token_hash    TEXT NOT NULL,
  last_seen     TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now(),

  UNIQUE(user_id, name)
);

-- Refresh tokens for JWT rotation
CREATE TABLE refresh_tokens (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash    TEXT NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);
```

**Notes:**

- Machine tokens hashed with bcrypt or argon2
- Sessions are ephemeral - not persisted, tracked in-memory by relay

## WebSocket Protocol

All messages use JSON with typed envelopes defined in `@hermit/protocol`.

### Agent ↔ Relay

```typescript
// Agent → Relay
type AgentMessage =
  | { type: 'register'; machineId: string; token: string }
  | { type: 'sessions'; sessions: SessionInfo[] }
  | { type: 'data'; sessionId: string; data: string } // base64
  | { type: 'session_started'; session: SessionInfo }
  | { type: 'session_ended'; sessionId: string }
  | { type: 'pong' };

// Relay → Agent
type RelayToAgentMessage =
  | { type: 'registered'; success: boolean }
  | { type: 'list_sessions' }
  | { type: 'start_session'; name: string; command?: string }
  | { type: 'attach'; sessionId: string; clientId: string }
  | { type: 'detach'; sessionId: string; clientId: string }
  | { type: 'data'; sessionId: string; data: string }
  | { type: 'resize'; sessionId: string; cols: number; rows: number }
  | { type: 'ping' };
```

### Client ↔ Relay

```typescript
// Client → Relay
type ClientMessage =
  | { type: 'auth'; token: string }
  | { type: 'list_machines' }
  | { type: 'list_sessions'; machineId: string }
  | { type: 'attach'; machineId: string; sessionId: string }
  | { type: 'detach'; sessionId: string }
  | { type: 'create_session'; machineId: string; name: string; command?: string }
  | { type: 'data'; sessionId: string; data: string }
  | { type: 'resize'; sessionId: string; cols: number; rows: number }
  | { type: 'pong' };

// Relay → Client
type RelayToClientMessage =
  | { type: 'authenticated'; user: UserInfo }
  | { type: 'machines'; machines: MachineInfo[] }
  | { type: 'sessions'; machineId: string; sessions: SessionInfo[] }
  | { type: 'attached'; sessionId: string }
  | { type: 'detached'; sessionId: string }
  | { type: 'data'; sessionId: string; data: string }
  | { type: 'machine_online'; machine: MachineInfo }
  | { type: 'machine_offline'; machineId: string }
  | { type: 'session_started'; machineId: string; session: SessionInfo }
  | { type: 'session_ended'; machineId: string; sessionId: string }
  | { type: 'error'; code: string; message: string }
  | { type: 'ping' };
```

### Shared Types

```typescript
interface SessionInfo {
  id: string;
  name: string;
  command: string;
  createdAt: string;
  attachedClients: number;
}

interface MachineInfo {
  id: string;
  name: string;
  online: boolean;
  lastSeen: string;
  sessionCount: number;
}

interface UserInfo {
  id: string;
  email: string;
}
```

## Testing Strategy

**Framework:** Vitest for all packages (using @slango.configs/vitest)

**Mocking:** MSW (Mock Service Worker) for HTTP and WebSocket mocking. MSW supports WebSocket via the `ws` namespace (since Nov 2024).

**Approach:** Unit tests + integration tests from the start.

### Test Location

Tests MUST be co-located with source code, NOT in separate `__tests__/` folders:

```
src/
├── auth.ts
├── auth.test.ts        # ✓ co-located
├── router.ts
├── router.test.ts      # ✓ co-located
└── utils/
    ├── hash.ts
    └── hash.test.ts    # ✓ co-located
```

### Coverage Targets

| Package          | Target | Rationale                                 |
| ---------------- | ------ | ----------------------------------------- |
| @hermit/protocol | 90%    | Pure logic, highly testable               |
| @hermit/relay    | 80%    | Business logic + I/O                      |
| @hermit/agent    | 70%    | More I/O, tmux interaction harder to test |
| @hermit/web      | 70%    | UI components, harder to cover all states |

### Coverage Exclusions

- `*.config.{js,ts}` — config files
- `dist/**` — build output
- `**/*.d.ts` — type definitions
- `**/index.ts` — barrel exports (re-exports only)

### Test Focus Per Package

| Package          | Test Focus                                                                        |
| ---------------- | --------------------------------------------------------------------------------- |
| @hermit/protocol | Type compilation tests, runtime schema validation                                 |
| @hermit/relay    | Unit: auth logic, session routing. Integration: WebSocket flows with MSW          |
| @hermit/agent    | Unit: config parsing, tmux command building. Integration: mocked relay connection |
| @hermit/web      | Component tests with @testing-library/react, mocked WebSocket context             |

### Integration Test Pattern for WebSocket

```typescript
import { ws } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  ws.link('ws://localhost:3001/ws/agent').addEventListener('connection', ({ client }) => {
    client.addEventListener('message', (event) => {
      // Handle and respond to messages
    });
  }),
);
```

## Development Setup

**docker-compose.yml (infra only):**

```yaml
services:
  postgres:
    image: postgres:17
    ports: ['5432:5432']
    environment:
      POSTGRES_USER: hermit
      POSTGRES_PASSWORD: hermit
      POSTGRES_DB: hermit
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

**Development workflow:**

```bash
docker compose up -d          # start postgres
pnpm install                  # install dependencies
pnpm dev                      # runs turbo dev (relay + web + agent in watch mode)
```

## MVP Milestones

### Milestone 1: Basic Connection

- Agent connects to relay via WebSocket
- Agent creates/lists tmux sessions
- Web authenticates and lists machines/sessions
- Web displays terminal (read-only)

### Milestone 2: Bidirectional I/O

- Full terminal I/O through relay
- Resize handling
- Multiple sessions per machine
- Session persistence across agent restart

### Milestone 3: Production Ready

- Reconnection with buffering
- Multi-tab UI
- Mobile-responsive
- Docker deployment (relay + web)
- Proper auth

### Milestone 4: Polish

- OAuth2 integration (optional)
- Read-only viewer mode
- PWA support

## Security Requirements

1. All connections use TLS (WSS)
2. Agent auth via machine tokens (rotatable, hashed in DB)
3. Client auth via JWT
4. Users can only access their own machines
5. Relay does not persist terminal output

## Non-Goals (MVP)

- Session recording/playback
- Collaborative multi-cursor editing
- File transfer
- Port forwarding
- Windows support
