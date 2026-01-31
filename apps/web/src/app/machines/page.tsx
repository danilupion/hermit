'use client';

import { css } from '@styled-system/css';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { MachineList } from '../../components/machines/MachineList';
import { useWebSocket } from '../../hooks/useWebSocket';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/auth';
import { useRelayStore } from '../../stores/relay';

const MachinesPage = () => {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const machines = useRelayStore((s) => s.machines);
  const { connected, send } = useWebSocket();
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Register machine dialog state
  const [showRegister, setShowRegister] = useState(false);
  const [machineName, setMachineName] = useState('');
  const [registering, setRegistering] = useState(false);
  const [machineToken, setMachineToken] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);

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

  const handleRegister = useCallback(async () => {
    if (!machineName.trim() || !token || registering) return;

    setRegistering(true);
    setRegisterError(null);

    try {
      const result = await api.registerMachine(token, machineName.trim());
      setMachineToken(result.token);
      // Refresh machine list
      send({ type: 'list_machines' });
    } catch (err) {
      setRegisterError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setRegistering(false);
    }
  }, [machineName, token, registering, send]);

  const closeRegisterDialog = () => {
    setShowRegister(false);
    setMachineName('');
    setMachineToken(null);
    setRegisterError(null);
  };

  // Wait for mount to avoid hydration mismatch (localStorage not available on server)
  if (!mounted) {
    return null;
  }

  if (!isAuthenticated()) {
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
          <button
            onClick={() => setShowRegister(true)}
            className={css({
              px: '3',
              py: '1.5',
              bg: 'primary',
              color: 'background',
              fontSize: 'sm',
              fontWeight: 'medium',
              borderRadius: 'md',
              cursor: 'pointer',
              transition: 'opacity 0.2s',
              _hover: { opacity: 0.9 },
            })}
          >
            Register Machine
          </button>
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

      {/* Register Machine Dialog */}
      {showRegister && (
        <div
          className={css({
            position: 'fixed',
            inset: 0,
            bg: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          })}
          onClick={closeRegisterDialog}
        >
          <div
            className={css({
              bg: 'surface',
              borderRadius: 'lg',
              p: '6',
              w: 'full',
              maxW: '500px',
              mx: '4',
              border: '1px solid',
              borderColor: 'border',
            })}
            onClick={(e) => e.stopPropagation()}
          >
            {machineToken ? (
              <>
                <h2 className={css({ fontSize: 'lg', fontWeight: 'bold', color: 'text', mb: '4' })}>
                  Machine Registered
                </h2>
                <p className={css({ color: 'muted', fontSize: 'sm', mb: '4' })}>
                  Copy this token and use it when running <code>hermit init</code>:
                </p>
                <div
                  className={css({
                    bg: 'background',
                    p: '3',
                    borderRadius: 'md',
                    fontFamily: 'mono',
                    fontSize: 'sm',
                    color: 'text',
                    wordBreak: 'break-all',
                    mb: '4',
                  })}
                >
                  {machineToken}
                </div>
                <div
                  className={css({
                    bg: 'background',
                    p: '4',
                    borderRadius: 'md',
                    fontSize: 'sm',
                    color: 'muted',
                    mb: '4',
                  })}
                >
                  <p className={css({ fontWeight: 'medium', color: 'text', mb: '2' })}>
                    Agent setup:
                  </p>
                  <code className={css({ display: 'block', mb: '1' })}>
                    pnpm --filter @hermit/agent cli -- init
                  </code>
                  <p className={css({ mt: '2' })}>
                    Relay URL: <code>ws://localhost:3550/ws/agent</code>
                  </p>
                </div>
                <button
                  onClick={closeRegisterDialog}
                  className={css({
                    w: 'full',
                    px: '4',
                    py: '2',
                    bg: 'primary',
                    color: 'background',
                    fontSize: 'sm',
                    fontWeight: 'medium',
                    borderRadius: 'md',
                    cursor: 'pointer',
                    transition: 'opacity 0.2s',
                    _hover: { opacity: 0.9 },
                  })}
                >
                  Done
                </button>
              </>
            ) : (
              <>
                <h2 className={css({ fontSize: 'lg', fontWeight: 'bold', color: 'text', mb: '4' })}>
                  Register Machine
                </h2>
                <p className={css({ color: 'muted', fontSize: 'sm', mb: '4' })}>
                  Register a new machine to get a token for the agent.
                </p>
                {registerError && (
                  <p className={css({ color: 'red.400', fontSize: 'sm', mb: '4' })}>
                    {registerError}
                  </p>
                )}
                <input
                  type="text"
                  value={machineName}
                  onChange={(e) => setMachineName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRegister();
                    if (e.key === 'Escape') closeRegisterDialog();
                  }}
                  placeholder="Machine name (e.g., my-laptop)"
                  autoFocus
                  className={css({
                    w: 'full',
                    px: '3',
                    py: '2',
                    mb: '4',
                    fontSize: 'sm',
                    bg: 'background',
                    color: 'text',
                    border: '1px solid',
                    borderColor: 'border',
                    borderRadius: 'md',
                    outline: 'none',
                    _focus: { borderColor: 'primary' },
                  })}
                />
                <div className={css({ display: 'flex', gap: '3' })}>
                  <button
                    onClick={handleRegister}
                    disabled={!machineName.trim() || registering}
                    className={css({
                      flex: 1,
                      px: '4',
                      py: '2',
                      bg: 'primary',
                      color: 'background',
                      fontSize: 'sm',
                      fontWeight: 'medium',
                      borderRadius: 'md',
                      cursor: 'pointer',
                      transition: 'opacity 0.2s',
                      _hover: { opacity: 0.9 },
                      _disabled: { opacity: 0.5, cursor: 'not-allowed' },
                    })}
                  >
                    {registering ? 'Registering...' : 'Register'}
                  </button>
                  <button
                    onClick={closeRegisterDialog}
                    className={css({
                      px: '4',
                      py: '2',
                      bg: 'transparent',
                      color: 'muted',
                      fontSize: 'sm',
                      borderRadius: 'md',
                      cursor: 'pointer',
                      transition: 'color 0.2s',
                      _hover: { color: 'text' },
                    })}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <MachineList machines={machines} loading={loading && !connected} />
    </div>
  );
};

export default MachinesPage;
