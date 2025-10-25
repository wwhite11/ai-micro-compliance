import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import React from 'react';

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  React.useEffect(() => {
    console.log('[RequireAuth] status:', status, 'session:', session);
    if (status === 'unauthenticated') {
      router.replace(`/auth/signin?callbackUrl=${encodeURIComponent(router.asPath)}`);
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (status === 'authenticated') {
    return <>{children}</>;
  }

  // While redirecting or in an unknown state, render nothing
  return null;
} 