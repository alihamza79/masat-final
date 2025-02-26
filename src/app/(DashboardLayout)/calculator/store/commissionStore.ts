import { create } from 'zustand';

export interface CommissionStore {
  commissionHeaderValues: Record<string, number>;
  setCommissionHeaderValue: (category: string, value: number) => void;
}

export const useCommissionStore = create<CommissionStore>((set) => ({
  commissionHeaderValues: {
    'FBM-NonGenius': 0,
    'FBM-Genius': 0,
    'FBE': 0
  },
  setCommissionHeaderValue: (category, value) => 
    set((state) => ({
      commissionHeaderValues: {
        ...state.commissionHeaderValues,
        [category]: value
      }
    }))
})); 