# Hermit

A self-hosted terminal relay system. Carry your terminal sessions with you anywhere.

## Overview

Hermit allows you to access terminal sessions (especially Claude Code sessions) from any device via a web interface. A local agent manages tmux sessions on your machine and connects to a relay server, which the web UI communicates with.

**Key Features:**
- Session persistence via tmux
- NAT-friendly (agent makes outbound connections only)
- Self-hosted (deploy on your own infrastructure)
- Multi-machine support
- Mobile-responsive web interface

## Architecture

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│  Your Machine   │         │     Relay       │         │    Browser      │
│                 │         │    (Server)     │         │                 │
│  ┌───────────┐  │   WSS   │  ┌───────────┐  │   WSS   │  ┌───────────┐  │
│  │   Agent   │──┼────────▶│  │   Hono    │  │◀────────┼──│  Next.js  │  │
│  └───────────┘  │         │  └───────────┘  │         │  └───────────┘  │
│       │         │         │       │         │         │                 │
│       ▼         │         │       ▼         │         │                 │
│    [tmux]       │         │  [PostgreSQL]   │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

## Development

### Prerequisites

- Node.js 24.x
- pnpm 10.x
- Bun (for agent compilation)
- Docker (for PostgreSQL)

### Setup

```bash
# Start infrastructure
docker compose -f docker/docker-compose.yml up -d

# Install dependencies
pnpm install

# Run all apps in development
pnpm dev
```

### Project Structure

```
hermit/
├── apps/
│   ├── agent/      # Bun CLI, manages tmux sessions
│   ├── relay/      # Hono server, WebSocket hub
│   └── web/        # Next.js frontend
├── packages/
│   └── protocol/   # Shared TypeScript types
├── docker/
│   └── docker-compose.yml
└── docs/
    └── plans/      # Design documents
```

## Documentation

- [Design Document](docs/plans/2025-01-24-hermit-design.md) - Architecture and technical decisions
- [CLAUDE.md](CLAUDE.md) - AI assistant context and development rules

---

# AI Development Continuation Prompt

Copy and paste the following prompt to continue development with an AI assistant:

```
You are an extremely experienced senior software architect continuing development of Hermit, a self-hosted terminal relay system.

## Context Gathering

1. Read `CLAUDE.md` for quick project context (tech stack, patterns, current state)
2. Read `docs/roadmap.md` for milestone roadmap and epic/story details
3. Read `SCRATCHPAD.md` for session handoff notes and immediate priorities
4. Check `docs/plans/` for design docs related to the current work

## Session Goal

Continue development toward the current milestone (see roadmap). Each session should:
- Work on stories from the current milestone's epics
- Ensure all tests pass (unit + integration)
- Update documentation before session ends

## Milestone Priority

Work on milestones in order: M1 → M2 → M3 → M4

Within a milestone, complete epics in order unless dependencies allow parallelization.

## Development Cycle

Execute the following cycle for each task:

### 1. PLAN

- Identify the current milestone and epic from the roadmap
- Check `docs/plans/` for existing design docs for this epic
- If no design exists and epic is non-trivial, create one first
- Select the next story to implement
- Break down into actionable steps

### 2. IMPLEMENT

- Write code following patterns in CLAUDE.md
- Use gifcept (`/Volumes/External Storage/Workspace/gifcept`) as reference for monorepo/Next.js patterns
- Use slango configs from `/Volumes/External Storage/Workspace/slango`
- Run `pnpm build` to verify compilation

### 3. TEST

- Run `pnpm test` for unit tests
- Run relevant integration tests if applicable
- Fix any failures before proceeding

### 4. DOCUMENT (End of Session)

Before ending the session, you MUST:

a) **Update SCRATCHPAD.md**:
   - Add "Session N → Session N+1" handoff notes at the TOP
   - List completed stories with milestone/epic reference
   - List files modified
   - Document test status
   - Set priorities for next session

b) **Evaluate CLAUDE.md**:
   - Update session number
   - Update feature list if new features added
   - Update milestone progress if changed
   - Add new patterns or rules discovered

c) **Update docs/roadmap.md**:
   - Mark completed stories as "Complete"
   - Update epic status if all stories done

### 5. EVALUATE CONTEXT

After documentation updates, evaluate if context window is sufficient for another cycle:

**If context is sufficient:**
- Continue to next story
- Repeat the cycle

**If context is running low:**
- Inform the user: "Context is running low. Please start a new session."
- Provide the next prompt to use (copy from this README)

## Important Rules

### Dependencies
- Always check npm for latest versions, do not rely on training data
- Pin exact versions in package.json (use "1.2.3" not "^1.2.3")

### Testing
- All packages use Vitest
- Use MSW for HTTP and WebSocket mocking
- Tests must pass before marking tasks complete

### Process
- Never skip the DOCUMENT step
- Keep commits atomic and well-documented
- Reference milestone/epic/story IDs in commit messages (e.g., "M1/E1.1/1.1.1: Initialize pnpm workspace")
- Use the working directory: `/Volumes/External Storage/Workspace/hermit`

## Current Session Priority

Check `SCRATCHPAD.md` for the "Next Session Priorities" section from the previous session.
```

## License

Apache-2.0
