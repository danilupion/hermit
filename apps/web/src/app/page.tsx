'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useAuthStore } from '../stores/auth';

const HomePage = () => {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (isAuthenticated()) {
      router.replace('/machines');
    } else {
      router.replace('/login');
    }
  }, [mounted, isAuthenticated, router]);

  return null;
};

export default HomePage;
