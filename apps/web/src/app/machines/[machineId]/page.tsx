'use client';

import { css } from '@styled-system/css';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { SessionList } from '../../../components/sessions/SessionList';
import { useWebSocket } from '../../../hooks/useWebSocket';
import { useAuthStore } from '../../../stores/auth';
import { useRelayStore } from '../../../stores/relay';

const MachineSessionsPage = () => {
  const router = useRouter();
  const { machineId } = useParams<{ machineId: string }>();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const machines = useRelayStore((s) => s.machines);
  const sessions = useRelayStore((s) => s.sessions[machineId] || []);
  const { connected, send, onMessage } = useWebSocket();
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [creating, setCreating] = useState(false);

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

  // Listen for session_started to navigate to new session
  useEffect(() => {
    if (!connected || !creating) return;

    const unsubscribe = onMessage((msg) => {
      if (msg.type === 'session_started' && msg.machineId === machineId) {
        setCreating(false);
        setShowCreateForm(false);
        setNewSessionName('');
        router.push(`/machines/${machineId}/${msg.session.id}`);
      } else if (msg.type === 'error' && creating) {
        setCreating(false);
      }
    });

    return () => unsubscribe();
  }, [connected, creating, machineId, onMessage, router]);

  const handleCreateSession = useCallback(() => {
    if (!newSessionName.trim() || !connected || creating) return;

    setCreating(true);
    send({ type: 'create_session', machineId, name: newSessionName.trim() });
  }, [connected, creating, machineId, newSessionName, send]);

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
        <div className={css({ mt: '4', display: 'flex', alignItems: 'center', gap: '4' })}>
          <p className={css({ color: 'muted', fontSize: 'sm' })}>
            {sessions.length} {sessions.length === 1 ? 'session' : 'sessions'}
          </p>
          {machine?.online && (
            <button
              type="button"
              onClick={() => setShowCreateForm(true)}
              className={css({
                px: '3',
                py: '1.5',
                fontSize: 'sm',
                fontWeight: 'medium',
                color: 'background',
                bg: 'primary',
                borderRadius: 'md',
                cursor: 'pointer',
                transition: 'opacity 0.2s',
                _hover: { opacity: 0.9 },
                _disabled: { opacity: 0.5, cursor: 'not-allowed' },
              })}
              disabled={!connected}
            >
              New Session
            </button>
          )}
        </div>
      </header>

      {showCreateForm && (
        <div
          className={css({
            mb: '6',
            p: '4',
            bg: 'surface',
            borderRadius: 'lg',
            border: '1px solid',
            borderColor: 'border',
          })}
        >
          <h2 className={css({ fontSize: 'lg', fontWeight: 'medium', color: 'text', mb: '3' })}>
            Create New Session
          </h2>
          <div className={css({ display: 'flex', gap: '3' })}>
            <input
              type="text"
              value={newSessionName}
              onChange={(e) => setNewSessionName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateSession();
                if (e.key === 'Escape') setShowCreateForm(false);
              }}
              placeholder="Session name"
              className={css({
                flex: 1,
                px: '3',
                py: '2',
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
            <button
              type="button"
              onClick={handleCreateSession}
              disabled={!newSessionName.trim() || creating}
              className={css({
                px: '4',
                py: '2',
                fontSize: 'sm',
                fontWeight: 'medium',
                color: 'background',
                bg: 'primary',
                borderRadius: 'md',
                cursor: 'pointer',
                transition: 'opacity 0.2s',
                _hover: { opacity: 0.9 },
                _disabled: { opacity: 0.5, cursor: 'not-allowed' },
              })}
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreateForm(false);
                setNewSessionName('');
              }}
              className={css({
                px: '4',
                py: '2',
                fontSize: 'sm',
                fontWeight: 'medium',
                color: 'muted',
                bg: 'transparent',
                borderRadius: 'md',
                cursor: 'pointer',
                transition: 'color 0.2s',
                _hover: { color: 'text' },
              })}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <SessionList sessions={sessions} machineId={machineId} loading={loading && !connected} />
    </div>
  );
};

export default MachineSessionsPage;
