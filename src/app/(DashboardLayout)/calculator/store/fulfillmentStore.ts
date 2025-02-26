import { create } from 'zustand';

export interface FulfillmentStore {
  fulfillmentHeaderValues: Record<string, number>;
  setFulfillmentHeaderValue: (category: string, value: number) => void;
}

export const useFulfillmentStore = create<FulfillmentStore>((set) => ({
  fulfillmentHeaderValues: {
    'FBM-NonGenius': 0,
    'FBM-Genius': 0,
    'FBE': 0
  },
  setFulfillmentHeaderValue: (category, value) => 
    set((state) => ({
      fulfillmentHeaderValues: {
        ...state.fulfillmentHeaderValues,
        [category]: value
      }
    }))
})); 