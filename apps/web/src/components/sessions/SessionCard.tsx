'use client';

import type { SessionInfo } from '@hermit/protocol/types.js';

import { css } from '@styled-system/css';
import Link from 'next/link';

type Props = {
  session: SessionInfo;
  machineId: string;
};

export const SessionCard = ({ session, machineId }: Props) => (
  <Link
    href={`/machines/${machineId}/${session.id}`}
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
    <div
      className={css({ display: 'flex', alignItems: 'center', justifyContent: 'space-between' })}
    >
      <span className={css({ fontWeight: 'semibold', color: 'text', fontFamily: 'mono' })}>
        {session.name}
      </span>
      {session.attachedClients > 0 && (
        <span
          className={css({
            px: '2',
            py: '0.5',
            fontSize: 'xs',
            fontWeight: 'medium',
            borderRadius: 'full',
            bg: 'primary/20',
            color: 'primary',
          })}
        >
          {session.attachedClients} viewing
        </span>
      )}
    </div>
    <div className={css({ mt: '2', display: 'flex', flexDir: 'column', gap: '1' })}>
      <span className={css({ color: 'muted', fontSize: 'sm', fontFamily: 'mono' })}>
        $ {session.command}
      </span>
      <span className={css({ color: 'muted', fontSize: 'xs' })}>
        Created: {new Date(session.createdAt).toLocaleString()}
      </span>
    </div>
  </Link>
);
