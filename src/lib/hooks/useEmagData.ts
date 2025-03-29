import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import axios from 'axios';
import { useIntegrationsStore } from '@/app/(DashboardLayout)/integrations/store/integrations';
import { EmagOrder, EmagProductOffer } from '@/lib/services/emagApiService';
import { Integration } from '@/lib/services/integrationService';
import { decryptResponse } from '@/lib/utils/responseEncryption';

// Query keys
export const EMAG_ORDERS_QUERY_KEY = 'emag-orders';
export const EMAG_PRODUCT_OFFERS_QUERY_KEY = 'emag-product-offers';
export const INTEGRATIONS_STATUS_QUERY_KEY = 'integrations-status';
export const INTEGRATION_DETAILS_KEY = 'integration-details';

// Fetch intervals
const ORDERS_FETCH_INTERVAL = 10 * 60 * 1000; // 10 minutes
const PRODUCT_OFFERS_FETCH_INTERVAL = 12 * 60 * 60 * 1000; // 12 hours

// API timeout (10 minutes)
const API_TIMEOUT = 10 * 60 * 1000;

// Page sizes for pagination
const ORDERS_PAGE_SIZE = 1000; // Use 1000 for orders
const PRODUCT_OFFERS_PAGE_SIZE = 100; // Use 100 for product offers

// Type for integration status
export type ImportStatus = 'idle' | 'loading' | 'success' | 'error';

// Interface for integration status data
interface IntegrationStatus {
  _id: string;
  accountName: string;
  importStatus: ImportStatus;
  importError?: string;
  lastOrdersImport: string | null;
  lastProductOffersImport: string | null;
  ordersCount: number;
  productOffersCount: number;
}

export const useEmagData = () => {
  const queryClient = useQueryClient();
  const { integrations } = useIntegrationsStore();

  // Fetch integration statuses
  const { 
    data: integrationsStatus, 
    isLoading: isLoadingStatus, 
    error: statusError,
    refetch: refetchStatus 
  } = useQuery({
    queryKey: [INTEGRATIONS_STATUS_QUERY_KEY],
    queryFn: async () => {
      try {
        const response = await axios.get('/api/db/integrations/status');
        return response.data.success ? response.data.data : [];
      } catch (error) {
        console.error('Error fetching integration statuses:', error);
        throw error;
      }
    },
    refetchInterval: 60000, // Refetch every 1 minute to keep status updated
    refetchIntervalInBackground: false, // Only refetch when app is in foreground
    staleTime: 300000, // Consider data fresh for 5 minutes
    retry: 1, // Only retry once on failure
    retryDelay: 5000, // Wait 5 seconds before retrying
    // Prevent refetching data until needed
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Function to update integration status
  const updateIntegrationStatus = useCallback(async (integrationId: string, status: ImportStatus, error?: string) => {
    try {
      console.log(`Updating integration ${integrationId} status to ${status}${error ? ` with error: ${error}` : ''}`);
      
      const response = await axios.put(`/api/db/integrations/status?integrationId=${integrationId}`, {
        status,
        error: error !== undefined ? error : undefined
      });
      
      if (response.data.success) {
        console.log(`Successfully updated integration ${integrationId} status to ${status}`);
        
        // Always invalidate the status queries to ensure UI is updated
        queryClient.invalidateQueries({ queryKey: [INTEGRATIONS_STATUS_QUERY_KEY] });
        
        // For completed states or any changes to counts, invalidate specific integration queries
        if (status === 'success' || status === 'error') {
          // Invalidate related data queries to ensure fresh data is fetched
          queryClient.invalidateQueries({ queryKey: [EMAG_ORDERS_QUERY_KEY] });
          queryClient.invalidateQueries({ queryKey: ['integration-details', integrationId] });
        }
      } else {
        console.error(`Failed to update integration status: ${response.data.error}`);
      }
    } catch (err) {
      console.error('Error updating integration status:', err);
    }
  }, [queryClient]);

  // Function to fetch a count of orders from the eMAG API
  const fetchOrdersCount = async (integration: Integration) => {
    if (!integration._id) return null;
    
    try {
      const response = await axios.get(
        `/api/integrations/${integration._id}/orders?countOnly=true`, 
        { timeout: API_TIMEOUT }
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch orders count');
      }
      
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching orders count for integration ${integration.accountName}:`, error);
      throw error;
    }
  };

  // Function to fetch a single page of orders from the eMAG API
  const fetchOrdersPage = async (integration: Integration, page: number) => {
    if (!integration._id) return null;
    
    try {
      const response = await axios.get(
        `/api/integrations/${integration._id}/orders?page=${page}&pageSize=${ORDERS_PAGE_SIZE}`, 
        { timeout: API_TIMEOUT }
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch orders');
      }
      
      const responseData = response.data.data;
      return {
        orderData: JSON.parse(decryptResponse(responseData.orderData)),
        lastUpdated: responseData.lastUpdated
      };
    } catch (error) {
      console.error(`Error fetching orders page ${page} for integration ${integration.accountName}:`, error);
      throw error;
    }
  };

  // Function to fetch product offers count from the eMAG API
  const fetchProductOffersCount = async (integration: Integration) => {
    if (!integration._id) return null;
    
    try {
      const response = await axios.get(
        `/api/integrations/${integration._id}/product-offers?countOnly=true`, 
        { timeout: API_TIMEOUT }
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch product offers count');
      }
      
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching product offers count for integration ${integration.accountName}:`, error);
      throw error;
    }
  };

  // Function to fetch a single page of product offers from the eMAG API
  const fetchProductOffersPage = async (integration: Integration, page: number) => {
    if (!integration._id) return null;
    
    try {
      const response = await axios.get(
        `/api/integrations/${integration._id}/product-offers?page=${page}&pageSize=${PRODUCT_OFFERS_PAGE_SIZE}`, 
        { timeout: API_TIMEOUT }
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch product offers');
      }
      
      const responseData = response.data.data;
      return {
        productOffersData: JSON.parse(decryptResponse(responseData.productOffersData)),
        lastUpdated: responseData.lastUpdated
      };
    } catch (error) {
      console.error(`Error fetching product offers page ${page} for integration ${integration.accountName}:`, error);
      throw error;
    }
  };

  // Function to store orders in the database
  const storeOrders = async (integrationId: string, orders: any[]) => {
    try {
      const response = await axios.post('/api/db/orders', {
        integrationId,
        orders
      });
      
      return response.data.success;
    } catch (error) {
      console.error(`Error storing orders for integration ${integrationId}:`, error);
      throw error;
    }
  };

  // Function to store product offers in the database
  const storeProductOffers = async (integrationId: string, productOffers: any[]) => {
    try {
      const response = await axios.post('/api/db/product-offers', {
        integrationId,
        productOffers,
        replaceAll: true // Replace all product offers for this integration
      });
      
      return response.data.success;
    } catch (error) {
      console.error(`Error storing product offers for integration ${integrationId}:`, error);
      throw error;
    }
  };

  // Function to fetch and store orders for a specific integration
  const fetchAndStoreOrders = async (integration: Integration) => {
    if (!integration._id) return null;
    const integrationId = integration._id;
    
    try {
      // Update status to loading
      await updateIntegrationStatus(integrationId, 'loading');
      
      // 1. Fetch the count to determine total pages
      const countData = await fetchOrdersCount(integration);
      if (!countData) {
        throw new Error('Failed to fetch orders count');
      }
      
      let totalPages = countData.totalPages;
      const totalCount = countData.totalCount;
      
      if (totalCount === 0) {
        // No orders to fetch, store an empty array and return
        await storeOrders(integrationId, []);
        return { success: true, count: 0 };
      }
      
      // 2. Fetch first page to get more accurate page count and first batch of orders
      const firstPageResult = await fetchOrdersPage(integration, 1);
      if (!firstPageResult) {
        throw new Error('Failed to fetch first page of orders');
      }
      
      const firstPageData = firstPageResult.orderData;
      
      // Use totalPages from response if available (more accurate)
      if (firstPageData.totalPages !== undefined) {
        totalPages = firstPageData.totalPages;
      }
      
      // Create an array to collect all orders
      let allOrders = [...firstPageData.orders || []];
      
      // If there are more pages, fetch them
      if (totalPages > 1) {
        const validPageCount = Math.min(totalPages, 100); // Safety limit
        
        // Create a Set to track page numbers and avoid duplicates
        const pagesToFetch = new Set<number>();
        for (let page = 2; page <= validPageCount; page++) {
          pagesToFetch.add(page);
        }
        
        // Convert to array and fetch remaining pages in parallel
        const pagePromises = Array.from(pagesToFetch).map(async (page) => {
          try {
            return await fetchOrdersPage(integration, page);
          } catch (error) {
            // Log error but continue with other pages
            console.error(`Error fetching orders page ${page}:`, error);
            return null;
          }
        });
        
        const pageResults = await Promise.all(pagePromises);
        
        // Combine orders from all pages
        for (const result of pageResults) {
          if (result && result.orderData && result.orderData.orders) {
            allOrders = [...allOrders, ...result.orderData.orders];
          }
        }
      }
      
      // Store all orders in the database
      await storeOrders(integrationId, allOrders);
      
      return { success: true, count: allOrders.length };
      
    } catch (error: any) {
      console.error(`Error fetching and storing orders for integration ${integration.accountName}:`, error);
      // Update status to error
      await updateIntegrationStatus(integrationId, 'error', error.message || 'Failed to fetch and store orders');
      throw error;
    }
  };

  // Function to fetch and store product offers for a specific integration
  const fetchAndStoreProductOffers = async (integration: Integration) => {
    if (!integration._id) return null;
    const integrationId = integration._id;
    
    try {
      // Update status to loading (if not already set by orders fetching)
      const statusResponse = await axios.get(`/api/db/integrations/status?integrationId=${integrationId}`);
      const currentStatus = statusResponse.data.success ? statusResponse.data.data.importStatus : null;
      
      if (currentStatus !== 'loading') {
        await updateIntegrationStatus(integrationId, 'loading');
      }
      
      // 1. Fetch the count to determine total pages
      const countData = await fetchProductOffersCount(integration);
      if (!countData) {
        throw new Error('Failed to fetch product offers count');
      }
      
      let totalPages = countData.totalPages;
      const totalCount = countData.totalCount;
      
      if (totalCount === 0) {
        // No product offers to fetch, store an empty array and return
        await storeProductOffers(integrationId, []);
        return { success: true, count: 0 };
      }
      
      // 2. Fetch first page to get more accurate page count and first batch of product offers
      const firstPageResult = await fetchProductOffersPage(integration, 1);
      if (!firstPageResult) {
        throw new Error('Failed to fetch first page of product offers');
      }
      
      const firstPageData = firstPageResult.productOffersData;
      
      // Use totalPages from response if available (more accurate)
      if (firstPageData.totalPages !== undefined) {
        totalPages = firstPageData.totalPages;
      }
      
      // Create an array to collect all product offers
      let allProductOffers = [...firstPageData.productOffers || []];
      
      // If there are more pages, fetch them
      if (totalPages > 1) {
        const validPageCount = Math.min(totalPages, 100); // Safety limit
        
        // Create a Set to track page numbers and avoid duplicates
        const pagesToFetch = new Set<number>();
        for (let page = 2; page <= validPageCount; page++) {
          pagesToFetch.add(page);
        }
        
        // Convert to array and fetch remaining pages in parallel
        const pagePromises = Array.from(pagesToFetch).map(async (page) => {
          try {
            return await fetchProductOffersPage(integration, page);
          } catch (error) {
            // Log error but continue with other pages
            console.error(`Error fetching product offers page ${page}:`, error);
            return null;
          }
        });
        
        const pageResults = await Promise.all(pagePromises);
        
        // Combine product offers from all pages
        for (const result of pageResults) {
          if (result && result.productOffersData && result.productOffersData.productOffers) {
            allProductOffers = [...allProductOffers, ...result.productOffersData.productOffers];
          }
        }
      }
      
      // Store all product offers in the database
      await storeProductOffers(integrationId, allProductOffers);
      
      return { success: true, count: allProductOffers.length };
      
    } catch (error: any) {
      console.error(`Error fetching and storing product offers for integration ${integration.accountName}:`, error);
      // Update status to error
      await updateIntegrationStatus(integrationId, 'error', error.message || 'Failed to fetch and store product offers');
      throw error;
    }
  };

  // Function to fetch and store all data for a specific integration
  const fetchIntegrationData = async (integration: Integration) => {
    if (!integration._id) return null;
    const integrationId = integration._id;
    
    try {
      // Update status to loading
      await updateIntegrationStatus(integrationId, 'loading');
      
      // Fetch and store orders and product offers in parallel
      const [ordersResult, productOffersResult] = await Promise.all([
        fetchAndStoreOrders(integration).catch(error => {
          console.error(`Error fetching orders for integration ${integration.accountName}:`, error);
          return { success: false, error };
        }),
        fetchAndStoreProductOffers(integration).catch(error => {
          console.error(`Error fetching product offers for integration ${integration.accountName}:`, error);
          return { success: false, error };
        })
      ]);
      
      // Check if both operations were successful
      if (ordersResult && ordersResult.success && productOffersResult && productOffersResult.success) {
        // Update status to success with empty error to clear any previous errors
        await updateIntegrationStatus(integrationId, 'success', '');
        
        // Force invalidation of all related queries to ensure UI reflects the latest status
        queryClient.invalidateQueries({ queryKey: [INTEGRATIONS_STATUS_QUERY_KEY] });
        queryClient.invalidateQueries({ queryKey: [INTEGRATION_DETAILS_KEY, integrationId] });
        
        console.log(`Successfully completed import for integration ${integrationId} - status updated to success`);
        return { success: true };
      } else {
        // Update status to error with details
        const errorMessage = [];
        if (ordersResult && !ordersResult.success) {
          // Type assertion to tell TypeScript this has an error property
          const result = ordersResult as { success: false; error: any };
          errorMessage.push(`Orders: ${result.error}`);
        }
        if (productOffersResult && !productOffersResult.success) {
          // Type assertion to tell TypeScript this has an error property
          const result = productOffersResult as { success: false; error: any };
          errorMessage.push(`Product Offers: ${result.error}`);
        }
        await updateIntegrationStatus(integrationId, 'error', errorMessage.join('; '));
        return { success: false, error: errorMessage.join('; ') };
      }
    } catch (error: any) {
      console.error(`Error fetching data for integration ${integration.accountName}:`, error);
      // Update status to error
      await updateIntegrationStatus(integrationId, 'error', error.message || 'Failed to fetch data');
      return { success: false, error: error.message || 'Failed to fetch data' };
    }
  };

  // Function to fetch data for all integrations (used by the React Query hook)
  const fetchAllData = useCallback(async () => {
    if (integrations.length === 0) return null;
    
    try {
      // Process each integration sequentially to avoid overwhelming the server
      const results = [];
      
      // Use the already fetched integrationsStatus data rather than fetching it again
      // This prevents additional API calls
      const integrationStatusMap = new Map();
      if (integrationsStatus && Array.isArray(integrationsStatus)) {
        integrationsStatus.forEach(status => {
          if (status._id) {
            integrationStatusMap.set(status._id, status);
          }
        });
      }
      
      for (const integration of integrations) {
        try {
          // Check if it's time to refetch this integration's data
          let shouldFetchOrders = true;
          let shouldFetchProductOffers = true;
          
          // Get the current status for this integration
          if (integration._id) {
            // Use the cached status data instead of making an API call
            const integrationStatus = integrationStatusMap.get(integration._id);
            
            if (integrationStatus) {
              // Calculate if it's time to refetch orders
              if (integrationStatus.lastOrdersImport) {
                const lastOrdersImport = new Date(integrationStatus.lastOrdersImport);
                const nextOrdersFetch = new Date(lastOrdersImport.getTime() + ORDERS_FETCH_INTERVAL);
                shouldFetchOrders = new Date() >= nextOrdersFetch;
              }
              
              // Calculate if it's time to refetch product offers
              if (integrationStatus.lastProductOffersImport) {
                const lastProductOffersImport = new Date(integrationStatus.lastProductOffersImport);
                const nextProductOffersFetch = new Date(lastProductOffersImport.getTime() + PRODUCT_OFFERS_FETCH_INTERVAL);
                shouldFetchProductOffers = new Date() >= nextProductOffersFetch;
              }
            }
          }
          
          // If either one needs to be refetched, fetch all data
          if (shouldFetchOrders || shouldFetchProductOffers) {
            const result = await fetchIntegrationData(integration);
            results.push(result);
          } else {
            results.push({ success: true, skipped: true });
          }
        } catch (error) {
          console.error(`Error processing integration ${integration.accountName}:`, error);
          results.push({ success: false, error });
        }
      }
      
      return results;
    } catch (error: any) {
      console.error('Error fetching data for all integrations:', error);
      return null;
    }
  }, [integrations, integrationsStatus]);

  // Use React Query to fetch orders for all integrations
  const { 
    isLoading: isLoadingData, 
    error: dataError, 
    refetch: refetchData 
  } = useQuery({
    queryKey: [EMAG_ORDERS_QUERY_KEY],
    queryFn: fetchAllData,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    enabled: integrations.length > 0,
    staleTime: ORDERS_FETCH_INTERVAL,
    refetchInterval: ORDERS_FETCH_INTERVAL,
    refetchIntervalInBackground: false,
    retry: 1,
    retryDelay: 10000,
  });

  // Combined refetch function
  const refetch = useCallback(async () => {
    console.log(`[${new Date().toISOString()}] Manually triggered refetch for orders and product offers`);
    await refetchData();
    await refetchStatus();
  }, [refetchData, refetchStatus]);

  // Helper function to force refetch regardless of stale time
  const forceRefetch = useCallback(async () => {
    console.log(`[${new Date().toISOString()}] Force refetching orders and product offers`);
    await queryClient.invalidateQueries({ queryKey: [EMAG_ORDERS_QUERY_KEY] });
    await queryClient.invalidateQueries({ queryKey: [INTEGRATIONS_STATUS_QUERY_KEY] });
  }, [queryClient]);

  // Helper function to get orders for an integration directly from the database
  const getOrders = useCallback(async (integrationId: string, options: { page?: number, pageSize?: number } = {}) => {
    try {
      const { page = 1, pageSize = 100 } = options;
      const response = await axios.get(`/api/db/orders?integrationId=${integrationId}&page=${page}&pageSize=${pageSize}`);
      return response.data.success ? response.data.data : { orders: [], totalCount: 0 };
    } catch (error) {
      console.error(`Error fetching orders for integration ${integrationId}:`, error);
      return { orders: [], totalCount: 0 };
    }
  }, []);

  // Helper function to get product offers for an integration directly from the database
  const getProductOffers = useCallback(async (integrationId: string, options: { page?: number, pageSize?: number, search?: string } = {}) => {
    try {
      const { page = 1, pageSize = 100, search = '' } = options;
      let url = `/api/db/product-offers?integrationId=${integrationId}&page=${page}&pageSize=${pageSize}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      
      const response = await axios.get(url);
      return response.data.success ? response.data.data : { productOffers: [], totalCount: 0 };
    } catch (error) {
      console.error(`Error fetching product offers for integration ${integrationId}:`, error);
      return { productOffers: [], totalCount: 0 };
    }
  }, []);

  // Helper function to get import status for a specific integration
  const getImportStatus = useCallback((integrationId: string): ImportStatus => {
    if (!integrationsStatus) return 'idle';
    const integration = integrationsStatus.find((int: any) => int._id === integrationId);
    return integration ? integration.importStatus : 'idle';
  }, [integrationsStatus]);

  // Helper function to get orders count for a specific integration
  const getOrdersCount = useCallback((integrationId: string): number => {
    if (!integrationsStatus) return 0;
    const integration = integrationsStatus.find((int: any) => int._id === integrationId);
    return integration ? integration.ordersCount : 0;
  }, [integrationsStatus]);

  // Helper function to get product offers count for a specific integration
  const getProductOffersCount = useCallback((integrationId: string): number => {
    if (!integrationsStatus) return 0;
    const integration = integrationsStatus.find((int: any) => int._id === integrationId);
    return integration ? integration.productOffersCount : 0;
  }, [integrationsStatus]);

  // Helper function to get all orders across all integrations
  const getAllOrders = useCallback(async (): Promise<EmagOrder[]> => {
    try {
      // This is simplified - in practice, you'd want pagination
      const response = await axios.get(`/api/db/orders`);
      return response.data.success ? response.data.data.orders : [];
    } catch (error) {
      console.error('Error fetching all orders:', error);
      return [];
    }
  }, []);

  // Helper function to get all product offers across all integrations
  const getAllProductOffers = useCallback(async (): Promise<EmagProductOffer[]> => {
    try {
      // This is simplified - in practice, you'd want pagination
      const response = await axios.get(`/api/db/product-offers`);
      return response.data.success ? response.data.data.productOffers : [];
    } catch (error) {
      console.error('Error fetching all product offers:', error);
      return [];
    }
  }, []);

  return {
    integrationsStatus,
    isLoading: isLoadingData || isLoadingStatus,
    error: dataError || statusError,
    refetch,
    forceRefetch,
    getOrders,
    getProductOffers,
    getImportStatus,
    getOrdersCount,
    getProductOffersCount,
    getAllOrders,
    getAllProductOffers,
    updateIntegrationStatus,
    fetchIntegrationData
  };
}; 