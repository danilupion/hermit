# M1: Basic Connection - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Agent connects to relay via WebSocket, web UI displays machines and sessions.

**Architecture:** Monorepo with pnpm workspaces and Turborepo. Protocol package shared across relay, agent, and web. Relay uses Hono on Node.js with PostgreSQL. Agent uses Bun with commander for CLI. Web uses Next.js 16.1.x.

**Tech Stack:**
- pnpm 10.x, Turborepo, @slango.configs/*
- Hono 4.11.4, @hono/node-server 1.19.9, @hono/node-ws 1.3.0
- PostgreSQL 17, pg 8.17.1
- Zod 4.3.6, jose 6.1.3, argon2 0.44.0
- MSW 2.12.7, Vitest (from @slango.configs/vitest)
- Next.js 16.1.x, xterm.js

**Reference repos:**
- Monorepo patterns: `/Volumes/External Storage/Workspace/gifcept`
- Shared configs: `/Volumes/External Storage/Workspace/slango`

---

## Task 1: Initialize pnpm Workspace (E1.1/1.1.1)

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `.nvmrc`
- Create: `.npmrc`

**Step 1: Create root package.json**

```json
{
  "name": "hermit",
  "private": true,
  "author": {
    "name": "Dani Lupión",
    "email": "danilupion@gmail.com"
  },
  "description": "Self-hosted terminal relay system",
  "license": "Apache-2.0",
  "type": "module",
  "scripts": {
    "dev": "turbo dev build:watch",
    "build": "turbo build",
    "build:check": "turbo build:check",
    "lint": "eslint . --max-warnings 0 && turbo lint",
    "lint:fix": "eslint . --fix --max-warnings 0 && turbo lint:fix",
    "test": "turbo test",
    "test:watch": "turbo test:watch",
    "format": "prettier --ignore-unknown --write .",
    "check": "turbo check"
  },
  "devDependencies": {
    "@slango.configs/eslint": "1.1.45",
    "@slango.configs/lint-staged": "1.1.13",
    "@slango.configs/prettier": "1.0.8",
    "@slango.configs/scripts": "1.2.0",
    "eslint": "9.39.2",
    "husky": "9.1.7",
    "lint-staged": "16.2.7",
    "prettier": "3.8.1",
    "turbo": "2.7.5"
  },
  "engines": {
    "node": "^24.13.0",
    "pnpm": "^10.28.1"
  },
  "packageManager": "pnpm@10.28.1"
}
```

**Step 2: Create pnpm-workspace.yaml**

```yaml
packages:
  - apps/*
  - packages/*

onlyBuiltDependencies:
  - '@swc/core'
  - argon2
  - esbuild
  - unrs-resolver
```

**Step 3: Create turbo.json**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "tui",
  "globalDependencies": ["pnpm-lock.yaml"],
  "tasks": {
    "dev": {
      "dependsOn": ["^build"],
      "persistent": true
    },
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", ".env*"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"],
      "env": ["NODE_ENV"]
    },
    "build:watch": {
      "dependsOn": ["^build"],
      "persistent": true
    },
    "build:check": {
      "dependsOn": ["^build"]
    },
    "check": {
      "dependsOn": ["lint", "test", "build:check"],
      "outputs": []
    },
    "lint": {
      "dependsOn": ["^build"],
      "env": ["NODE_ENV"]
    },
    "lint:fix": {
      "dependsOn": ["^build"],
      "env": ["NODE_ENV"]
    },
    "test": {
      "dependsOn": ["^build"],
      "env": ["NODE_ENV", "CI"]
    },
    "test:watch": {
      "dependsOn": ["^build"],
      "env": ["NODE_ENV", "CI"]
    }
  }
}
```

**Step 4: Create .nvmrc**

```
24.13.0
```

**Step 5: Create .npmrc**

```
auto-install-peers=true
```

**Step 6: Create directory structure**

Run:
```bash
mkdir -p apps packages docker docs/plans
```

**Step 7: Commit**

```bash
git add package.json pnpm-workspace.yaml turbo.json .nvmrc .npmrc
git commit -m "M1/E1.1/1.1.1: Initialize pnpm workspace with turbo"
```

---

## Task 2: Add Root Configs (E1.1/1.1.2)

**Files:**
- Create: `eslint.config.js`
- Create: `prettier.config.js`
- Create: `lint-staged.config.js`
- Modify: `.husky/pre-commit`

**Step 1: Create eslint.config.js**

```javascript
export { default } from '@slango.configs/eslint/typescript.js';
```

**Step 2: Create prettier.config.js**

```javascript
export { default } from '@slango.configs/prettier/default.js';
```

**Step 3: Create lint-staged.config.js**

```javascript
export { default } from '@slango.configs/lint-staged/default.js';
```

**Step 4: Initialize husky**

Run:
```bash
pnpm install
pnpm exec husky init
```

**Step 5: Create .husky/pre-commit**

```bash
pnpm exec lint-staged
```

**Step 6: Test lint**

Run:
```bash
pnpm lint
```

Expected: No errors (empty project)

**Step 7: Commit**

```bash
git add eslint.config.js prettier.config.js lint-staged.config.js .husky
git commit -m "M1/E1.1/1.1.2: Add root configs (eslint, prettier, lint-staged)"
```

---

## Task 3: Create Docker Compose for Postgres (E1.1/1.1.3)

**Files:**
- Create: `docker/docker-compose.yml`

**Step 1: Create docker/docker-compose.yml**

```yaml
services:
  postgres:
    image: postgres:17
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: hermit
      POSTGRES_PASSWORD: hermit
      POSTGRES_DB: hermit
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U hermit"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
```

**Step 2: Test postgres starts**

Run:
```bash
docker compose -f docker/docker-compose.yml up -d
docker compose -f docker/docker-compose.yml ps
```

Expected: postgres container running and healthy

**Step 3: Stop postgres**

Run:
```bash
docker compose -f docker/docker-compose.yml down
```

**Step 4: Commit**

```bash
git add docker/docker-compose.yml
git commit -m "M1/E1.1/1.1.3: Add docker-compose for postgres"
```

---

## Task 4: Create @hermit/protocol Package Skeleton (E1.1/1.1.4)

**Files:**
- Create: `packages/protocol/package.json`
- Create: `packages/protocol/tsconfig.json`
- Create: `packages/protocol/tsconfig.build.json`
- Create: `packages/protocol/eslint.config.js`
- Create: `packages/protocol/vitest.config.js`
- Create: `packages/protocol/src/index.ts`

**Step 1: Create packages/protocol/package.json**

```json
{
  "name": "@hermit/protocol",
  "version": "0.0.1",
  "private": true,
  "description": "Hermit shared protocol types",
  "type": "module",
  "exports": {
    "./*": {
      "import": "./dist/*.js",
      "types": "./dist/*.d.ts"
    }
  },
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "build:watch": "tsc --watch -p tsconfig.build.json",
    "build:check": "tsc --noEmit",
    "lint": "eslint . --max-warnings 0",
    "lint:fix": "eslint . --fix --max-warnings 0",
    "test": "vitest --run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "zod": "4.3.6"
  },
  "devDependencies": {
    "@slango.configs/eslint": "1.1.45",
    "@slango.configs/typescript": "1.0.7",
    "@slango.configs/vitest": "2.0.2",
    "@vitest/coverage-v8": "4.0.17",
    "eslint": "9.39.2",
    "typescript": "5.9.3",
    "vitest": "4.0.17"
  }
}
```

**Step 2: Create packages/protocol/tsconfig.json**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "@slango.configs/typescript/default.json",
  "compilerOptions": {
    "noEmit": true
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 3: Create packages/protocol/tsconfig.build.json**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": false,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "exclude": ["node_modules", "dist", "src/**/*.test.ts"]
}
```

**Step 4: Create packages/protocol/eslint.config.js**

```javascript
export { default } from '@slango.configs/eslint/typescript.js';
```

**Step 5: Create packages/protocol/vitest.config.js**

```javascript
export { default } from '@slango.configs/vitest/default';
```

**Step 6: Create packages/protocol/src/index.ts**

```typescript
// @hermit/protocol - Shared types for Hermit
// Types will be added in subsequent tasks

export const PROTOCOL_VERSION = '0.0.1';
```

**Step 7: Install and build**

Run:
```bash
pnpm install
pnpm --filter @hermit/protocol build
```

Expected: Build succeeds, dist/ created with index.js and index.d.ts

**Step 8: Commit**

```bash
git add packages/protocol
git commit -m "M1/E1.1/1.1.4: Create @hermit/protocol package skeleton"
```

---

## Task 5: Define Shared Types (E1.2/1.2.1)

**Files:**
- Create: `packages/protocol/src/types.ts`
- Modify: `packages/protocol/src/index.ts`

**Step 1: Create packages/protocol/src/types.ts**

```typescript
export type MachineId = string;
export type SessionId = string;
export type UserId = string;
export type ClientId = string;

export type SessionInfo = {
  id: SessionId;
  name: string;
  command: string;
  createdAt: string;
  attachedClients: number;
};

export type MachineInfo = {
  id: MachineId;
  name: string;
  online: boolean;
  lastSeen: string;
  sessionCount: number;
};

export type UserInfo = {
  id: UserId;
  email: string;
};
```

**Step 2: Update packages/protocol/src/index.ts**

```typescript
export * from './types.js';

export const PROTOCOL_VERSION = '0.0.1';
```

**Step 3: Build and verify**

Run:
```bash
pnpm --filter @hermit/protocol build
```

Expected: Build succeeds

**Step 4: Commit**

```bash
git add packages/protocol/src
git commit -m "M1/E1.2/1.2.1: Define shared types (SessionInfo, MachineInfo, UserInfo)"
```

---

## Task 6: Define Agent ↔ Relay Message Types (E1.2/1.2.2)

**Files:**
- Create: `packages/protocol/src/agent-messages.ts`
- Modify: `packages/protocol/src/index.ts`

**Step 1: Create packages/protocol/src/agent-messages.ts**

```typescript
import type { SessionId, SessionInfo } from './types.js';

// Agent → Relay messages
export type AgentRegisterMessage = {
  type: 'register';
  machineName: string;
  token: string;
};

export type AgentSessionsMessage = {
  type: 'sessions';
  sessions: SessionInfo[];
};

export type AgentDataMessage = {
  type: 'data';
  sessionId: SessionId;
  data: string; // base64 encoded
};

export type AgentSessionStartedMessage = {
  type: 'session_started';
  session: SessionInfo;
};

export type AgentSessionEndedMessage = {
  type: 'session_ended';
  sessionId: SessionId;
};

export type AgentPongMessage = {
  type: 'pong';
};

export type AgentMessage =
  | AgentRegisterMessage
  | AgentSessionsMessage
  | AgentDataMessage
  | AgentSessionStartedMessage
  | AgentSessionEndedMessage
  | AgentPongMessage;

// Relay → Agent messages
export type RelayRegisteredMessage = {
  type: 'registered';
  success: boolean;
  machineId?: string;
  error?: string;
};

export type RelayListSessionsMessage = {
  type: 'list_sessions';
};

export type RelayStartSessionMessage = {
  type: 'start_session';
  name: string;
  command?: string;
};

export type RelayAttachMessage = {
  type: 'attach';
  sessionId: SessionId;
  clientId: string;
};

export type RelayDetachMessage = {
  type: 'detach';
  sessionId: SessionId;
  clientId: string;
};

export type RelayDataMessage = {
  type: 'data';
  sessionId: SessionId;
  data: string; // base64 encoded
};

export type RelayResizeMessage = {
  type: 'resize';
  sessionId: SessionId;
  cols: number;
  rows: number;
};

export type RelayPingMessage = {
  type: 'ping';
};

export type RelayToAgentMessage =
  | RelayRegisteredMessage
  | RelayListSessionsMessage
  | RelayStartSessionMessage
  | RelayAttachMessage
  | RelayDetachMessage
  | RelayDataMessage
  | RelayResizeMessage
  | RelayPingMessage;
```

**Step 2: Update packages/protocol/src/index.ts**

```typescript
export * from './types.js';
export * from './agent-messages.js';

export const PROTOCOL_VERSION = '0.0.1';
```

**Step 3: Build and verify**

Run:
```bash
pnpm --filter @hermit/protocol build
```

Expected: Build succeeds

**Step 4: Commit**

```bash
git add packages/protocol/src
git commit -m "M1/E1.2/1.2.2: Define Agent ↔ Relay message types"
```

---

## Task 7: Define Client ↔ Relay Message Types (E1.2/1.2.3)

**Files:**
- Create: `packages/protocol/src/client-messages.ts`
- Modify: `packages/protocol/src/index.ts`

**Step 1: Create packages/protocol/src/client-messages.ts**

```typescript
import type { MachineId, MachineInfo, SessionId, SessionInfo, UserInfo } from './types.js';

// Client → Relay messages
export type ClientAuthMessage = {
  type: 'auth';
  token: string;
};

export type ClientListMachinesMessage = {
  type: 'list_machines';
};

export type ClientListSessionsMessage = {
  type: 'list_sessions';
  machineId: MachineId;
};

export type ClientAttachMessage = {
  type: 'attach';
  machineId: MachineId;
  sessionId: SessionId;
};

export type ClientDetachMessage = {
  type: 'detach';
  sessionId: SessionId;
};

export type ClientCreateSessionMessage = {
  type: 'create_session';
  machineId: MachineId;
  name: string;
  command?: string;
};

export type ClientDataMessage = {
  type: 'data';
  sessionId: SessionId;
  data: string; // base64 encoded
};

export type ClientResizeMessage = {
  type: 'resize';
  sessionId: SessionId;
  cols: number;
  rows: number;
};

export type ClientPongMessage = {
  type: 'pong';
};

export type ClientMessage =
  | ClientAuthMessage
  | ClientListMachinesMessage
  | ClientListSessionsMessage
  | ClientAttachMessage
  | ClientDetachMessage
  | ClientCreateSessionMessage
  | ClientDataMessage
  | ClientResizeMessage
  | ClientPongMessage;

// Relay → Client messages
export type RelayAuthenticatedMessage = {
  type: 'authenticated';
  user: UserInfo;
};

export type RelayMachinesMessage = {
  type: 'machines';
  machines: MachineInfo[];
};

export type RelaySessionsMessage = {
  type: 'sessions';
  machineId: MachineId;
  sessions: SessionInfo[];
};

export type RelayAttachedMessage = {
  type: 'attached';
  sessionId: SessionId;
};

export type RelayDetachedMessage = {
  type: 'detached';
  sessionId: SessionId;
};

export type RelayClientDataMessage = {
  type: 'data';
  sessionId: SessionId;
  data: string; // base64 encoded
};

export type RelayMachineOnlineMessage = {
  type: 'machine_online';
  machine: MachineInfo;
};

export type RelayMachineOfflineMessage = {
  type: 'machine_offline';
  machineId: MachineId;
};

export type RelaySessionStartedMessage = {
  type: 'session_started';
  machineId: MachineId;
  session: SessionInfo;
};

export type RelaySessionEndedMessage = {
  type: 'session_ended';
  machineId: MachineId;
  sessionId: SessionId;
};

export type RelayErrorMessage = {
  type: 'error';
  code: string;
  message: string;
};

export type RelayClientPingMessage = {
  type: 'ping';
};

export type RelayToClientMessage =
  | RelayAuthenticatedMessage
  | RelayMachinesMessage
  | RelaySessionsMessage
  | RelayAttachedMessage
  | RelayDetachedMessage
  | RelayClientDataMessage
  | RelayMachineOnlineMessage
  | RelayMachineOfflineMessage
  | RelaySessionStartedMessage
  | RelaySessionEndedMessage
  | RelayErrorMessage
  | RelayClientPingMessage;
```

**Step 2: Update packages/protocol/src/index.ts**

```typescript
export * from './types.js';
export * from './agent-messages.js';
export * from './client-messages.js';

export const PROTOCOL_VERSION = '0.0.1';
```

**Step 3: Build and verify**

Run:
```bash
pnpm --filter @hermit/protocol build
```

Expected: Build succeeds

**Step 4: Commit**

```bash
git add packages/protocol/src
git commit -m "M1/E1.2/1.2.3: Define Client ↔ Relay message types"
```

---

## Task 8: Add Zod Schemas for Runtime Validation (E1.2/1.2.4)

**Files:**
- Create: `packages/protocol/src/schemas.ts`
- Modify: `packages/protocol/src/index.ts`

**Step 1: Create packages/protocol/src/schemas.ts**

```typescript
import { z } from 'zod';

// Shared type schemas
export const SessionInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  command: z.string(),
  createdAt: z.string(),
  attachedClients: z.number(),
});

export const MachineInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  online: z.boolean(),
  lastSeen: z.string(),
  sessionCount: z.number(),
});

export const UserInfoSchema = z.object({
  id: z.string(),
  email: z.string().email(),
});

// Agent → Relay message schemas
export const AgentMessageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('register'), machineName: z.string(), token: z.string() }),
  z.object({ type: z.literal('sessions'), sessions: z.array(SessionInfoSchema) }),
  z.object({ type: z.literal('data'), sessionId: z.string(), data: z.string() }),
  z.object({ type: z.literal('session_started'), session: SessionInfoSchema }),
  z.object({ type: z.literal('session_ended'), sessionId: z.string() }),
  z.object({ type: z.literal('pong') }),
]);

// Relay → Agent message schemas
export const RelayToAgentMessageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('registered'), success: z.boolean(), machineId: z.string().optional(), error: z.string().optional() }),
  z.object({ type: z.literal('list_sessions') }),
  z.object({ type: z.literal('start_session'), name: z.string(), command: z.string().optional() }),
  z.object({ type: z.literal('attach'), sessionId: z.string(), clientId: z.string() }),
  z.object({ type: z.literal('detach'), sessionId: z.string(), clientId: z.string() }),
  z.object({ type: z.literal('data'), sessionId: z.string(), data: z.string() }),
  z.object({ type: z.literal('resize'), sessionId: z.string(), cols: z.number(), rows: z.number() }),
  z.object({ type: z.literal('ping') }),
]);

// Client → Relay message schemas
export const ClientMessageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('auth'), token: z.string() }),
  z.object({ type: z.literal('list_machines') }),
  z.object({ type: z.literal('list_sessions'), machineId: z.string() }),
  z.object({ type: z.literal('attach'), machineId: z.string(), sessionId: z.string() }),
  z.object({ type: z.literal('detach'), sessionId: z.string() }),
  z.object({ type: z.literal('create_session'), machineId: z.string(), name: z.string(), command: z.string().optional() }),
  z.object({ type: z.literal('data'), sessionId: z.string(), data: z.string() }),
  z.object({ type: z.literal('resize'), sessionId: z.string(), cols: z.number(), rows: z.number() }),
  z.object({ type: z.literal('pong') }),
]);

// Relay → Client message schemas
export const RelayToClientMessageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('authenticated'), user: UserInfoSchema }),
  z.object({ type: z.literal('machines'), machines: z.array(MachineInfoSchema) }),
  z.object({ type: z.literal('sessions'), machineId: z.string(), sessions: z.array(SessionInfoSchema) }),
  z.object({ type: z.literal('attached'), sessionId: z.string() }),
  z.object({ type: z.literal('detached'), sessionId: z.string() }),
  z.object({ type: z.literal('data'), sessionId: z.string(), data: z.string() }),
  z.object({ type: z.literal('machine_online'), machine: MachineInfoSchema }),
  z.object({ type: z.literal('machine_offline'), machineId: z.string() }),
  z.object({ type: z.literal('session_started'), machineId: z.string(), session: SessionInfoSchema }),
  z.object({ type: z.literal('session_ended'), machineId: z.string(), sessionId: z.string() }),
  z.object({ type: z.literal('error'), code: z.string(), message: z.string() }),
  z.object({ type: z.literal('ping') }),
]);

// Parse helpers
export const parseAgentMessage = (data: unknown) => AgentMessageSchema.parse(data);
export const parseRelayToAgentMessage = (data: unknown) => RelayToAgentMessageSchema.parse(data);
export const parseClientMessage = (data: unknown) => ClientMessageSchema.parse(data);
export const parseRelayToClientMessage = (data: unknown) => RelayToClientMessageSchema.parse(data);

// Safe parse helpers (return result instead of throwing)
export const safeParseAgentMessage = (data: unknown) => AgentMessageSchema.safeParse(data);
export const safeParseRelayToAgentMessage = (data: unknown) => RelayToAgentMessageSchema.safeParse(data);
export const safeParseClientMessage = (data: unknown) => ClientMessageSchema.safeParse(data);
export const safeParseRelayToClientMessage = (data: unknown) => RelayToClientMessageSchema.safeParse(data);
```

**Step 2: Update packages/protocol/src/index.ts**

```typescript
export * from './types.js';
export * from './agent-messages.js';
export * from './client-messages.js';
export * from './schemas.js';

export const PROTOCOL_VERSION = '0.0.1';
```

**Step 3: Build and verify**

Run:
```bash
pnpm --filter @hermit/protocol build
```

Expected: Build succeeds

**Step 4: Commit**

```bash
git add packages/protocol/src
git commit -m "M1/E1.2/1.2.4: Add Zod schemas for runtime validation"
```

---

## Task 9: Add Protocol Tests (E1.2/1.2.5)

**Files:**
- Create: `packages/protocol/src/schemas.test.ts`

**Step 1: Write the tests**

Create `packages/protocol/src/schemas.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';

import {
  safeParseAgentMessage,
  safeParseClientMessage,
  safeParseRelayToAgentMessage,
  safeParseRelayToClientMessage,
} from './schemas.js';

describe('Agent message schemas', () => {
  it('parses valid register message', () => {
    const result = safeParseAgentMessage({
      type: 'register',
      machineName: 'workstation',
      token: 'hmt_abc123',
    });
    expect(result.success).toBe(true);
  });

  it('parses valid sessions message', () => {
    const result = safeParseAgentMessage({
      type: 'sessions',
      sessions: [
        {
          id: 'session-1',
          name: 'claude',
          command: 'claude',
          createdAt: '2025-01-24T00:00:00Z',
          attachedClients: 0,
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid message type', () => {
    const result = safeParseAgentMessage({
      type: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing required fields', () => {
    const result = safeParseAgentMessage({
      type: 'register',
      // missing machineName and token
    });
    expect(result.success).toBe(false);
  });
});

describe('Relay to agent message schemas', () => {
  it('parses valid registered message', () => {
    const result = safeParseRelayToAgentMessage({
      type: 'registered',
      success: true,
      machineId: 'machine-uuid',
    });
    expect(result.success).toBe(true);
  });

  it('parses valid ping message', () => {
    const result = safeParseRelayToAgentMessage({ type: 'ping' });
    expect(result.success).toBe(true);
  });
});

describe('Client message schemas', () => {
  it('parses valid auth message', () => {
    const result = safeParseClientMessage({
      type: 'auth',
      token: 'jwt.token.here',
    });
    expect(result.success).toBe(true);
  });

  it('parses valid attach message', () => {
    const result = safeParseClientMessage({
      type: 'attach',
      machineId: 'machine-1',
      sessionId: 'session-1',
    });
    expect(result.success).toBe(true);
  });
});

describe('Relay to client message schemas', () => {
  it('parses valid authenticated message', () => {
    const result = safeParseRelayToClientMessage({
      type: 'authenticated',
      user: {
        id: 'user-uuid',
        email: 'test@example.com',
      },
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email in user', () => {
    const result = safeParseRelayToClientMessage({
      type: 'authenticated',
      user: {
        id: 'user-uuid',
        email: 'not-an-email',
      },
    });
    expect(result.success).toBe(false);
  });

  it('parses valid machines message', () => {
    const result = safeParseRelayToClientMessage({
      type: 'machines',
      machines: [
        {
          id: 'machine-1',
          name: 'workstation',
          online: true,
          lastSeen: '2025-01-24T00:00:00Z',
          sessionCount: 2,
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('parses valid error message', () => {
    const result = safeParseRelayToClientMessage({
      type: 'error',
      code: 'UNAUTHORIZED',
      message: 'Invalid token',
    });
    expect(result.success).toBe(true);
  });
});
```

**Step 2: Run tests**

Run:
```bash
pnpm --filter @hermit/protocol test
```

Expected: All tests pass

**Step 3: Commit**

```bash
git add packages/protocol/src/schemas.test.ts
git commit -m "M1/E1.2/1.2.5: Add protocol schema tests"
```

---

## Checkpoint: E1.1 + E1.2 Complete

At this point:
- Monorepo is scaffolded with pnpm + turbo
- Root configs are in place
- Docker compose has postgres
- @hermit/protocol package has all types, schemas, and tests

Run full check:
```bash
pnpm install
pnpm build
pnpm test
pnpm lint
```

All should pass. The plan continues with E1.3 (Relay), E1.4 (Agent), and E1.5 (Web) in subsequent tasks.

---

## Next: E1.3 Relay Foundation

Tasks 10-19 will implement the relay server. Continue with the executing-plans skill.
