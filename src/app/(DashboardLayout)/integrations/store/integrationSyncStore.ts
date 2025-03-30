import { create } from 'zustand';

export type SyncProgress = {
  ordersProgress: number; // 0-100
  productOffersProgress: number; // 0-100
  totalProgress: number; // Combined progress 0-100
  ordersCount: number;
  productOffersCount: number;
};

type IntegrationSyncState = {
  // Map of integration IDs to their sync status
  syncingIntegrations: Record<string, SyncProgress>;
  
  // Actions
  startSyncing: (integrationId: string) => void;
  updateProgress: (
    integrationId: string, 
    data: Partial<SyncProgress>
  ) => void;
  stopSyncing: (integrationId: string) => void;
  isSyncing: (integrationId: string) => boolean;
  getSyncProgress: (integrationId: string) => SyncProgress | null;
};

const DEFAULT_PROGRESS: SyncProgress = {
  ordersProgress: 0,
  productOffersProgress: 0,
  totalProgress: 0,
  ordersCount: 0,
  productOffersCount: 0
};

export const useIntegrationSyncStore = create<IntegrationSyncState>((set, get) => ({
  syncingIntegrations: {},
  
  startSyncing: (integrationId: string) => 
    set((state) => ({
      syncingIntegrations: {
        ...state.syncingIntegrations,
        [integrationId]: DEFAULT_PROGRESS
      }
    })),
  
  updateProgress: (integrationId: string, data: Partial<SyncProgress>) => 
    set((state) => {
      // Get current progress or default
      const currentProgress = state.syncingIntegrations[integrationId] || DEFAULT_PROGRESS;
      
      // Merge new data with current progress
      const updatedProgress = {
        ...currentProgress,
        ...data,
        // Calculate total progress as average of orders and product offers progress
        totalProgress: data.totalProgress !== undefined 
          ? data.totalProgress 
          : Math.round(
              (
                (data.ordersProgress !== undefined ? data.ordersProgress : currentProgress.ordersProgress) + 
                (data.productOffersProgress !== undefined ? data.productOffersProgress : currentProgress.productOffersProgress)
              ) / 2
            )
      };
      
      return {
        syncingIntegrations: {
          ...state.syncingIntegrations,
          [integrationId]: updatedProgress
        }
      };
    }),
  
  stopSyncing: (integrationId: string) => 
    set((state) => {
      const { [integrationId]: _, ...remaining } = state.syncingIntegrations;
      return { syncingIntegrations: remaining };
    }),
  
  isSyncing: (integrationId: string) => {
    return !!get().syncingIntegrations[integrationId];
  },
  
  getSyncProgress: (integrationId: string) => {
    return get().syncingIntegrations[integrationId] || null;
  }
})); 