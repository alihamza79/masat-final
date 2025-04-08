import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import useAuth from './useAuth';

export const PRODUCTS_QUERY_KEY = ['productOffers'];

// Create a client with auth error handling
const apiClient = axios.create();

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error('Authentication error:', error.response.data);
      // Redirect to login page on auth error
      signOut({ callbackUrl: '/auth/auth1/login' });
    }
    return Promise.reject(error);
  }
);

export const useProducts = () => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: PRODUCTS_QUERY_KEY,
    queryFn: async () => {
      try {
        const res = await apiClient.get('/api/db/product-offers');
        if (!res.data.success) {
          throw new Error(res.data.error || 'Failed to fetch product offers');
        }
        return res.data.data.productOffers;
      } catch (error) {
        console.error('Error fetching product offers:', error);
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          // Handle 401 error - already handled in interceptor
          return [];
        }
        throw error;
      }
    },
    // Only run the query if the user is authenticated
    enabled: isAuthenticated,
    // Add some stale time to prevent excessive refetching
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return { products: data || [], isLoading, error, refetch };
};

export default useProducts; 