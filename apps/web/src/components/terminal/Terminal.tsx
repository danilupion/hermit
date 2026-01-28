'use client';

import '@xterm/xterm/css/xterm.css';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

import { css } from '../../styled-system/css';

type Props = {
  onData?: (data: string) => void;
  onResize?: (cols: number, rows: number) => void;
};

export type TerminalRef = {
  write: (data: string) => void;
  clear: () => void;
};

export const Terminal = forwardRef<TerminalRef, Props>(({ onData, onResize }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<import('@xterm/xterm').Terminal | null>(null);
  const fitAddonRef = useRef<import('@xterm/addon-fit').FitAddon | null>(null);

  useImperativeHandle(ref, () => ({
    write: (data: string) => {
      termRef.current?.write(data);
    },
    clear: () => {
      termRef.current?.clear();
    },
  }));

  useEffect(() => {
    if (!containerRef.current) return;

    // Dynamically import xterm to avoid SSR issues
    const initTerminal = async () => {
      const { Terminal: XTerm } = await import('@xterm/xterm');
      const { FitAddon } = await import('@xterm/addon-fit');

      const term = new XTerm({
        theme: {
          background: '#1e1e2e',
          foreground: '#cdd6f4',
          cursor: '#f5e0dc',
          cursorAccent: '#1e1e2e',
          selectionBackground: '#45475a',
          black: '#45475a',
          red: '#f38ba8',
          green: '#a6e3a1',
          yellow: '#f9e2af',
          blue: '#89b4fa',
          magenta: '#f5c2e7',
          cyan: '#94e2d5',
          white: '#bac2de',
          brightBlack: '#585b70',
          brightRed: '#f38ba8',
          brightGreen: '#a6e3a1',
          brightYellow: '#f9e2af',
          brightBlue: '#89b4fa',
          brightMagenta: '#f5c2e7',
          brightCyan: '#94e2d5',
          brightWhite: '#a6adc8',
        },
        fontFamily: 'JetBrains Mono, Menlo, Monaco, Consolas, monospace',
        fontSize: 14,
        lineHeight: 1.2,
        cursorBlink: true,
        cursorStyle: 'block',
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);

      if (containerRef.current) {
        term.open(containerRef.current);
        fitAddon.fit();
      }

      termRef.current = term;
      fitAddonRef.current = fitAddon;

      if (onData) {
        term.onData(onData);
      }

      // Initial size callback
      onResize?.(term.cols, term.rows);

      // Handle resize
      const resizeObserver = new ResizeObserver(() => {
        if (fitAddonRef.current && termRef.current) {
          fitAddonRef.current.fit();
          onResize?.(termRef.current.cols, termRef.current.rows);
        }
      });

      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }

      return () => {
        resizeObserver.disconnect();
        term.dispose();
      };
    };

    let cleanup: (() => void) | undefined;
    void initTerminal().then((fn) => {
      cleanup = fn;
    });

    return () => {
      cleanup?.();
      termRef.current = null;
      fitAddonRef.current = null;
    };
  }, [onData, onResize]);

  return (
    <div
      ref={containerRef}
      className={css({
        w: 'full',
        h: 'full',
        minH: '400px',
        bg: 'surface',
        borderRadius: 'md',
        overflow: 'hidden',
        '& .xterm': {
          padding: '8px',
        },
      })}
    />
  );
});

Terminal.displayName = 'Terminal';
