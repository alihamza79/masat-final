'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from '@/store/store';
import { GlobalDataProvider } from './GlobalDataProvider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 6 * 60 * 1000, // 6 minutes
      refetchOnWindowFocus: false, // Prevent refetch on window focus
      refetchOnMount: false // Use cached data on mount
    }
  }
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ReduxProvider store={store}>
        <GlobalDataProvider>
          {children}
        </GlobalDataProvider>
      </ReduxProvider>
    </QueryClientProvider>
  );
} 