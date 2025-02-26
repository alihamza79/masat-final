import { create } from 'zustand';

export interface ProfitStore {
  netProfitValues: Record<string, number>;
  profitMarginValues: Record<string, number>;
  setNetProfitValue: (category: string, value: number) => void;
  setProfitMarginValue: (category: string, value: number) => void;
}

export const useProfitStore = create<ProfitStore>((set) => ({
  netProfitValues: {
    'FBM-NonGenius': 0,
    'FBM-Genius': 0,
    'FBE': 0
  },
  profitMarginValues: {
    'FBM-NonGenius': 0,
    'FBM-Genius': 0,
    'FBE': 0
  },
  setNetProfitValue: (category, value) => 
    set((state) => ({
      netProfitValues: {
        ...state.netProfitValues,
        [category]: value
      }
    })),
  setProfitMarginValue: (category, value) => 
    set((state) => ({
      profitMarginValues: {
        ...state.profitMarginValues,
        [category]: value
      }
    }))
})); 