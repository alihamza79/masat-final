import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import useAuth from './useAuth';
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
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: PRODUCTS_QUERY_KEY,
    queryFn: async () => {
      try {
        console.log('Fetching product offers...');
        console.log('Auth status:', { isAuthenticated, userId: user?.id });
        
        if (!isAuthenticated || !user?.id) {
          console.error('User not authenticated or missing user ID, cannot fetch products');
          return [];
        }
        
        // Include authorization headers for additional security
        const res = await apiClient.get('/api/db/product-offers', {
          headers: {
            'Content-Type': 'application/json'
          },
          withCredentials: true // This ensures cookies are sent with the request
        });
        
        console.log('Product offers API response status:', res.status);
        console.log('Product offers API success status:', res.data.success);
        
        if (!res.data.success) {
          console.error('API returned error:', res.data.error);
          throw new Error(res.data.error || 'Failed to fetch product offers');
        }
        
        // Validate the response data structure
        if (!res.data.data) {
          console.error('Invalid API response format - missing data property:', res.data);
          return [];
        }
        
        // Detailed logging to understand the response structure
        console.log('Response data structure keys:', Object.keys(res.data.data));
        
        // Check if productOffers exists and is an array
        if (!Array.isArray(res.data.data.productOffers)) {
          console.error('Invalid API response format - productOffers is not an array:', res.data.data);
          // If it's not an array but exists, try to return it anyway
          return typeof res.data.data.productOffers === 'object' ? [res.data.data.productOffers] : [];
        }
        
        const products = res.data.data.productOffers;
        console.log(`Fetched ${products.length} products`);
        
        // Log the first product to verify structure
        if (products.length > 0) {
          console.log('Sample product structure:', products[0]);
          console.log('Sample product ID:', products[0]._id);
          console.log('Sample product integrationId:', products[0].integrationId);
        }
        
        return products;
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
    // Retry failed requests
    retry: 2,
    // Add some refetch options
    refetchOnWindowFocus: false,
    // Force refetch on component mount
    refetchOnMount: true
  });

  // Log data changes for debugging
  React.useEffect(() => {
    console.log('useProducts hook - data updated:', {
      hasData: !!data,
      dataLength: Array.isArray(data) ? data.length : 0
    });
  }, [data]);

  return { 
    products: data || [], 
    isLoading, 
    error, 
    refetch,
    hasProducts: Array.isArray(data) && data.length > 0
  };
};

export default useProducts; 