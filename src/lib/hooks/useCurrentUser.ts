import { useState, useEffect } from 'react';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

export interface UserData {
  id: string;
  name?: string;
  email?: string;
  isAuthenticated: boolean;
}

/**
 * Custom hook to get the current user ID from MongoDB
 * This ensures we get the correct MongoDB ObjectId even if next-auth session is inconsistent
 */
export function useCurrentUser() {
  const { data: sessionData } = useSession();
  const [lastRefetchTime, setLastRefetchTime] = useState(Date.now());

  // Force a refetch every 30 seconds if needed
  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefetchTime(Date.now());
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['current-user', lastRefetchTime],
    queryFn: async (): Promise<UserData> => {
      try {
        // First attempt to use our MongoDB user endpoint
        const response = await axios.get('/api/user/current');
        
        if (response.data?.success && response.data?.user?.id) {
          return {
            id: response.data.user.id,
            name: response.data.user.name,
            email: response.data.user.email,
            isAuthenticated: true
          };
        }
      } catch (err) {
        console.error('Error fetching user from MongoDB API, trying session API', err);
        
        try {
          // Fall back to session API
          const sessionResponse = await axios.get('/api/auth/session');
          
          if (sessionResponse.data?.session?.user?.id) {
            return {
              id: sessionResponse.data.session.user.id,
              name: sessionResponse.data.session.user.name,
              email: sessionResponse.data.session.user.email,
              isAuthenticated: true
            };
          }
        } catch (sessionErr) {
          console.error('Error fetching user from session API, falling back to client session', sessionErr);
        }
      }
      
      // Final fallback to client-side session
      if (sessionData?.user?.id) {
        return {
          id: sessionData.user.id,
          name: sessionData.user.name || undefined,
          email: sessionData.user.email || undefined,
          isAuthenticated: true
        };
      }

      // No authenticated user found
      return { id: '', isAuthenticated: false };
    },
    staleTime: 1000 * 30, // 30 seconds
    retry: 2,
  });

  const manualRefresh = () => {
    setLastRefetchTime(Date.now());
    return refetch();
  };

  return {
    user: data,
    isLoading,
    error,
    refetch: manualRefresh
  };
}

export default useCurrentUser; 