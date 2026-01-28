import { beforeEach, describe, expect, it } from 'vitest';

import { useRelayStore } from './relay';

describe('useRelayStore', () => {
  beforeEach(() => {
    useRelayStore.getState().reset();
  });

  it('should have initial state', () => {
    const state = useRelayStore.getState();
    expect(state.connected).toBe(false);
    expect(state.machines).toEqual([]);
    expect(state.sessions).toEqual({});
  });

  it('should set connected state', () => {
    const { setConnected } = useRelayStore.getState();

    setConnected(true);
    expect(useRelayStore.getState().connected).toBe(true);

    setConnected(false);
    expect(useRelayStore.getState().connected).toBe(false);
  });

  it('should set machines', () => {
    const { setMachines } = useRelayStore.getState();
    const machines = [
      {
        id: 'machine-1',
        name: 'dev-machine',
        online: true,
        lastSeen: '2025-01-27',
        sessionCount: 2,
      },
      {
        id: 'machine-2',
        name: 'prod-machine',
        online: false,
        lastSeen: '2025-01-26',
        sessionCount: 0,
      },
    ];

    setMachines(machines);
    expect(useRelayStore.getState().machines).toEqual(machines);
  });

  it('should set sessions for a machine', () => {
    const { setSessions } = useRelayStore.getState();
    const sessions = [
      {
        id: 'session-1',
        name: 'main',
        command: 'bash',
        createdAt: '2025-01-27',
        attachedClients: 1,
      },
      {
        id: 'session-2',
        name: 'test',
        command: 'zsh',
        createdAt: '2025-01-27',
        attachedClients: 0,
      },
    ];

    setSessions('machine-1', sessions);
    expect(useRelayStore.getState().sessions['machine-1']).toEqual(sessions);
  });

  it('should keep sessions for other machines when setting sessions', () => {
    const { setSessions } = useRelayStore.getState();
    const sessions1 = [
      {
        id: 'session-1',
        name: 'main',
        command: 'bash',
        createdAt: '2025-01-27',
        attachedClients: 1,
      },
    ];
    const sessions2 = [
      {
        id: 'session-2',
        name: 'test',
        command: 'zsh',
        createdAt: '2025-01-27',
        attachedClients: 0,
      },
    ];

    setSessions('machine-1', sessions1);
    setSessions('machine-2', sessions2);

    const state = useRelayStore.getState();
    expect(state.sessions['machine-1']).toEqual(sessions1);
    expect(state.sessions['machine-2']).toEqual(sessions2);
  });

  it('should clear sessions for a machine', () => {
    const { setSessions, clearSessions } = useRelayStore.getState();
    const sessions = [
      {
        id: 'session-1',
        name: 'main',
        command: 'bash',
        createdAt: '2025-01-27',
        attachedClients: 1,
      },
    ];

    setSessions('machine-1', sessions);
    setSessions('machine-2', sessions);
    expect(useRelayStore.getState().sessions['machine-1']).toEqual(sessions);

    clearSessions('machine-1');
    expect(useRelayStore.getState().sessions['machine-1']).toBeUndefined();
    expect(useRelayStore.getState().sessions['machine-2']).toEqual(sessions);
  });

  it('should reset all state', () => {
    const { setConnected, setMachines, setSessions, reset } = useRelayStore.getState();

    setConnected(true);
    setMachines([
      {
        id: 'machine-1',
        name: 'dev',
        online: true,
        lastSeen: '2025-01-27',
        sessionCount: 1,
      },
    ]);
    setSessions('machine-1', [
      {
        id: 'session-1',
        name: 'main',
        command: 'bash',
        createdAt: '2025-01-27',
        attachedClients: 1,
      },
    ]);

    reset();

    const state = useRelayStore.getState();
    expect(state.connected).toBe(false);
    expect(state.machines).toEqual([]);
    expect(state.sessions).toEqual({});
  });
});
