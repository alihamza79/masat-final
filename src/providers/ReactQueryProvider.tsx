'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

export function ReactQueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Stale time: how long the data remains fresh (5 minutes)
        staleTime: 5 * 60 * 1000,
        // Cache time: how long the data remains in the cache (10 minutes)
        gcTime: 10 * 60 * 1000,
        // Retry failed requests 3 times before showing error
        retry: 3,
        // Don't refetch on window focus by default - this can be 
        // overridden for specific queries that need real-time data
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
} 