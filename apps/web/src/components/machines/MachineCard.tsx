'use client';

import type { MachineInfo } from '@hermit/protocol/types.js';

import Link from 'next/link';

import { css } from '../../styled-system/css';

type Props = {
  machine: MachineInfo;
};

export const MachineCard = ({ machine }: Props) => (
  <Link
    href={`/machines/${machine.id}`}
    className={css({
      display: 'block',
      p: '4',
      bg: 'surface',
      border: '1px solid',
      borderColor: 'border',
      borderRadius: 'md',
      transition: 'all 0.2s',
      _hover: {
        borderColor: 'primary',
        bg: 'surface.hover',
      },
    })}
  >
    <div className={css({ display: 'flex', alignItems: 'center', gap: '3' })}>
      <span
        className={css({
          w: '2.5',
          h: '2.5',
          borderRadius: 'full',
          flexShrink: 0,
        })}
        style={{
          backgroundColor: machine.online ? '#a6e3a1' : '#6c7086',
        }}
        title={machine.online ? 'Online' : 'Offline'}
      />
      <span className={css({ fontWeight: 'semibold', color: 'text' })}>{machine.name}</span>
    </div>
    <div
      className={css({
        mt: '3',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      })}
    >
      <span className={css({ color: 'muted', fontSize: 'sm' })}>
        {machine.sessionCount} {machine.sessionCount === 1 ? 'session' : 'sessions'}
      </span>
      {!machine.online && (
        <span className={css({ color: 'muted', fontSize: 'xs' })}>
          Last seen: {new Date(machine.lastSeen).toLocaleDateString()}
        </span>
      )}
    </div>
  </Link>
);
