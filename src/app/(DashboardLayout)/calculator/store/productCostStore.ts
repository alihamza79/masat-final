import { create } from 'zustand';

export interface ProductCostStore {
  productCostHeaderValues: Record<string, number>;
  setProductCostHeaderValue: (category: string, value: number) => void;
}

export const useProductCostStore = create<ProductCostStore>((set) => ({
  productCostHeaderValues: {
    'FBM-NonGenius': 0,
    'FBM-Genius': 0,
    'FBE': 0
  },
  setProductCostHeaderValue: (category, value) => 
    set((state) => ({
      productCostHeaderValues: {
        ...state.productCostHeaderValues,
        [category]: value
      }
    }))
}));