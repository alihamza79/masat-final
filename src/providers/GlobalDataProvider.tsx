import React, { useEffect, useRef } from 'react';
import { useIntegrations } from '@/lib/hooks/useIntegrations';
import { useEmagDataSync } from '@/lib/hooks/useEmagDataSync';
import { useEmagData, INTEGRATIONS_STATUS_QUERY_KEY } from '@/lib/hooks/useEmagData';
import { useIntegrationsStore } from '@/app/(DashboardLayout)/integrations/store/integrations';
import { useEmagDataStore } from '@/app/(DashboardLayout)/integrations/store/emagData';
import { useQuery } from '@tanstack/react-query';

interface GlobalDataProviderProps {
  children: React.ReactNode;
}

export const GlobalDataProvider: React.FC<GlobalDataProviderProps> = ({ children }) => {
  const {
    integrations,
    isLoading: isLoadingIntegrations,
    error: integrationsError,
  } = useIntegrations();

  const {
    syncAllIntegrations
  } = useEmagDataSync();

  // Create the ref at the top level of the component
  const initialSyncDone = useRef(false);
  const { forceRefetch } = useEmagData();
  const { integrations: storeIntegrations } = useIntegrationsStore();
  const { setIntegrationImportStatus, setIntegrationData } = useEmagDataStore();
  
  // Fetch integration statuses
  const { data: integrationsStatus } = useQuery({
    queryKey: [INTEGRATIONS_STATUS_QUERY_KEY],
    refetchInterval: 60000, // Refetch every minute
  });

  // Log errors if they occur
  useEffect(() => {
    if (integrationsError) {
      console.error('Error loading integrations:', integrationsError);
    }
  }, [integrationsError]);

  // Sync React Query integration status data to Zustand store
  useEffect(() => {
    if (integrationsStatus && Array.isArray(integrationsStatus)) {
      // Update the Zustand store with the latest status data
      integrationsStatus.forEach(status => {
        if (status._id) {
          // Update the import status in the Zustand store
          setIntegrationImportStatus(
            status._id, 
            status.importStatus, 
            status.importError || undefined
          );
          
          // Update counts in the Zustand store
          setIntegrationData(status._id, {
            ordersCount: status.ordersCount || 0,
            productOffersCount: status.productOffersCount || 0,
            ordersFetched: true,
            productOffersFetched: true
          });
        }
      });
    }
  }, [integrationsStatus, setIntegrationImportStatus, setIntegrationData]);

  // Sync all integrations on initial load
  useEffect(() => {
    const syncData = async () => {
      if (integrations.length > 0 && !isLoadingIntegrations && !initialSyncDone.current) {
        console.log('Checking if any integrations need data sync...');
        // Default refetch interval is 1 hour (3600000 ms)
        await syncAllIntegrations(integrations as any, 3600000);
        initialSyncDone.current = true;
      }
    };
    
    syncData();
    
    // Set up interval to check for integrations that need to be synced, but less frequently
    const intervalId = setInterval(() => {
      syncData();
    }, 300000); // Check every 5 minutes instead of every minute
    
    return () => clearInterval(intervalId);
  }, [integrations, isLoadingIntegrations, syncAllIntegrations]);

  return <>{children}</>;
}; 