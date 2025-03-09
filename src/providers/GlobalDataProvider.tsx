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

  // Refetch eMAG orders when integrations change
  useEffect(() => {
    if (integrations.length > 0 && !isLoadingIntegrations) {
      refetchOrders();
    }
  }, [integrations, isLoadingIntegrations, refetchOrders]);

  // Refetch eMAG product offers when integrations change
  useEffect(() => {
    if (integrations.length > 0 && !isLoadingIntegrations) {
      refetchProductOffers();
    }
  }, [integrations, isLoadingIntegrations, refetchProductOffers]);

  // For now, we'll just render the children
  // In a more complex implementation, you might want to add a loading indicator
  // or error handling UI here
  return <>{children}</>;
}; 