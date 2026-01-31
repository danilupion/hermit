'use client';

import { css } from '@styled-system/css';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Terminal, type TerminalRef } from '../../../../components/terminal/Terminal';
import { useWebSocket } from '../../../../hooks/useWebSocket';
import { useAuthStore } from '../../../../stores/auth';
import { useRelayStore } from '../../../../stores/relay';

const TerminalPage = () => {
  const router = useRouter();
  const { machineId, sessionId } = useParams<{ machineId: string; sessionId: string }>();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const machines = useRelayStore((s) => s.machines);
  const sessions = useRelayStore((s) => s.sessions[machineId] || []);
  const { connected, send, onMessage } = useWebSocket();
  const terminalRef = useRef<TerminalRef>(null);
  const [attached, setAttached] = useState(false);

  const machine = machines.find((m) => m.id === machineId);
  const session = sessions.find((s) => s.id === sessionId);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  // Attach to session and handle messages
  useEffect(() => {
    if (!connected || !machineId || !sessionId) return;

    // Attach to session
    send({ type: 'attach', machineId, sessionId });

    // Listen for messages
    const unsubscribe = onMessage((msg) => {
      switch (msg.type) {
        case 'attached':
          if (msg.sessionId === sessionId) {
            setAttached(true);
          }
          break;
        case 'data':
          if (msg.sessionId === sessionId) {
            // Decode base64 data and write to terminal
            try {
              const decoded = atob(msg.data);
              terminalRef.current?.write(decoded);
            } catch {
              // Ignore decoding errors
            }
          }
          break;
        case 'detached':
          if (msg.sessionId === sessionId) {
            setAttached(false);
          }
          break;
      }
    });

    return () => {
      unsubscribe();
      send({ type: 'detach', sessionId });
      setAttached(false);
    };
  }, [connected, machineId, sessionId, send, onMessage]);

  // Track latest terminal size for sending after attachment
  const terminalSizeRef = useRef<{ cols: number; rows: number } | null>(null);

  const handleResize = useCallback(
    (cols: number, rows: number) => {
      terminalSizeRef.current = { cols, rows };
      if (connected && attached) {
        send({ type: 'resize', sessionId, cols, rows });
      }
    },
    [connected, attached, sessionId, send],
  );

  // Send terminal size when attachment completes
  useEffect(() => {
    if (connected && attached && terminalSizeRef.current) {
      const { cols, rows } = terminalSizeRef.current;
      send({ type: 'resize', sessionId, cols, rows });
    }
  }, [connected, attached, sessionId, send]);

  const handleData = useCallback(
    (data: string) => {
      if (connected && attached) {
        // Encode data as base64 and send to relay
        const base64 = btoa(data);
        send({ type: 'data', sessionId, data: base64 });
      }
    },
    [connected, attached, sessionId, send],
  );

  if (!isAuthenticated()) {
    return null;
  }

  return (
    <div className={css({ h: '100vh', display: 'flex', flexDir: 'column', bg: 'background' })}>
      <header
        className={css({
          flexShrink: 0,
          p: '4',
          bg: 'surface',
          borderBottom: '1px solid',
          borderColor: 'border',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        })}
      >
        <div className={css({ display: 'flex', alignItems: 'center', gap: '4' })}>
          <Link
            href={`/machines/${machineId}`}
            className={css({
              color: 'muted',
              fontSize: 'sm',
              _hover: { color: 'primary' },
              transition: 'color 0.2s',
            })}
          >
            &larr; Back
          </Link>
          <div className={css({ h: '4', w: '1px', bg: 'border' })} />
          <span className={css({ color: 'text', fontWeight: 'medium' })}>
            {machine?.name || 'Unknown'}
          </span>
          <span className={css({ color: 'muted' })}>/</span>
          <span className={css({ color: 'text', fontFamily: 'mono' })}>
            {session?.name || sessionId}
          </span>
        </div>
        <div className={css({ display: 'flex', alignItems: 'center', gap: '3' })}>
          <span
            className={css({
              px: '2',
              py: '0.5',
              fontSize: 'xs',
              fontWeight: 'medium',
              borderRadius: 'full',
            })}
            style={{
              backgroundColor: attached ? 'rgba(166, 227, 161, 0.2)' : 'rgba(108, 112, 134, 0.2)',
              color: attached ? '#a6e3a1' : '#6c7086',
            }}
          >
            {attached ? 'Connected' : 'Connecting...'}
          </span>
          <span className={css({ color: 'muted', fontSize: 'xs' })}>
            {attached ? 'Interactive' : ''}
          </span>
        </div>
      </header>

      <main className={css({ flex: 1, p: '4', overflow: 'hidden' })}>
        <Terminal ref={terminalRef} onData={handleData} onResize={handleResize} />
      </main>
    </div>
  );
};

export default TerminalPage;
