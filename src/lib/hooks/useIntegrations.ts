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
  const { setIntegrationImportStatus, setIntegrationData, removeIntegrationData } = useEmagDataStore();

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
      
      // Fetch orders
      const ordersResponse = await axios.get(`/api/integrations/${integrationId}/orders`);
      if (ordersResponse.data.success) {
        const responseData = ordersResponse.data.data;
        const decryptedOrders = JSON.parse(decryptResponse(responseData.orderData));
        setIntegrationData(integrationId, {
          orders: decryptedOrders.orders,
          ordersCount: decryptedOrders.ordersCount,
          ordersFetched: true,
          lastUpdated: responseData.lastUpdated
        });
      }

      // Fetch product offers
      const productOffersResponse = await axios.get(`/api/integrations/${integrationId}/product-offers`);
      if (productOffersResponse.data.success) {
        const responseData = productOffersResponse.data.data;
        const decryptedProducts = JSON.parse(decryptResponse(responseData.productOffersData));
        setIntegrationData(integrationId, {
          productOffers: decryptedProducts.productOffers,
          productOffersCount: decryptedProducts.productOffersCount,
          productOffersFetched: true,
          lastUpdated: responseData.lastUpdated
        });
      }

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