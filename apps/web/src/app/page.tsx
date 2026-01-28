'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useAuthStore } from '../stores/auth';

const HomePage = () => {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace('/machines');
    } else {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  return null;
};

export default HomePage;
