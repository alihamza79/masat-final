import { create } from 'zustand';

export interface SalesStore {
  salesHeaderValues: Record<string, number>;
  setSalesHeaderValue: (category: string, value: number) => void;
}

export const useSalesStore = create<SalesStore>((set) => ({
  salesHeaderValues: {
    'FBM-NonGenius': 0,
    'FBM-Genius': 0,
    'FBE': 0
  },
  setSalesHeaderValue: (category, value) => 
    set((state) => ({
      salesHeaderValues: {
        ...state.salesHeaderValues,
        [category]: value
      }
    }))
}));