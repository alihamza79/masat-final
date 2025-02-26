import { create } from 'zustand';

export interface TaxValues {
  incomeTax: number;
  vatToBePaid: number;
}

export interface TaxStore {
  taxValues: Record<string, TaxValues>;
  setTaxValues: (category: string, values: TaxValues) => void;
}

export const useTaxStore = create<TaxStore>((set) => ({
  taxValues: {
    'FBM-NonGenius': { incomeTax: 0, vatToBePaid: 0 },
    'FBM-Genius': { incomeTax: 0, vatToBePaid: 0 },
    'FBE': { incomeTax: 0, vatToBePaid: 0 }
  },
  setTaxValues: (category, values) => 
    set((state) => ({
      taxValues: {
        ...state.taxValues,
        [category]: values
      }
    }))
})); 