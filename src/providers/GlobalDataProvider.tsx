import React, { useEffect, useRef, useState } from 'react';
import { useIntegrations } from '@/lib/hooks/useIntegrations';
import { useIntegrationSync } from '@/lib/hooks/useIntegrationSync';

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

  // Sync all integrations on initial load
  useEffect(() => {
    const syncData = async () => {
      if (integrations.length > 0 && !isLoadingIntegrations && !initialSyncDone.current) {
        console.log('Checking if any integrations need data sync...');
        try {
          await syncAllIntegrations(integrations as any, 3600000);
          initialSyncDone.current = true;
        } catch (error: any) {
          // Handle network errors gracefully
          console.error('Error during integration sync:', error);
          
          if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
            setSyncErrors(prev => [...prev, `Network error during sync. This is likely due to CORS limitations. Using server-side endpoints instead of direct API calls.`]);
          } else {
            setSyncErrors(prev => [...prev, `Error syncing integrations: ${error.message}`]);
          }
        }
      }
    };
    
    syncData();
    
    // Set up interval to check for integrations that need to be synced periodically
    const intervalId = setInterval(() => {
      syncData();
    }, 300000); // Check every 5 minutes
    
    return () => clearInterval(intervalId);
  }, [integrations, isLoadingIntegrations, syncAllIntegrations]);

  return <>{children}</>;
}; 