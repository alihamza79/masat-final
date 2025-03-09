import { create } from 'zustand';
import { Integration } from '@/lib/services/integrationService';

interface IntegrationsState {
  integrations: Integration[];
  setIntegrations: (integrations: Integration[]) => void;
  addIntegration: (integration: Integration) => void;
  updateIntegration: (updatedIntegration: Integration) => void;
  removeIntegration: (integrationId: string) => void;
}

export const useIntegrationsStore = create<IntegrationsState>((set) => ({
  integrations: [],
  setIntegrations: (integrations) => set({ integrations }),
  addIntegration: (integration) => 
    set((state) => ({ 
      integrations: [...state.integrations, integration] 
    })),
  updateIntegration: (updatedIntegration) =>
    set((state) => ({
      integrations: state.integrations.map((integration) =>
        integration._id === updatedIntegration._id ? updatedIntegration : integration
      ),
    })),
  removeIntegration: (integrationId) =>
    set((state) => ({
      integrations: state.integrations.filter(
        (integration) => integration._id !== integrationId
      ),
    })),
})); 