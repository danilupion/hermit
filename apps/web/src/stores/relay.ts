import type { MachineInfo, SessionInfo } from '@hermit/protocol/types.js';

import { create } from 'zustand';

type RelayState = {
  connected: boolean;
  machines: MachineInfo[];
  sessions: Record<string, SessionInfo[]>;
  setConnected: (connected: boolean) => void;
  setMachines: (machines: MachineInfo[]) => void;
  setSessions: (machineId: string, sessions: SessionInfo[]) => void;
  addSession: (machineId: string, session: SessionInfo) => void;
  clearSessions: (machineId: string) => void;
  reset: () => void;
};

export const useRelayStore = create<RelayState>((set) => ({
  connected: false,
  machines: [],
  sessions: {},
  setConnected: (connected) => set({ connected }),
  setMachines: (machines) => set({ machines }),
  setSessions: (machineId, sessions) =>
    set((state) => ({
      sessions: { ...state.sessions, [machineId]: sessions },
    })),
  addSession: (machineId, session) =>
    set((state) => ({
      sessions: {
        ...state.sessions,
        [machineId]: [...(state.sessions[machineId] || []), session],
      },
    })),
  clearSessions: (machineId) =>
    set((state) => {
      const { [machineId]: _, ...rest } = state.sessions;
      return { sessions: rest };
    }),
  reset: () => set({ connected: false, machines: [], sessions: {} }),
}));
