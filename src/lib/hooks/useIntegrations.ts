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

// Query key for syncing - needs to match the key in GlobalDataProvider
export const INTEGRATION_SYNC_QUERY_KEY = 'integration-sync';

// Fetch interval for integrations
const INTEGRATIONS_FETCH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export const useIntegrations = (options?: { enabled?: boolean }) => {
  const queryClient = useQueryClient();
  const { syncIntegrationById } = useIntegrationSync();
  
  // Default enabled to true if not provided
  const isEnabled = options?.enabled !== undefined ? options.enabled : true;

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
    enabled: isEnabled,
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
        console.log(`Integration ${integrationId} created successfully.`);
        
        // First invalidate the integrations query to refresh the UI immediately
        await queryClient.invalidateQueries({ queryKey: INTEGRATIONS_QUERY_KEY });
        
        // Handle the sync process in the background after returning control
        // This allows the dialog to close immediately
        setTimeout(async () => {
          try {
            // Then explicitly refetch to ensure the list is updated
            await queryClient.refetchQueries({ queryKey: INTEGRATIONS_QUERY_KEY });
            
            // Now that integrations list is updated, trigger the sync check
            console.log(`Integration list updated. Triggering sync check for ${integrationId}...`);
            
            // Directly trigger a sync for the new integration
            if (syncIntegrationById) {
              console.log(`Directly syncing new integration ${integrationId}...`);
              await syncIntegrationById(integrationId);
            } else {
              // Fallback to the previous method if syncIntegrationById is not available
              await queryClient.invalidateQueries({ queryKey: [INTEGRATION_SYNC_QUERY_KEY] });
              await queryClient.refetchQueries({ queryKey: [INTEGRATION_SYNC_QUERY_KEY] });
            }
          } catch (error) {
            console.error('Error in background sync process:', error);
          }
        }, 100); // Small delay to ensure UI updates first
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