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
const ORDERS_FETCH_INTERVAL = 5 * 60 * 1000; // 5 minutes
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
      
      // Fetch orders using API endpoint
      const response = await axios.get(`/api/integrations/${integration._id}/orders`);
      
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
      setIntegrationImportStatus(integration._id, 'error', error.message || 'Failed to fetch product offers');
      return null;
    }
  };

  // Use React Query to fetch orders for all integrations
  const { 
    isLoading: isLoadingOrders, 
    error: ordersError, 
    refetch: refetchOrders 
  } = useQuery({
    queryKey: [EMAG_ORDERS_QUERY_KEY, integrations.map(integration => integration._id)],
    queryFn: async () => {
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
    gcTime: 0 // Don't keep data in garbage collection
  });

  // Use React Query to fetch product offers for all integrations
  const { 
    isLoading: isLoadingProductOffers, 
    error: productOffersError, 
    refetch: refetchProductOffers 
  } = useQuery({
    queryKey: [EMAG_PRODUCT_OFFERS_QUERY_KEY, integrations.map(integration => integration._id)],
    queryFn: async () => {
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
    gcTime: 0 // Don't keep data in garbage collection
  });

  // Set up interval to refetch orders every 5 minutes
  useEffect(() => {
    if (integrations.length === 0) return;
    
    const ordersIntervalId = setInterval(() => {
      console.log('Refetching orders data...');
      refetchOrders();
    }, ORDERS_FETCH_INTERVAL);
    
    return () => clearInterval(ordersIntervalId);
  }, [integrations, refetchOrders]);

  // Set up interval to refetch product offers every 12 hours
  useEffect(() => {
    if (integrations.length === 0) return;
    
    const productOffersIntervalId = setInterval(() => {
      console.log('Refetching product offers data...');
      refetchProductOffers();
    }, PRODUCT_OFFERS_FETCH_INTERVAL);
    
    return () => clearInterval(productOffersIntervalId);
  }, [integrations, refetchProductOffers]);

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
    await Promise.all([refetchOrders(), refetchProductOffers()]);
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
    refetchOrders,
    refetchProductOffers,
    getAllOrders,
    getAllProductOffers,
    getImportStatus,
    getOrdersCount,
    getProductOffersCount
  };
}; 