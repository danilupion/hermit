'use client';

import { css } from '@styled-system/css';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { LoginForm } from '../../components/auth/LoginForm';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/auth';

const LoginPage = () => {
  const router = useRouter();
  const { setAuth, isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace('/machines');
    }
  }, [isAuthenticated, router]);

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.login(email, password);
      setAuth(response.accessToken, response.refreshToken, response.user);
      router.push('/machines');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={css({
        display: 'flex',
        minH: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        p: '4',
      })}
    >
      <div
        className={css({
          w: 'full',
          maxW: '400px',
          p: '8',
          bg: 'surface',
          border: '1px solid',
          borderColor: 'border',
          borderRadius: 'lg',
        })}
      >
        <div className={css({ textAlign: 'center', mb: '8' })}>
          <h1 className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'text' })}>Hermit</h1>
          <p className={css({ mt: '2', color: 'muted', fontSize: 'sm' })}>
            Sign in to access your terminals
          </p>
        </div>

        <LoginForm onSubmit={handleLogin} isLoading={isLoading} error={error} />
      </div>
    </div>
  );
};

export default LoginPage;
