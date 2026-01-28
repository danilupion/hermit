'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { SessionList } from '../../../components/sessions/SessionList';
import { useWebSocket } from '../../../hooks/useWebSocket';
import { useAuthStore } from '../../../stores/auth';
import { useRelayStore } from '../../../stores/relay';
import { css } from '../../../styled-system/css';

const MachineSessionsPage = () => {
  const router = useRouter();
  const { machineId } = useParams<{ machineId: string }>();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const machines = useRelayStore((s) => s.machines);
  const sessions = useRelayStore((s) => s.sessions[machineId] || []);
  const { connected, send } = useWebSocket();
  const [loading, setLoading] = useState(true);

  const machine = machines.find((m) => m.id === machineId);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (connected && machineId) {
      send({ type: 'list_sessions', machineId });
      setLoading(false);
    }
  }, [connected, machineId, send]);

  if (!isAuthenticated()) {
    return null;
  }

  return (
    <div className={css({ minH: '100vh', p: '6' })}>
      <header className={css({ mb: '8' })}>
        <nav className={css({ mb: '4' })}>
          <Link
            href="/machines"
            className={css({
              color: 'muted',
              fontSize: 'sm',
              _hover: { color: 'primary' },
              transition: 'color 0.2s',
            })}
          >
            &larr; Back to machines
          </Link>
        </nav>
        <div className={css({ display: 'flex', alignItems: 'center', gap: '4' })}>
          <h1 className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'text' })}>
            {machine?.name || 'Unknown Machine'}
          </h1>
          {machine && (
            <span
              className={css({
                px: '2',
                py: '0.5',
                fontSize: 'xs',
                fontWeight: 'medium',
                borderRadius: 'full',
              })}
              style={{
                backgroundColor: machine.online
                  ? 'rgba(166, 227, 161, 0.2)'
                  : 'rgba(108, 112, 134, 0.2)',
                color: machine.online ? '#a6e3a1' : '#6c7086',
              }}
            >
              {machine.online ? 'Online' : 'Offline'}
            </span>
          )}
        </div>
        <p className={css({ mt: '2', color: 'muted', fontSize: 'sm' })}>
          {sessions.length} {sessions.length === 1 ? 'session' : 'sessions'}
        </p>
      </header>

      <SessionList sessions={sessions} machineId={machineId} loading={loading && !connected} />
    </div>
  );
};

export default MachineSessionsPage;
