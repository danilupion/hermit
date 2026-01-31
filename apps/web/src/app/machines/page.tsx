'use client';

import { css } from '@styled-system/css';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { MachineList } from '../../components/machines/MachineList';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useAuthStore } from '../../stores/auth';
import { useRelayStore } from '../../stores/relay';

const MachinesPage = () => {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const machines = useRelayStore((s) => s.machines);
  const { connected, send } = useWebSocket();
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch - wait for client mount
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated()) {
      router.replace('/login');
    }
  }, [mounted, isAuthenticated, router]);

  useEffect(() => {
    if (connected) {
      send({ type: 'list_machines' });
      setLoading(false);
    }
  }, [connected, send]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Show nothing until mounted to prevent hydration mismatch
  if (!mounted || !isAuthenticated()) {
    return null;
  }

  return (
    <div className={css({ minH: '100vh', p: '6' })}>
      <header
        className={css({
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: '8',
        })}
      >
        <div className={css({ display: 'flex', alignItems: 'center', gap: '4' })}>
          <h1 className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'text' })}>Machines</h1>
          <span
            className={css({
              px: '2',
              py: '0.5',
              fontSize: 'xs',
              fontWeight: 'medium',
              borderRadius: 'full',
            })}
            style={{
              backgroundColor: connected ? 'rgba(166, 227, 161, 0.2)' : 'rgba(108, 112, 134, 0.2)',
              color: connected ? '#a6e3a1' : '#6c7086',
            }}
          >
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <div className={css({ display: 'flex', alignItems: 'center', gap: '4' })}>
          <span className={css({ color: 'muted', fontSize: 'sm' })}>{user?.email}</span>
          <button
            onClick={handleLogout}
            className={css({
              px: '3',
              py: '1.5',
              bg: 'surface',
              color: 'text',
              fontSize: 'sm',
              borderRadius: 'md',
              border: '1px solid',
              borderColor: 'border',
              cursor: 'pointer',
              transition: 'all 0.2s',
              _hover: { bg: 'surface.hover', borderColor: 'muted' },
            })}
          >
            Sign out
          </button>
        </div>
      </header>

      <MachineList machines={machines} loading={loading && !connected} />
    </div>
  );
};

export default MachinesPage;
