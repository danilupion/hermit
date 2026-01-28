'use client';

import type { MachineInfo } from '@hermit/protocol/types.js';

import { css } from '../../styled-system/css';
import { MachineCard } from './MachineCard';

type Props = {
  machines: MachineInfo[];
  loading?: boolean;
};

export const MachineList = ({ machines, loading = false }: Props) => {
  if (loading) {
    return (
      <div className={css({ color: 'muted', textAlign: 'center', py: '8' })}>
        Loading machines...
      </div>
    );
  }

  if (machines.length === 0) {
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
        <p className={css({ color: 'text', fontSize: 'lg', mb: '2' })}>No machines connected</p>
        <p className={css({ color: 'muted', fontSize: 'sm' })}>
          Run{' '}
          <code
            className={css({
              fontFamily: 'mono',
              bg: 'surface.hover',
              px: '1.5',
              py: '0.5',
              borderRadius: 'sm',
            })}
          >
            hermit connect
          </code>{' '}
          on a machine to get started
        </p>
      </div>
    );
  }

  // Sort machines: online first, then by name
  const sortedMachines = [...machines].sort((a, b) => {
    if (a.online !== b.online) return a.online ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div
      className={css({
        display: 'grid',
        gap: '4',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      })}
    >
      {sortedMachines.map((machine) => (
        <MachineCard key={machine.id} machine={machine} />
      ))}
    </div>
  );
};
