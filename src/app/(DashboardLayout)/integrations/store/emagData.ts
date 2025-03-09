import { create } from 'zustand';
import { EmagOrder, EmagProductOffer } from '@/lib/services/emagApiService';

export type ImportStatus = 'idle' | 'loading' | 'success' | 'error';

export interface IntegrationData {
  integrationId: string;
  orders: EmagOrder[];
  productOffers: EmagProductOffer[];
  ordersCount: number;
  productOffersCount: number;
  importStatus: ImportStatus;
  lastUpdated: string | null;
  error?: string;
  ordersFetched: boolean;
  productOffersFetched: boolean;
}

interface EmagDataState {
  integrationsData: Record<string, IntegrationData>;
  
  // Actions
  setIntegrationData: (integrationId: string, data: Partial<IntegrationData>) => void;
  setIntegrationSummary: (
    integrationId: string, 
    orders: EmagOrder[], 
    productOffers: EmagProductOffer[],
    ordersCount: number, 
    productOffersCount: number
  ) => void;
  setIntegrationImportStatus: (integrationId: string, status: ImportStatus, error?: string) => void;
  removeIntegrationData: (integrationId: string) => void;
  resetIntegrationsData: () => void;
}

// Helper to create initial integration data structure
const createInitialIntegrationData = (integrationId: string): IntegrationData => ({
  integrationId,
  orders: [],
  productOffers: [],
  ordersCount: 0,
  productOffersCount: 0,
  importStatus: 'idle',
  lastUpdated: null,
  ordersFetched: false,
  productOffersFetched: false
});

export const useEmagDataStore = create<EmagDataState>((set) => ({
  integrationsData: {},
  
  setIntegrationData: (integrationId, data) => 
    set((state) => {
      const currentData = state.integrationsData[integrationId] || createInitialIntegrationData(integrationId);
      return {
        integrationsData: {
          ...state.integrationsData,
          [integrationId]: {
            ...currentData,
            ...data,
            lastUpdated: data.lastUpdated || new Date().toISOString()
          }
        }
      };
    }),
  
  setIntegrationSummary: (integrationId, orders, productOffers, ordersCount, productOffersCount) => 
    set((state) => {
      const currentData = state.integrationsData[integrationId] || createInitialIntegrationData(integrationId);
      return {
        integrationsData: {
          ...state.integrationsData,
          [integrationId]: {
            ...currentData,
            orders,
            productOffers,
            ordersCount,
            productOffersCount,
            lastUpdated: new Date().toISOString()
          }
        }
      };
    }),
  
  setIntegrationImportStatus: (integrationId, importStatus, error) => 
    set((state) => {
      const currentData = state.integrationsData[integrationId] || createInitialIntegrationData(integrationId);
      if (currentData.importStatus === importStatus && currentData.error === error) {
        return {};
      }
      return {
        integrationsData: {
          ...state.integrationsData,
          [integrationId]: {
            ...currentData,
            importStatus,
            error,
            lastUpdated: new Date().toISOString()
          }
        }
      };
    }),
  
  removeIntegrationData: (integrationId) =>
    set((state) => {
      const newData = { ...state.integrationsData };
      delete newData[integrationId];
      return { integrationsData: newData };
    }),
  
  resetIntegrationsData: () => set({ integrationsData: {} })
})); 