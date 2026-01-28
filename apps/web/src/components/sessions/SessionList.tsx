'use client';

import type { SessionInfo } from '@hermit/protocol/types.js';

import { css } from '@styled-system/css';

import { SessionCard } from './SessionCard';

type Props = {
  sessions: SessionInfo[];
  machineId: string;
  loading?: boolean;
};

export const SessionList = ({ sessions, machineId, loading = false }: Props) => {
  if (loading) {
    return (
      <div className={css({ color: 'muted', textAlign: 'center', py: '8' })}>
        Loading sessions...
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div
        className={css({
          textAlign: 'center',
          py: '12',
          px: '4',
          bg: 'surface',
          border: '1px solid',
          borderColor: 'border',
          borderRadius: 'md',
        })}
      >
        <p className={css({ color: 'text', fontSize: 'lg', mb: '2' })}>No sessions</p>
        <p className={css({ color: 'muted', fontSize: 'sm' })}>
          This machine has no active tmux sessions
        </p>
      </div>
    );
  }

  return (
    <div
      className={css({
        display: 'grid',
        gap: '4',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      })}
    >
      {sessions.map((session) => (
        <SessionCard key={session.id} session={session} machineId={machineId} />
      ))}
    </div>
  );
};
