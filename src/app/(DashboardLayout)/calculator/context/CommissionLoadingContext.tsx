'use client';
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CommissionLoadingContextType {
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
}

const CommissionLoadingContext = createContext<CommissionLoadingContextType | undefined>(undefined);

export const useCommissionLoading = (): CommissionLoadingContextType => {
  const context = useContext(CommissionLoadingContext);
  if (!context) {
    throw new Error('useCommissionLoading must be used within a CommissionLoadingProvider');
  }
  return context;
};

interface CommissionLoadingProviderProps {
  children: ReactNode;
}

export const CommissionLoadingProvider: React.FC<CommissionLoadingProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <CommissionLoadingContext.Provider value={{ isLoading, setIsLoading }}>
      {children}
    </CommissionLoadingContext.Provider>
  );
}; 