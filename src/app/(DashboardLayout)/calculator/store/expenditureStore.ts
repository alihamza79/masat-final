import { create } from 'zustand';

export interface ExpenditureStore {
  expenditureHeaderValues: Record<string, number>;
  setExpenditureHeaderValue: (category: string, value: number) => void;
}

export const useExpenditureStore = create<ExpenditureStore>((set) => ({
  expenditureHeaderValues: {
    'FBM-NonGenius': 0,
    'FBM-Genius': 0,
    'FBE': 0
  },
  setExpenditureHeaderValue: (category, value) => 
    set((state) => ({
      expenditureHeaderValues: {
        ...state.expenditureHeaderValues,
        [category]: value
      }
    }))
})); 