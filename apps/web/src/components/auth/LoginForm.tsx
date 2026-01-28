'use client';

import { type FormEvent, useState } from 'react';

import { css } from '../../styled-system/css';

type Props = {
  onSubmit: (email: string, password: string) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
};

export const LoginForm = ({ onSubmit, isLoading = false, error }: Props) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void onSubmit(email, password);
  };

  return (
    <form onSubmit={handleSubmit} className={css({ display: 'flex', flexDir: 'column', gap: '4' })}>
      {error && (
        <div
          className={css({
            p: '3',
            bg: 'error/10',
            border: '1px solid',
            borderColor: 'error',
            borderRadius: 'md',
            color: 'error',
            fontSize: 'sm',
          })}
        >
          {error}
        </div>
      )}

      <div className={css({ display: 'flex', flexDir: 'column', gap: '1' })}>
        <label htmlFor="email" className={css({ color: 'muted', fontSize: 'sm' })}>
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
          className={css({
            p: '3',
            bg: 'surface',
            border: '1px solid',
            borderColor: 'border',
            borderRadius: 'md',
            color: 'text',
            fontSize: 'base',
            outline: 'none',
            transition: 'border-color 0.2s',
            _focus: { borderColor: 'primary' },
            _disabled: { opacity: 0.5 },
          })}
          placeholder="you@example.com"
        />
      </div>

      <div className={css({ display: 'flex', flexDir: 'column', gap: '1' })}>
        <label htmlFor="password" className={css({ color: 'muted', fontSize: 'sm' })}>
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
          minLength={8}
          className={css({
            p: '3',
            bg: 'surface',
            border: '1px solid',
            borderColor: 'border',
            borderRadius: 'md',
            color: 'text',
            fontSize: 'base',
            outline: 'none',
            transition: 'border-color 0.2s',
            _focus: { borderColor: 'primary' },
            _disabled: { opacity: 0.5 },
          })}
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className={css({
          p: '3',
          mt: '2',
          bg: 'primary',
          color: 'white',
          fontSize: 'base',
          fontWeight: 'medium',
          borderRadius: 'md',
          border: 'none',
          cursor: 'pointer',
          transition: 'background-color 0.2s',
          _hover: { bg: 'primary.hover' },
          _disabled: { opacity: 0.5, cursor: 'not-allowed' },
        })}
      >
        {isLoading ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  );
};
