# Hermit Roadmap

## Milestones Overview

| Milestone | Name              | Status   |
| --------- | ----------------- | -------- |
| M1        | Basic Connection  | Complete |
| M2        | Bidirectional I/O | Complete |
| M3        | Production Ready  | Planned  |
| M4        | Polish            | Planned  |

---

## M1: Basic Connection

**Goal:** Agent connects to relay, web displays machines and sessions.

### E1.1: Monorepo Scaffolding

| Story | Description                                                  | Status   |
| ----- | ------------------------------------------------------------ | -------- |
| 1.1.1 | Initialize pnpm workspace with turbo                         | Complete |
| 1.1.2 | Add root configs (eslint, prettier, typescript, lint-staged) | Complete |
| 1.1.3 | Create docker-compose.yml for postgres                       | Complete |
| 1.1.4 | Create @hermit/protocol package skeleton                     | Complete |

### E1.2: Protocol Package

| Story | Description                                              | Status   |
| ----- | -------------------------------------------------------- | -------- |
| 1.2.1 | Define shared types (SessionInfo, MachineInfo, UserInfo) | Complete |
| 1.2.2 | Define Agent ↔ Relay message types                       | Complete |
| 1.2.3 | Define Client ↔ Relay message types                      | Complete |
| 1.2.4 | Add Zod schemas for runtime validation                   | Complete |
| 1.2.5 | Add type tests                                           | Complete |

### E1.3: Relay Foundation

| Story  | Description                                          | Status   |
| ------ | ---------------------------------------------------- | -------- |
| 1.3.1  | Create @hermit/relay package skeleton                | Complete |
| 1.3.2  | Set up Hono with basic health endpoint               | Complete |
| 1.3.3  | Add PostgreSQL connection with migrations            | Complete |
| 1.3.4  | Implement user registration endpoint                 | Complete |
| 1.3.5  | Implement login endpoint with JWT                    | Complete |
| 1.3.6  | Implement machine registration endpoint              | Complete |
| 1.3.7  | Add WebSocket endpoint for agents (/ws/agent)        | Complete |
| 1.3.8  | Add WebSocket endpoint for clients (/ws/client)      | Complete |
| 1.3.9  | Implement agent registry (in-memory)                 | Complete |
| 1.3.10 | Implement session routing between clients and agents | Complete |

### E1.4: Agent Foundation

| Story | Description                                      | Status   |
| ----- | ------------------------------------------------ | -------- |
| 1.4.1 | Create @hermit/agent package skeleton            | Complete |
| 1.4.2 | Implement config manager (~/.hermit/config.json) | Complete |
| 1.4.3 | Implement `hermit init` command                  | Complete |
| 1.4.4 | Implement tmux controller (list/create sessions) | Complete |
| 1.4.5 | Implement WebSocket connection to relay          | Complete |
| 1.4.6 | Implement `hermit connect` command               | Complete |
| 1.4.7 | Implement `hermit list` command                  | Complete |
| 1.4.8 | Implement `hermit new <name>` command            | Complete |

### E1.5: Web Foundation

| Story | Description                                 | Status   |
| ----- | ------------------------------------------- | -------- |
| 1.5.1 | Create @hermit/web package with Next.js     | Complete |
| 1.5.2 | Implement login page                        | Complete |
| 1.5.3 | Implement WebSocket context provider        | Complete |
| 1.5.4 | Implement machine list page                 | Complete |
| 1.5.5 | Implement session list for selected machine | Complete |
| 1.5.6 | Implement basic terminal view (read-only)   | Complete |

---

## M2: Bidirectional I/O

**Goal:** Full terminal interaction through the relay.

### E2.1: Terminal I/O

| Story | Description                             | Status   |
| ----- | --------------------------------------- | -------- |
| 2.1.1 | Add terminal input to web UI            | Complete |
| 2.1.2 | Verify resize handling works end-to-end | Complete |
| 2.1.3 | Handle multiple attached clients        | Complete |
| 2.1.4 | Add session creation from web UI        | Complete |

### E2.2: Session Persistence

| Story | Description                            | Status   |
| ----- | -------------------------------------- | -------- |
| 2.2.1 | Buffer output during client disconnect | Complete |
| 2.2.2 | Replay buffered output on reconnect    | Complete |
| 2.2.3 | Agent reconnection with session sync   | Complete |

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
