import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useIntegrationsStore } from '@/app/(DashboardLayout)/integrations/store/integrations';
import { useEmagDataStore } from '@/app/(DashboardLayout)/integrations/store/emagData';
import { 
  getIntegrations, 
  createIntegration, 
  updateIntegration, 
  deleteIntegration,
  Integration
} from '@/lib/services/integrationService';
import { IntegrationFormData } from '@/app/(DashboardLayout)/integrations/components/IntegrationFormDialog';
import axios from 'axios';
import { decryptResponse } from '@/lib/utils/responseEncryption';

// Query key for integrations
export const INTEGRATIONS_QUERY_KEY = ['integrations'];

// Fetch interval for integrations
const INTEGRATIONS_FETCH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export const useIntegrations = () => {
  const queryClient = useQueryClient();
  const { integrations: storeIntegrations, setIntegrations, addIntegration, updateIntegration: updateStoreIntegration, removeIntegration } = useIntegrationsStore();
  const { setIntegrationImportStatus, setIntegrationData, removeIntegrationData, integrationsData } = useEmagDataStore();

  // Fetch integrations
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: INTEGRATIONS_QUERY_KEY,
    queryFn: async () => {
      console.log('Fetching integrations...');
      if (storeIntegrations.length > 0) {
        return storeIntegrations;
      }
      
      const result = await getIntegrations();
      if (result.success && result.integrations) {
        setIntegrations(result.integrations);
        return result.integrations;
      }
      throw new Error(result.error || 'Failed to fetch integrations');
    },
    initialData: storeIntegrations.length > 0 ? storeIntegrations : undefined,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchInterval: INTEGRATIONS_FETCH_INTERVAL,
    refetchIntervalInBackground: false
  });

  // Utility function to fetch data for a single integration
  const fetchIntegrationData = async (integrationId: string) => {
    try {
      // First, set the loading status and reset the fetched flags
      // This ensures the UI shows "importing" when updating an integration
      setIntegrationData(integrationId, {
        ordersFetched: false,
        productOffersFetched: false
      });
      setIntegrationImportStatus(integrationId, 'loading');
      
      // Step 1: Get initial page for orders to determine total pages
      const ordersResponse = await axios.get(`/api/integrations/${integrationId}/orders?page=1`);
      if (!ordersResponse.data.success) {
        throw new Error(ordersResponse.data.error || 'Failed to fetch orders');
      }
      
      // Decrypt first page data
      const responseOrdersData = ordersResponse.data.data;
      const decryptedOrders = JSON.parse(decryptResponse(responseOrdersData.orderData));
      
      // Get total orders and pages
      const totalOrdersPages = decryptedOrders.totalPages || 1;
      
      // Add first page orders to store
      const currentOrders = integrationsData[integrationId]?.orders || [];
      setIntegrationData(integrationId, {
        orders: [...currentOrders, ...(decryptedOrders.orders || [])],
        ordersCount: decryptedOrders.totalCount || 0,
        lastUpdated: responseOrdersData.lastUpdated
      });
      
      // If there are additional pages (more than just page 1), fetch them
      if (totalOrdersPages > 1) {
        // Create array of page numbers to fetch (skip page 1 which we already have)
        const orderPagesToFetch = Array.from({ length: totalOrdersPages - 1 }, (_, i) => i + 2);
        
        // Fetch remaining order pages in parallel
        await Promise.all(orderPagesToFetch.map(async (page) => {
          try {
            const pageResponse = await axios.get(
              `/api/integrations/${integrationId}/orders?page=${page}`
            );
            
            if (pageResponse.data.success) {
              const pageData = pageResponse.data.data;
              const decryptedPage = JSON.parse(decryptResponse(pageData.orderData));
              
              // Append orders to the already stored orders
              const currentOrdersUpdated = integrationsData[integrationId]?.orders || [];
              setIntegrationData(integrationId, {
                orders: [...currentOrdersUpdated, ...(decryptedPage.orders || [])],
                lastUpdated: pageData.lastUpdated
              });
            }
          } catch (error) {
            console.error(`Error fetching orders page ${page}:`, error);
            // Continue with other pages even if one fails
          }
        }));
      }
      
      // Mark orders as fetched
      setIntegrationData(integrationId, {
        ordersFetched: true
      });
      
      // Step 2: Get initial page for product offers to determine total pages
      const productOffersResponse = await axios.get(`/api/integrations/${integrationId}/product-offers?page=1`);
      if (!productOffersResponse.data.success) {
        throw new Error(productOffersResponse.data.error || 'Failed to fetch product offers');
      }
      
      // Decrypt first page data
      const responseProductData = productOffersResponse.data.data;
      const decryptedProducts = JSON.parse(decryptResponse(responseProductData.productOffersData));
      
      // Get total product offers and pages
      const totalProductOffersPages = decryptedProducts.totalPages || 1;
      
      // Add first page product offers to store
      const currentProductOffers = integrationsData[integrationId]?.productOffers || [];
      setIntegrationData(integrationId, {
        productOffers: [...currentProductOffers, ...(decryptedProducts.productOffers || [])],
        productOffersCount: decryptedProducts.totalCount || 0,
        lastUpdated: responseProductData.lastUpdated
      });
      
      // If there are additional pages (more than just page 1), fetch them
      if (totalProductOffersPages > 1) {
        // Create array of page numbers to fetch (skip page 1 which we already have)
        const productOffersPagesToFetch = Array.from({ length: totalProductOffersPages - 1 }, (_, i) => i + 2);
        
        // Fetch remaining product offers pages in parallel
        await Promise.all(productOffersPagesToFetch.map(async (page) => {
          try {
            const pageResponse = await axios.get(
              `/api/integrations/${integrationId}/product-offers?page=${page}`
            );
            
            if (pageResponse.data.success) {
              const pageData = pageResponse.data.data;
              const decryptedPage = JSON.parse(decryptResponse(pageData.productOffersData));
              
              // Append product offers to the already stored product offers
              const currentProductOffersUpdated = integrationsData[integrationId]?.productOffers || [];
              setIntegrationData(integrationId, {
                productOffers: [...currentProductOffersUpdated, ...(decryptedPage.productOffers || [])],
                lastUpdated: pageData.lastUpdated
              });
            }
          } catch (error) {
            console.error(`Error fetching product offers page ${page}:`, error);
            // Continue with other pages even if one fails
          }
        }));
      }
      
      // Mark product offers as fetched
      setIntegrationData(integrationId, {
        productOffersFetched: true
      });
      
      // Set success status
      setIntegrationImportStatus(integrationId, 'success');
    } catch (error: any) {
      console.error(`Error fetching data for integration ${integrationId}:`, error);
      setIntegrationImportStatus(integrationId, 'error', error.message || 'Failed to fetch data');
    }
  };

  // Create integration mutation
  const createIntegrationMutation = useMutation({
    mutationFn: async (data: IntegrationFormData) => {
      try {
        return await createIntegration(data);
      } catch (error) {
        // Re-throw the error so it can be caught by the component
        throw error;
      }
    },
    onSuccess: async (result) => {
      const integration = result.success && result.integration;
      if (!integration) return;
      
      // Update store and cache directly
      addIntegration(integration);
      queryClient.setQueryData(INTEGRATIONS_QUERY_KEY, (old: Integration[] = []) => 
        [...old, integration]
      );
      
      // Return the result immediately so the toast can be shown
      
      // Initialize the integration and fetch data
      if (integration._id) {
        const integrationId = integration._id; // Store in a variable to fix TypeScript issues
        
        // No need to set loading status here since fetchIntegrationData handles it
        
        // Fetch data for the newly created integration in the background
        setTimeout(async () => {
          try {
            await fetchIntegrationData(integrationId);
          } catch (err: any) {
            console.error(`Error fetching data for new integration ${integration.accountName}:`, err);
          }
        }, 0);
      }
    }
  });

  // Update integration mutation
  const updateIntegrationMutation = useMutation({
    mutationFn: async (data: { id: string; data: IntegrationFormData }) => {
      try {
        return await updateIntegration(data.id, data.data);
      } catch (error) {
        throw error;
      }
    },
    onSuccess: async (result, variables) => {
      const integration = result.success && result.integration;
      if (!integration) return;
      
      // Update store and cache with the updated integration
      updateStoreIntegration(integration);
      queryClient.setQueryData(INTEGRATIONS_QUERY_KEY, (old: Integration[] = []) =>
        old.map(i => i._id === integration._id ? integration : i)
      );

      // Return success immediately so toast can show right away
      // This will happen before the orders/products are fetched
      
      // Then refetch data for this integration if it has an ID
      if (integration._id) {
        const integrationId = integration._id; // Store in a variable to fix TypeScript issues
        
        // No need to set loading status here since fetchIntegrationData handles it
        // This avoids unnecessary state updates
        
        // Fetch data for the updated integration in the background
        setTimeout(async () => {
          try {
            await fetchIntegrationData(integrationId);
          } catch (err: any) {
            console.error(`Error fetching data for updated integration ${integration.accountName}:`, err);
          }
        }, 0);
      }
    }
  });

  // Delete integration mutation
  const deleteIntegrationMutation = useMutation({
    mutationFn: deleteIntegration,
    onSuccess: (_, id) => {
      // Update store and cache directly
      removeIntegration(id);
      queryClient.setQueryData(INTEGRATIONS_QUERY_KEY, (old: Integration[] = []) => 
        old.filter(item => item._id !== id)
      );
      // Remove integration data from the emagData store
      removeIntegrationData(id);
    }
  });

  return {
    integrations: data || [],
    isLoading,
    error,
    refetch,
    createIntegration: createIntegrationMutation.mutateAsync,
    updateIntegration: updateIntegrationMutation.mutateAsync,
    deleteIntegration: deleteIntegrationMutation.mutateAsync,
    isCreating: createIntegrationMutation.isPending,
    isUpdating: updateIntegrationMutation.isPending,
    isDeleting: deleteIntegrationMutation.isPending
  };
}; 