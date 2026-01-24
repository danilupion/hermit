# Hermit Roadmap

## Milestones Overview

| Milestone | Name | Status |
|-----------|------|--------|
| M1 | Basic Connection | In Progress |
| M2 | Bidirectional I/O | Planned |
| M3 | Production Ready | Planned |
| M4 | Polish | Planned |

---

## M1: Basic Connection

**Goal:** Agent connects to relay, web displays machines and sessions.

### E1.1: Monorepo Scaffolding

| Story | Description | Status |
|-------|-------------|--------|
| 1.1.1 | Initialize pnpm workspace with turbo | Pending |
| 1.1.2 | Add root configs (eslint, prettier, typescript, lint-staged) | Pending |
| 1.1.3 | Create docker-compose.yml for postgres | Pending |
| 1.1.4 | Create @hermit/protocol package skeleton | Pending |

### E1.2: Protocol Package

| Story | Description | Status |
|-------|-------------|--------|
| 1.2.1 | Define shared types (SessionInfo, MachineInfo, UserInfo) | Pending |
| 1.2.2 | Define Agent ↔ Relay message types | Pending |
| 1.2.3 | Define Client ↔ Relay message types | Pending |
| 1.2.4 | Add Zod schemas for runtime validation | Pending |
| 1.2.5 | Add type tests | Pending |

### E1.3: Relay Foundation

| Story | Description | Status |
|-------|-------------|--------|
| 1.3.1 | Create @hermit/relay package skeleton | Pending |
| 1.3.2 | Set up Hono with basic health endpoint | Pending |
| 1.3.3 | Add PostgreSQL connection with migrations | Pending |
| 1.3.4 | Implement user registration endpoint | Pending |
| 1.3.5 | Implement login endpoint with JWT | Pending |
| 1.3.6 | Implement machine registration endpoint | Pending |
| 1.3.7 | Add WebSocket endpoint for agents (/ws/agent) | Pending |
| 1.3.8 | Add WebSocket endpoint for clients (/ws/client) | Pending |
| 1.3.9 | Implement agent registry (in-memory) | Pending |
| 1.3.10 | Implement session routing between clients and agents | Pending |

### E1.4: Agent Foundation

| Story | Description | Status |
|-------|-------------|--------|
| 1.4.1 | Create @hermit/agent package skeleton | Pending |
| 1.4.2 | Implement config manager (~/.hermit/config.json) | Pending |
| 1.4.3 | Implement `hermit init` command | Pending |
| 1.4.4 | Implement tmux controller (list/create sessions) | Pending |
| 1.4.5 | Implement WebSocket connection to relay | Pending |
| 1.4.6 | Implement `hermit connect` command | Pending |
| 1.4.7 | Implement `hermit list` command | Pending |
| 1.4.8 | Implement `hermit new <name>` command | Pending |

### E1.5: Web Foundation

| Story | Description | Status |
|-------|-------------|--------|
| 1.5.1 | Create @hermit/web package with Next.js | Pending |
| 1.5.2 | Implement login page | Pending |
| 1.5.3 | Implement WebSocket context provider | Pending |
| 1.5.4 | Implement machine list page | Pending |
| 1.5.5 | Implement session list for selected machine | Pending |
| 1.5.6 | Implement basic terminal view (read-only) | Pending |

---

## M2: Bidirectional I/O

**Goal:** Full terminal interaction through the relay.

### E2.1: Terminal I/O
- Full bidirectional data flow
- Resize handling
- Multiple sessions per machine

### E2.2: Session Persistence
- Agent reconnection with session sync
- Buffering during disconnect

---

## M3: Production Ready

**Goal:** Deployable, reliable system.

### E3.1: Reconnection
- Exponential backoff
- Data buffering

### E3.2: UI Polish
- Multi-tab interface
- Mobile responsive
- Proper error handling

### E3.3: Deployment
- Docker images for relay + web
- Helm charts / k8s manifests
- Environment configuration

---

## M4: Polish

**Goal:** Nice-to-have features.

### E4.1: OAuth Integration
- Google OAuth
- GitHub OAuth

### E4.2: PWA
- Service worker
- Offline indicator
- Install prompt

### E4.3: Viewer Mode
- Read-only session sharing
- Share links
