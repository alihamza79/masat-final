import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import axios from 'axios';
import { useIntegrationsStore } from '@/app/(DashboardLayout)/integrations/store/integrations';
import { useEmagDataStore, ImportStatus } from '@/app/(DashboardLayout)/integrations/store/emagData';
import { EmagOrder, EmagProductOffer } from '@/lib/services/emagApiService';
import { Integration } from '@/lib/services/integrationService';
import { decryptResponse } from '@/lib/utils/responseEncryption';

// Query keys
export const EMAG_ORDERS_QUERY_KEY = 'emag-orders';
export const EMAG_PRODUCT_OFFERS_QUERY_KEY = 'emag-product-offers';

// Fetch intervals
const ORDERS_FETCH_INTERVAL = 10 * 60 * 1000; // 10 minutes
const PRODUCT_OFFERS_FETCH_INTERVAL = 12 * 60 * 60 * 1000; // 12 hours

// API timeout (3 minutes)
const API_TIMEOUT = 10 * 60 * 1000;

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
      
      // Fetch orders using API endpoint with timeout
      const response = await axios.get(`/api/integrations/${integration._id}/orders`, {
        timeout: API_TIMEOUT
      });
      
      // Check if the API call was successful
      if (!response.data.success) {
        // If the API returned an error, throw it to be caught by the catch block
        throw new Error(response.data.error || 'Failed to fetch orders');
      }
      
      const responseData = response.data.data;
      
      // Decrypt the response data
      const decryptedData = JSON.parse(decryptResponse(responseData.orderData));
      
      // Update store with orders data
      setIntegrationData(integration._id, {
        orders: decryptedData.orders,
        ordersCount: decryptedData.ordersCount,
        ordersFetched: true,
        lastUpdated: responseData.lastUpdated
      });
      
      return decryptedData;
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
      
      // Fetch product offers using API endpoint
      const response = await axios.get(`/api/integrations/${integration._id}/product-offers`);
      
      // Check if the API call was successful
      if (!response.data.success) {
        // If the API returned an error, throw it to be caught by the catch block
        throw new Error(response.data.error || 'Failed to fetch product offers');
      }
      
      const responseData = response.data.data;
      
      // Decrypt the response data
      const decryptedData = JSON.parse(decryptResponse(responseData.productOffersData));
      
      // Update store with product offers data
      setIntegrationData(integration._id, {
        productOffers: decryptedData.productOffers,
        productOffersCount: decryptedData.productOffersCount,
        productOffersFetched: true,
        lastUpdated: responseData.lastUpdated
      });
      
      return decryptedData;
    } catch (error: any) {
      console.error(`Error fetching product offers for integration ${integration.accountName}:`, error);
      const errorMessage = error.code === 'ECONNABORTED' 
        ? 'Request timed out after 3 minutes' 
        : error.message || 'Failed to fetch product offers';
      setIntegrationImportStatus(integration._id, 'error', errorMessage);
      return null;
    }
  };

  // Use React Query to fetch orders for all integrations
  const { 
    isLoading: isLoadingOrders, 
    error: ordersError, 
    refetch: refetchOrders 
  } = useQuery({
    queryKey: [EMAG_ORDERS_QUERY_KEY],
    queryFn: async () => {
      console.log('Fetching orders data...');
      const results = await Promise.all(
        integrations.map(async (integration) => {
          if (!integration._id) return null;
          return fetchOrders(integration);
        })
      );
      
      return results.filter(Boolean);
    },
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    enabled: integrations.length > 0,
    staleTime: ORDERS_FETCH_INTERVAL,
    refetchInterval: ORDERS_FETCH_INTERVAL,
    refetchIntervalInBackground: true,
    gcTime: 0 // Don't keep data in garbage collection
  });

  // Use React Query to fetch product offers for all integrations
  const { 
    isLoading: isLoadingProductOffers, 
    error: productOffersError, 
    refetch: refetchProductOffers 
  } = useQuery({
    queryKey: [EMAG_PRODUCT_OFFERS_QUERY_KEY],
    queryFn: async () => {
      console.log('Fetching product offers data...');
      const results = await Promise.all(
        integrations.map(async (integration) => {
          if (!integration._id) return null;
          return fetchProductOffers(integration);
        })
      );
      
      return results.filter(Boolean);
    },
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    enabled: integrations.length > 0,
    staleTime: PRODUCT_OFFERS_FETCH_INTERVAL,
    refetchInterval: PRODUCT_OFFERS_FETCH_INTERVAL,
    refetchIntervalInBackground: true,
    gcTime: 0 // Don't keep data in garbage collection
  });

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