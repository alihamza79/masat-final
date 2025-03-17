import React, { useEffect } from 'react';
import { useIntegrations } from '@/lib/hooks/useIntegrations';
import { useEmagData } from '@/lib/hooks/useEmagData';

interface GlobalDataProviderProps {
  children: React.ReactNode;
}

export const GlobalDataProvider: React.FC<GlobalDataProviderProps> = ({ children }) => {
  // Fetch integrations
  const { 
    isLoading: isLoadingIntegrations, 
    error: integrationsError,
    integrations
  } = useIntegrations();
  
  // Fetch eMAG data (orders and product offers)
  const { 
    isLoading: isLoadingEmagData, 
    error: emagDataError,
    refetchOrders,
    refetchProductOffers
  } = useEmagData();

  // Log errors if they occur
  useEffect(() => {
    if (integrationsError) {
      console.error('Error loading integrations:', integrationsError);
    }
    
    if (emagDataError) {
      console.error('Error loading eMAG data:', emagDataError);
    }
  }, [integrationsError, emagDataError]);

  // Add a new useEffect that only runs on initial load
  useEffect(() => {
    // Only fetch data on initial load
    if (integrations.length > 0 && !isLoadingIntegrations) {
      console.log('Initial data load for integrations');
      refetchOrders();
      refetchProductOffers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingIntegrations]); // Only depend on loading state, not integrations array

  // For now, we'll just render the children
  // In a more complex implementation, you might want to add a loading indicator
  // or error handling UI here
  return <>{children}</>;
}; 