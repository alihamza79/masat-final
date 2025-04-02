import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getIntegrations, 
  createIntegration as createIntegrationService, 
  updateIntegration as updateIntegrationService, 
  deleteIntegration as deleteIntegrationService,
  Integration
} from '@/lib/services/integrationService';
import { IntegrationFormData } from '@/app/(DashboardLayout)/integrations/components/IntegrationFormDialog';
import { useIntegrationSync } from './useIntegrationSync';

// Query key for integrations
export const INTEGRATIONS_QUERY_KEY = ['integrations'];

// Fetch interval for integrations
const INTEGRATIONS_FETCH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export const useIntegrations = () => {
  const queryClient = useQueryClient();
  const { syncIntegrationById } = useIntegrationSync();

  // Fetch integrations
  const { data: integrations = [], isLoading, error, refetch } = useQuery({
    queryKey: INTEGRATIONS_QUERY_KEY,
    queryFn: async () => {
      console.log('Fetching integrations...');
      
      const result = await getIntegrations();
      if (result.success && result.integrations) {
        return result.integrations;
      }
      throw new Error(result.error || 'Failed to fetch integrations');
    },
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchInterval: INTEGRATIONS_FETCH_INTERVAL,
    refetchIntervalInBackground: false
  });

  // Create integration mutation
  const createIntegrationMutation = useMutation({
    mutationFn: async (data: IntegrationFormData) => {
      try {
        return await createIntegrationService(data);
      } catch (error) {
        throw error;
      }
    },
    onSuccess: async (result) => {
      // Get the integration ID safely
      const integrationId = result.success && result.integration ? result.integration._id : undefined;
      
      if (integrationId) {
        // Invalidate and refetch integrations immediately
        await queryClient.invalidateQueries({ queryKey: INTEGRATIONS_QUERY_KEY });
        
        // Start data sync in the background - don't await this
        setTimeout(() => {
          syncIntegrationById(integrationId)
            .then(() => {
              console.log(`Background sync completed for integration ${integrationId}`);
              // Refresh integration data after sync completes
              queryClient.invalidateQueries({ queryKey: INTEGRATIONS_QUERY_KEY });
            })
            .catch(error => {
              console.error(`Background sync failed for integration ${integrationId}:`, error);
            });
        }, 100);
      }
    }
  });

  // Update integration mutation
  const updateIntegrationMutation = useMutation({
    mutationFn: async (params: { id: string; data: IntegrationFormData }) => {
      try {
        return await updateIntegrationService(params.id, params.data);
      } catch (error) {
        throw error;
      }
    },
    onSuccess: async (result) => {
      // Get the integration ID safely
      const integrationId = result.success && result.integration ? result.integration._id : undefined;
      
      if (integrationId) {
        // Invalidate and refetch integrations immediately
        await queryClient.invalidateQueries({ queryKey: INTEGRATIONS_QUERY_KEY });
        
        // No need to sync after update since username and region can't change
      }
    }
  });

  // Delete integration mutation
  const deleteIntegrationMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      try {
        return await deleteIntegrationService(integrationId);
      } catch (error) {
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate and refetch integrations
      queryClient.invalidateQueries({ queryKey: INTEGRATIONS_QUERY_KEY });
    }
  });

  return {
    integrations,
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