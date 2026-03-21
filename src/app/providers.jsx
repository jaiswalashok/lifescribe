'use client';

import { useEffect, useRef } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { AuthProvider } from '@/lib/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

function AuthQuerySync() {
  const prevUid = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const newUid = user?.uid || null;
      if (prevUid.current !== newUid) {
        prevUid.current = newUid;
        // Auth state changed — invalidate all cached queries so they re-fetch with new auth
        queryClientInstance.invalidateQueries();
      }
    });
    return () => unsubscribe();
  }, []);

  return null;
}

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <AuthQuerySync />
        {children}
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}
