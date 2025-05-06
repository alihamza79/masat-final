import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import React from 'react';

export const PRODUCTS_QUERY_KEY = ['productOffers'];

// API client with interceptors for auth
const apiClient = axios.create();

// Add response interceptor for handling auth errors
apiClient.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error in useProducts:', error.response?.status, error.response?.data);
    
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      console.error('Authentication error in API call, redirecting to login...');
      // Sign out and redirect to login
      signOut({ callbackUrl: '/auth/login' });
    }
    return Promise.reject(error);
  }
);

export const useProducts = () => {
  const { data: session } = useSession();
  const router = useRouter();

  const {
    data: products, 
    isLoading, 
    error, 
    refetch
  } = useQuery({
    queryKey: PRODUCTS_QUERY_KEY,
    queryFn: async () => {
      try {
        const response = await apiClient.get('/api/db/product-offers', {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true
        });

        // Validate successful response
        if (!response.data.success) {
          const errorMsg = response.data.error || 'Unknown API error';
          console.error('API returned error:', errorMsg);
          throw new Error(errorMsg);
        }

        // Validate data structure
        if (!response.data.data || typeof response.data.data !== 'object') {
          console.error('Invalid response format - missing data object:', response.data);
          return [];
        }

        // Extract product offers from response
        const { productOffers } = response.data.data;
        
        // Validate product offers array
        if (!Array.isArray(productOffers)) {
          console.error('Invalid response format - productOffers is not an array:', response.data.data);
          return [];
        }
        
        if (productOffers.length > 0) {
          console.log(`Successfully fetched ${productOffers.length} products`);
        } else {
          console.log('No products available for this user');
        }
        
        return productOffers;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error(`Network error (${error.code}):`, error.message);
          if (error.response?.status === 401) {
            return []; // Already handled by interceptor
          }
        } else {
          console.error('Error fetching products:', error);
        }
        throw error;
      }
    },
    // We don't block the query based on authentication status
    // The server will handle auth validation and return 401 if needed
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnMount: true
  });

  return {
    products: products || [],
    isLoading,
    error,
    refetch,
    hasProducts: Array.isArray(products) && products.length > 0
  };
};

export default useProducts; 