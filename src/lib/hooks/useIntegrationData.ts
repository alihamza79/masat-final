import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { EmagOrder, EmagProductOffer } from '@/lib/services/emagApiService';
import { signOut } from 'next-auth/react';

// Create an HTTP client with response interceptor for auth errors
const apiClient = axios.create();

// Add a response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log authentication errors, but don't redirect
    if (error.response && error.response.status === 401) {
      console.error('Authentication error:', error.response.data);
      // We don't redirect automatically - let the component handle it
    }
    return Promise.reject(error);
  }
);

// Query keys
export const INTEGRATION_DETAILS_KEY = 'integration-details';
export const INTEGRATION_ORDERS_KEY = 'integration-orders';
export const INTEGRATION_PRODUCT_OFFERS_KEY = 'integration-product-offers';

/**
 * Hook for fetching integration data directly from MongoDB
 */
export const useIntegrationData = (integrationId: string | undefined, options = { enabled: true }) => {
  // Fetch integration details
  const {
    data: integrationDetails,
    isLoading: isLoadingDetails,
    error: detailsError,
    refetch: refetchDetails
  } = useQuery({
    queryKey: [INTEGRATION_DETAILS_KEY, integrationId],
    queryFn: async () => {
      if (!integrationId) return null;
      
      try {
        const response = await apiClient.get(`/api/db/integrations?integrationId=${integrationId}`);
        return response.data.success ? response.data.data : null;
      } catch (error) {
        console.error(`Error fetching integration details for ${integrationId}:`, error);
        throw error;
      }
    },
    enabled: !!integrationId && options.enabled,
    staleTime: 60000, // 1 minute
  });

  // Fetch integration orders (first page only, paginated)
  const {
    data: orders,
    isLoading: isLoadingOrders,
    error: ordersError,
    refetch: refetchOrders
  } = useQuery({
    queryKey: [INTEGRATION_ORDERS_KEY, integrationId],
    queryFn: async () => {
      if (!integrationId) return { orders: [], totalCount: 0, totalPages: 0 };
      
      try {
        const response = await apiClient.get(`/api/db/orders?integrationId=${integrationId}&page=1&pageSize=100`);
        return response.data.success ? response.data.data : { orders: [], totalCount: 0, totalPages: 0 };
      } catch (error) {
        console.error(`Error fetching orders for integration ${integrationId}:`, error);
        return { orders: [], totalCount: 0, totalPages: 0 };
      }
    },
    enabled: !!integrationId && options.enabled,
    staleTime: 60000, // 1 minute
  });

  // Fetch integration product offers (first page only, paginated)
  const {
    data: productOffers,
    isLoading: isLoadingProductOffers,
    error: productOffersError,
    refetch: refetchProductOffers
  } = useQuery({
    queryKey: [INTEGRATION_PRODUCT_OFFERS_KEY, integrationId],
    queryFn: async () => {
      if (!integrationId) return { productOffers: [], totalCount: 0, totalPages: 0 };
      
      try {
        const response = await apiClient.get(`/api/db/product-offers?integrationId=${integrationId}&page=1&pageSize=100`);
        return response.data.success ? response.data.data : { productOffers: [], totalCount: 0, totalPages: 0 };
      } catch (error) {
        console.error(`Error fetching product offers for integration ${integrationId}:`, error);
        return { productOffers: [], totalCount: 0, totalPages: 0 };
      }
    },
    enabled: !!integrationId && options.enabled,
    staleTime: 60000, // 1 minute
  });

  // Function to fetch a specific page of orders
  const fetchOrdersPage = async (page: number, pageSize: number = 100) => {
    if (!integrationId) return { orders: [], totalCount: 0, totalPages: 0 };
    
    try {
      const response = await apiClient.get(`/api/db/orders?integrationId=${integrationId}&page=${page}&pageSize=${pageSize}`);
      return response.data.success ? response.data.data : { orders: [], totalCount: 0, totalPages: 0 };
    } catch (error) {
      console.error(`Error fetching orders page ${page} for integration ${integrationId}:`, error);
      throw error;
    }
  };

  // Function to fetch a specific page of product offers
  const fetchProductOffersPage = async (page: number, pageSize: number = 100, search?: string) => {
    if (!integrationId) return { productOffers: [], totalCount: 0, totalPages: 0 };
    
    let url = `/api/db/product-offers?integrationId=${integrationId}&page=${page}&pageSize=${pageSize}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    
    try {
      const response = await apiClient.get(url);
      return response.data.success ? response.data.data : { productOffers: [], totalCount: 0, totalPages: 0 };
    } catch (error) {
      console.error(`Error fetching product offers page ${page} for integration ${integrationId}:`, error);
      throw error;
    }
  };

  // Function to refetch all data
  const refetchAll = async () => {
    await Promise.all([
      refetchDetails(),
      refetchOrders(),
      refetchProductOffers()
    ]);
  };

  return {
    // Integration details
    integrationDetails,
    ordersCount: integrationDetails?.ordersCount || 0,
    productOffersCount: integrationDetails?.productOffersCount || 0,
    importStatus: integrationDetails?.importStatus || 'idle',
    importError: integrationDetails?.importError,
    lastOrdersImport: integrationDetails?.lastOrdersImport,
    lastProductOffersImport: integrationDetails?.lastProductOffersImport,
    
    // Orders data
    orders: orders?.orders || [],
    ordersTotalCount: orders?.totalCount || 0,
    ordersTotalPages: orders?.totalPages || 0,
    
    // Product offers data
    productOffers: productOffers?.productOffers || [],
    productOffersTotalCount: productOffers?.totalCount || 0,
    productOffersTotalPages: productOffers?.totalPages || 0,
    
    // Loading states
    isLoading: isLoadingDetails || isLoadingOrders || isLoadingProductOffers,
    isLoadingDetails,
    isLoadingOrders,
    isLoadingProductOffers,
    
    // Error states
    hasError: !!detailsError || !!ordersError || !!productOffersError,
    detailsError,
    ordersError,
    productOffersError,
    
    // Refetch functions
    refetchAll,
    refetchDetails,
    refetchOrders,
    refetchProductOffers,
    
    // Pagination functions
    fetchOrdersPage,
    fetchProductOffersPage
  };
}; 