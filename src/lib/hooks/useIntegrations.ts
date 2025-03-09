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

// Query key for integrations
export const INTEGRATIONS_QUERY_KEY = ['integrations'];

// Fetch interval for integrations
const INTEGRATIONS_FETCH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export const useIntegrations = () => {
  const queryClient = useQueryClient();
  const { integrations: storeIntegrations, setIntegrations, addIntegration, updateIntegration: updateStoreIntegration, removeIntegration } = useIntegrationsStore();
  const { setIntegrationImportStatus, removeIntegrationData } = useEmagDataStore();

  // Fetch integrations
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: INTEGRATIONS_QUERY_KEY,
    queryFn: async () => {
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
    refetchOnWindowFocus: false
  });

  // Set up interval to refetch integrations every 5 minutes
  useEffect(() => {
    const intervalId = setInterval(() => {
      console.log('Refetching integrations...');
      refetch();
    }, INTEGRATIONS_FETCH_INTERVAL);
    
    return () => clearInterval(intervalId);
  }, [refetch]);

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
    onSuccess: (result) => {
      const integration = result.success && result.integration;
      if (!integration) return;
      
      // Update store and cache directly
      addIntegration(integration);
      queryClient.setQueryData(INTEGRATIONS_QUERY_KEY, (old: Integration[] = []) => 
        [...old, integration]
      );
      
      // Initialize the integration with loading status in the emagData store
      if (integration._id) {
        console.log(`Setting initial loading status for new integration ${integration.accountName}`);
        setIntegrationImportStatus(integration._id, 'loading');
      }
    }
  });

  // Update integration mutation
  const updateIntegrationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: IntegrationFormData }) => {
      try {
        return await updateIntegration(id, data);
      } catch (error) {
        // Re-throw the error so it can be caught by the component
        throw error;
      }
    },
    onSuccess: (result) => {
      const integration = result.success && result.integration;
      if (!integration) return;
      
      // Update store and cache directly
      updateStoreIntegration(integration);
      queryClient.setQueryData(INTEGRATIONS_QUERY_KEY, (old: Integration[] = []) => 
        old.map(item => item._id === integration._id ? integration : item)
      );
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