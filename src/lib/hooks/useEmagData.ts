import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useIntegrationsStore } from '@/app/(DashboardLayout)/integrations/store/integrations';
import { useEmagDataStore, ImportStatus } from '@/app/(DashboardLayout)/integrations/store/emagData';
import { EmagOrder, EmagProductOffer } from '@/lib/services/emagApiService';
import { Integration } from '@/lib/services/integrationService';
import { fetchEmagOrders, fetchEmagProductOffers } from '@/app/actions/emagData';

// Query keys
export const EMAG_ORDERS_QUERY_KEY = 'emag-orders';
export const EMAG_PRODUCT_OFFERS_QUERY_KEY = 'emag-product-offers';

// Fetch intervals
const ORDERS_FETCH_INTERVAL = 10 * 60 * 1000; // 10 minutes
const PRODUCT_OFFERS_FETCH_INTERVAL = 12 * 60 * 60 * 1000; // 12 hours

export const useEmagData = () => {
  const queryClient = useQueryClient();
  const { integrations } = useIntegrationsStore();
  const { 
    integrationsData, 
    setIntegrationData,
    setIntegrationImportStatus 
  } = useEmagDataStore();

  // Function to fetch orders for a specific integration
  const fetchOrders = async (integration: Integration) => {
    if (!integration._id) return;
    
    try {
      // Set status to loading only if not in error state
      const currentStatus = integrationsData[integration._id]?.importStatus;
      if (currentStatus !== 'error') {
        setIntegrationImportStatus(integration._id, 'loading');
      }
      
      // Use server action directly instead of API call
      console.log(`Fetching orders for integration: ${integration.accountName} using server action`);
      const result = await fetchEmagOrders(integration._id);
      
      // Check if there was an error
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Update store with orders data
      setIntegrationData(integration._id, {
        orders: result.orders,
        ordersCount: result.ordersCount,
        ordersFetched: true,
        lastUpdated: result.lastUpdated
      });
      
      return result;
    } catch (error: any) {
      console.error(`Error fetching orders for integration ${integration.accountName}:`, error);
      setIntegrationImportStatus(integration._id, 'error', error.message || 'Failed to fetch orders');
      return null;
    }
  };

  // Function to fetch product offers for a specific integration
  const fetchProductOffers = async (integration: Integration) => {
    if (!integration._id) return;
    
    try {
      // Set status to loading only if not in error state
      const currentStatus = integrationsData[integration._id]?.importStatus;
      if (currentStatus !== 'error') {
        setIntegrationImportStatus(integration._id, 'loading');
      }
      
      // Use server action directly instead of API call
      console.log(`Fetching product offers for integration: ${integration.accountName} using server action`);
      const result = await fetchEmagProductOffers(integration._id);
      
      // Check if there was an error
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Update store with product offers data
      setIntegrationData(integration._id, {
        productOffers: result.productOffers,
        productOffersCount: result.productOffersCount,
        productOffersFetched: true,
        lastUpdated: result.lastUpdated
      });
      
      return result;
    } catch (error: any) {
      console.error(`Error fetching product offers for integration ${integration.accountName}:`, error);
      setIntegrationImportStatus(integration._id, 'error', error.message || 'Failed to fetch product offers');
      return null;
    }
  };

  // Use React Query to fetch orders for all integrations
  const { 
    isLoading: isLoadingOrders, 
    error: ordersError, 
    refetch: refetchOrders,
    dataUpdatedAt: ordersUpdatedAt
  } = useQuery({
    queryKey: [EMAG_ORDERS_QUERY_KEY],
    queryFn: async () => {
      console.log(`React Query is automatically refetching orders at ${new Date().toLocaleTimeString()}`);
      
      const results = await Promise.all(
        integrations.map(async (integration) => {
          if (!integration._id) return null;
          console.log(`Fetching orders for integration: ${integration.accountName}`);
          return fetchOrders(integration);
        })
      );
      
      return results.filter(Boolean);
    },
    // Don't refetch on component remounts to prevent page navigation refetches
    refetchOnMount: false,
    // Don't refetch on window focus
    refetchOnWindowFocus: false,
    // Enable only if we have integrations
    enabled: integrations.length > 0,
    // Consider data stale immediately so interval refetching works
    staleTime: 0,
    // Set the refetch interval to 10 minutes
    refetchInterval: ORDERS_FETCH_INTERVAL,
    // Don't refetch in background
    refetchIntervalInBackground: false,
    // Don't keep data in cache after unmounting
    gcTime: 0
  });

  // Use React Query to fetch product offers for all integrations
  const { 
    isLoading: isLoadingProductOffers, 
    error: productOffersError, 
    refetch: refetchProductOffers,
    dataUpdatedAt: productOffersUpdatedAt
  } = useQuery({
    queryKey: [EMAG_PRODUCT_OFFERS_QUERY_KEY],
    queryFn: async () => {
      console.log(`React Query is automatically refetching product offers at ${new Date().toLocaleTimeString()}`);
      
      const results = await Promise.all(
        integrations.map(async (integration) => {
          if (!integration._id) return null;
          console.log(`Fetching product offers for integration: ${integration.accountName}`);
          return fetchProductOffers(integration);
        })
      );
      
      return results.filter(Boolean);
    },
    // Don't refetch on component remounts to prevent page navigation refetches
    refetchOnMount: false,
    // Don't refetch on window focus
    refetchOnWindowFocus: false,
    // Enable only if we have integrations
    enabled: integrations.length > 0,
    // Prevent refetching on page navigation by keeping it "fresh" longer
    staleTime: PRODUCT_OFFERS_FETCH_INTERVAL,
    // Set the refetch interval to 12 hours
    refetchInterval: PRODUCT_OFFERS_FETCH_INTERVAL,
    // Don't refetch in background
    refetchIntervalInBackground: false,
    // Don't keep data in cache after unmounting
    gcTime: 0
  });

  // Monitor when orders are updated
  useEffect(() => {
    if (ordersUpdatedAt > 0) {
      const lastUpdate = new Date(ordersUpdatedAt);
      console.log(`Orders data was last updated at: ${lastUpdate.toLocaleString()}`);
      console.log(`Next refetch should occur around: ${new Date(ordersUpdatedAt + ORDERS_FETCH_INTERVAL).toLocaleString()}`);
    }
  }, [ordersUpdatedAt]);

  // Monitor when product offers are updated
  useEffect(() => {
    if (productOffersUpdatedAt > 0) {
      const lastUpdate = new Date(productOffersUpdatedAt);
      console.log(`Product offers data was last updated at: ${lastUpdate.toLocaleString()}`);
      console.log(`Next refetch should occur around: ${new Date(productOffersUpdatedAt + PRODUCT_OFFERS_FETCH_INTERVAL).toLocaleString()}`);
    }
  }, [productOffersUpdatedAt]);

  // Update import status when both queries complete
  useEffect(() => {
    // Only run this effect when loading state changes and is false (queries completed)
    if (!isLoadingOrders && !isLoadingProductOffers && integrations.length > 0) {
      // Check each integration and update its status if needed
      integrations.forEach(integration => {
        if (!integration._id) return;
        
        const integrationData = integrationsData[integration._id];
        if (!integrationData) return;
        
        // If we have attempted to load both orders and product offers data, and we're not in an error state,
        // set the status to success
        const ordersFetched = integrationData.ordersFetched === true;
        const productOffersFetched = integrationData.productOffersFetched === true;
        const isError = integrationData.importStatus === 'error';
        
        if (ordersFetched && productOffersFetched && !isError && integrationData.importStatus === 'loading') {
          setIntegrationImportStatus(integration._id, 'success');
        }
      });
    }
  }, [isLoadingOrders, isLoadingProductOffers, integrations, integrationsData, setIntegrationImportStatus]);

  // Initialize new integrations with loading status
  useEffect(() => {
    integrations.forEach(integration => {
      if (!integration._id) return;

      const integrationId = integration._id;

      // Only initialize if there's no existing integration data
      if (!integrationsData[integrationId]) {
        console.log(`Initializing integration ${integration.accountName} with loading status`);
        setIntegrationImportStatus(integrationId, 'loading');
      }
    });
  }, [integrations, integrationsData, setIntegrationImportStatus]);

  // Combined loading and error states
  const isLoading = isLoadingOrders || isLoadingProductOffers;
  const error = ordersError || productOffersError;

  // Combined refetch function
  const refetch = async () => {
    console.log(`[${new Date().toISOString()}] Manually triggered refetch for orders and product offers`);
    await Promise.all([refetchOrders(), refetchProductOffers()]);
  };

  // Helper function to force refetch regardless of stale time
  const forceRefetch = async () => {
    console.log(`[${new Date().toISOString()}] Force refetching orders and product offers`);
    await queryClient.invalidateQueries({ queryKey: [EMAG_ORDERS_QUERY_KEY] });
    await queryClient.invalidateQueries({ queryKey: [EMAG_PRODUCT_OFFERS_QUERY_KEY] });
  };

  // Helper function to get all orders across all integrations
  const getAllOrders = (): EmagOrder[] => {
    return Object.values(integrationsData).flatMap(data => data.orders);
  };

  // Helper function to get all product offers across all integrations
  const getAllProductOffers = (): EmagProductOffer[] => {
    return Object.values(integrationsData).flatMap(data => data.productOffers);
  };

  // Helper function to get import status for a specific integration
  const getImportStatus = (integrationId: string): ImportStatus => {
    return integrationsData[integrationId]?.importStatus || 'idle';
  };

  // Helper function to get orders count for a specific integration
  const getOrdersCount = (integrationId: string): number => {
    return integrationsData[integrationId]?.ordersCount || 0;
  };

  // Helper function to get product offers count for a specific integration
  const getProductOffersCount = (integrationId: string): number => {
    return integrationsData[integrationId]?.productOffersCount || 0;
  };

  return {
    integrationsData,
    isLoading,
    error,
    refetch,
    forceRefetch,
    refetchOrders,
    refetchProductOffers,
    getAllOrders,
    getAllProductOffers,
    getImportStatus,
    getOrdersCount,
    getProductOffersCount
  };
}; 