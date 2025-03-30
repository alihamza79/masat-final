import React, { useEffect, useRef, useState } from 'react';
import { useIntegrations } from '@/lib/hooks/useIntegrations';
import { useIntegrationSync } from '@/lib/hooks/useIntegrationSync';
import { useQuery } from '@tanstack/react-query';

interface GlobalDataProviderProps {
  children: React.ReactNode;
}

// Define a query key for integration sync
const INTEGRATION_SYNC_QUERY_KEY = 'integration-sync';

// Sync check interval (every 1 minute)
const SYNC_CHECK_INTERVAL = 60 * 1000;

export const GlobalDataProvider: React.FC<GlobalDataProviderProps> = ({ children }) => {
  const {
    integrations,
    isLoading: isLoadingIntegrations,
    error: integrationsError,
  } = useIntegrations();

  const {
    syncAllIntegrations
  } = useIntegrationSync();

  // Create the ref at the top level of the component
  const initialSyncDone = useRef(false);
  const [syncErrors, setSyncErrors] = useState<string[]>([]);

  // Log errors if they occur
  useEffect(() => {
    if (integrationsError) {
      console.error('Error loading integrations:', integrationsError);
    }
  }, [integrationsError]);

  // Monitor sync errors
  useEffect(() => {
    if (syncErrors.length > 0) {
      console.error('Integration sync errors:', syncErrors);
    }
  }, [syncErrors]);

  // Use React Query for periodic sync checks
  useQuery({
    queryKey: [INTEGRATION_SYNC_QUERY_KEY],
    queryFn: async () => {
      // Don't run if there are no integrations or they're still loading
      if (integrations.length === 0 || isLoadingIntegrations) {
        return null;
      }
      
      // For initial sync, we want to do a full sync
      if (!initialSyncDone.current) {
        console.log('Performing initial data sync for all integrations...');
        try {
          await syncAllIntegrations(integrations as any, 3600000);
          initialSyncDone.current = true;
        } catch (error: any) {
          // Handle network errors gracefully
          console.error('Error during initial integration sync:', error);
          
          if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
            setSyncErrors(prev => [...prev, `Network error during sync. This is likely due to CORS limitations. Using server-side endpoints instead of direct API calls.`]);
          } else {
            setSyncErrors(prev => [...prev, `Error syncing integrations: ${error.message}`]);
          }
        }
      } 
      // For periodic checks, check based on the sync intervals
      else {
        console.log('Checking for integrations that need periodic sync...');
        try {
          // Use a smaller interval for periodic checks (5 minutes for orders)
          await syncAllIntegrations(integrations as any, 300000); // 5 minutes
        } catch (error: any) {
          console.error('Error during periodic integration sync:', error);
          setSyncErrors(prev => [...prev, `Error in periodic sync: ${error.message}`]);
        }
      }
      
      return null; // Return value is not used, but required by React Query
    },
    // Only run this query if we have integrations and they're not loading
    enabled: integrations.length > 0 && !isLoadingIntegrations,
    // Configure automatic refetching
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchInterval: SYNC_CHECK_INTERVAL,
    refetchIntervalInBackground: false,
    // Don't retry on error
    retry: false
  });

  return <>{children}</>;
}; 