import React, { createContext, useContext, useReducer, ReactNode } from 'react';

export interface CategoryData {
  pieces: number;
  percentage: number;
  salePrice: number;
  shippingPrice: number;
  commission: number;
  fulfillmentCost: number;
  productCost: number;
  shippingCost: number;
  fulfillmentShippingCost: number;
  customsDuty: number;
  otherExpenses: number;
  dimensions?: {
    length: number;
    height: number;
    width: number;
    weight: number;
    days: number;
  };
  // Metadata fields to track original values when sync is enabled
  _originalShippingPrice?: number;
  _updatedFrom?: string;
  _isLoadingFromSaved?: boolean; // Flag to indicate when loading from saved calculation
}

export interface CalculatorState {
  totalPieces: number;
  categories: Record<string, CategoryData>;
  vatRate: number;
  taxRate: number;
  profileType: 'profile' | 'vat';
  purchaseType: string;
  vatRateOfPurchase: string;
  syncValues: boolean;
  emagCommission: string;
  commissionSource: 'default' | 'emag' | 'manual'; // Track where the commission value came from
  salesEstimator: {
    totalPieces: number;
    distribution: Record<string, { pieces: number; percent: number }>;
    sliderValue: number[];
  };
}

type Action =
  | { type: 'SET_TOTAL_PIECES'; payload: number }
  | { type: 'UPDATE_CATEGORY'; payload: { category: keyof CalculatorState['categories']; data: Partial<CategoryData> } }
  | { type: 'SET_VAT_RATE'; payload: number }
  | { type: 'SET_TAX_RATE'; payload: number }
  | { type: 'SET_PROFILE_TYPE'; payload: 'profile' | 'vat' }
  | { type: 'SET_PURCHASE_TYPE'; payload: string }
  | { type: 'SET_VAT_RATE_OF_PURCHASE'; payload: string }
  | { type: 'SET_SYNC_VALUES'; payload: boolean }
  | { type: 'SET_EMAG_COMMISSION'; payload: string }
  | { type: 'SET_COMMISSION_SOURCE'; payload: 'default' | 'emag' | 'manual' }
  | { type: 'UPDATE_SALES_ESTIMATOR'; payload: Partial<CalculatorState['salesEstimator']> }
  | { type: 'RESET_CATEGORIES'; payload: Record<string, CategoryData> }
  | { type: 'RESET_SALES_ESTIMATOR' }
  | { type: 'RESET' };

export const initialCategoryData = {
  'FBM-NonGenius': {
    pieces: 0,
    percentage: 33.33,
    salePrice: 0,
    shippingPrice: 0,
    commission: 0,
    fulfillmentCost: 0,
    productCost: 0,
    shippingCost: 0,
    fulfillmentShippingCost: 0,
    customsDuty: 0,
    otherExpenses: 0,
  },
  'FBM-Genius': {
    pieces: 0,
    percentage: 33.33,
    salePrice: 0,
    shippingPrice: 0,
    commission: 0,
    fulfillmentCost: 0,
    productCost: 0,
    shippingCost: 0,
    fulfillmentShippingCost: 0,
    customsDuty: 0,
    otherExpenses: 0,
  },
  'FBE': {
    pieces: 0,
    percentage: 33.34,
    salePrice: 0,
    shippingPrice: 0,
    commission: 0,
    fulfillmentCost: 0,
    productCost: 0,
    shippingCost: 0,
    fulfillmentShippingCost: 0,
    customsDuty: 0,
    otherExpenses: 0,
  },
};

const initialState: CalculatorState = {
  totalPieces: 0,
  categories: initialCategoryData,
  vatRate: 19,
  taxRate: 3,
  profileType: 'profile',
  purchaseType: 'romania',
  vatRateOfPurchase: '19',
  syncValues: true,
  emagCommission: '0',
  commissionSource: 'default', // Default source for the commission value
  salesEstimator: {
    totalPieces: 1,
    distribution: {
      'FBM-NonGenius': { pieces: 0, percent: 33.33 },
      'FBM-Genius': { pieces: 0, percent: 33.33 },
      'FBE': { pieces: 1, percent: 33.34 },
    },
    sliderValue: [33.33, 66.66],
  },
};

function calculatorReducer(state: CalculatorState, action: Action): CalculatorState {
  switch (action.type) {
    case 'SET_TOTAL_PIECES':
      return {
        ...state,
        totalPieces: action.payload,
        categories: Object.entries(state.categories).reduce((acc, [key, category]) => ({
          ...acc,
          [key]: {
            ...category,
            pieces: Math.round((category.percentage / 100) * action.payload),
          },
        }), {} as CalculatorState['categories']),
      };

    case 'UPDATE_CATEGORY':
      // Handle special case for loading saved calculations (where multiple fields are set at once)
      if (action.payload.data._isLoadingFromSaved) {
        // When loading from saved calculation, don't sync - just apply directly to the target category
        const { _isLoadingFromSaved, ...dataWithoutFlag } = action.payload.data;
        return {
          ...state,
          categories: {
            ...state.categories,
            [action.payload.category]: {
              ...state.categories[action.payload.category],
              ...dataWithoutFlag,
            },
          },
        };
      }

      // When sync is enabled, we sync everything except shipping price which only applies to FBM-NonGenius
      if (state.syncValues) {
        // Extract shipping price for special handling
        const { shippingPrice, ...syncableData } = action.payload.data;
        
        // Check if this is a FBM update that should be synced between FBM types only
        const isFBMUpdate = 
          (action.payload.category === 'FBM-NonGenius' || action.payload.category === 'FBM-Genius') && 
          (syncableData.fulfillmentCost !== undefined);
          
        // Check if this is an FBE fulfillment update that should NOT sync to FBM calculators
        const isFBEFulfillmentUpdate = 
          action.payload.category === 'FBE' && 
          syncableData.fulfillmentCost !== undefined;
        
        // Create updated state with synced fields
        const updatedCategories = { ...state.categories };
        
        // If we have fields to sync, do that first
        if (Object.keys(syncableData).length > 0) {
          Object.keys(state.categories).forEach(category => {
            // Skip FBE if this is a FBM-specific fulfillment update
            if (isFBMUpdate && category === 'FBE') {
              return;
            }
            
            // Skip FBM calculators if this is an FBE fulfillment update
            if (isFBEFulfillmentUpdate && 
               (category === 'FBM-NonGenius' || category === 'FBM-Genius')) {
              return;
            }
            
            // For an FBE fulfillment update, we need to create modified syncable data without fulfillment cost
            let dataToSync = syncableData;
            if (isFBEFulfillmentUpdate && category !== 'FBE') {
              // Create a new object without the fulfillmentCost property
              const { fulfillmentCost, ...restData } = syncableData;
              dataToSync = restData;
            }
            
            // Update this category with the synced fields
            updatedCategories[category] = {
              ...updatedCategories[category],
              ...dataToSync,
            };
          });
        }
        
        // Handle shipping price separately (only applies to FBM-NonGenius)
        if (shippingPrice !== undefined) {
          if (action.payload.category === 'FBM-NonGenius') {
            updatedCategories['FBM-NonGenius'] = {
              ...updatedCategories['FBM-NonGenius'],
              shippingPrice,
            };
          }
        }
        
        return {
          ...state,
          categories: updatedCategories,
        };
      } else {
        // When sync is disabled, update only the specified category
        return {
          ...state,
          categories: {
            ...state.categories,
            [action.payload.category]: {
              ...state.categories[action.payload.category],
              ...action.payload.data,
            },
          },
        };
      }

    case 'SET_VAT_RATE':
      return {
        ...state,
        vatRate: action.payload,
      };

    case 'SET_TAX_RATE':
      return {
        ...state,
        taxRate: action.payload,
      };

    case 'SET_PROFILE_TYPE':
      return {
        ...state,
        profileType: action.payload,
      };

    case 'SET_PURCHASE_TYPE':
      return {
        ...state,
        purchaseType: action.payload,
      };

    case 'SET_VAT_RATE_OF_PURCHASE':
      return {
        ...state,
        vatRateOfPurchase: action.payload,
      };

    case 'SET_SYNC_VALUES':
      return {
        ...state,
        syncValues: action.payload,
      };

    case 'SET_EMAG_COMMISSION':
      return {
        ...state,
        emagCommission: action.payload,
      };

    case 'SET_COMMISSION_SOURCE':
      return {
        ...state,
        commissionSource: action.payload,
      };

    case 'UPDATE_SALES_ESTIMATOR':
      // Perform a deep equality check to see if the state actually needs to update
      const currentSalesEstimator = state.salesEstimator;
      const newSalesEstimator = {
        ...currentSalesEstimator,
        ...action.payload
      };
      
      // Check if totalPieces actually changed
      const piecesUnchanged = 
        newSalesEstimator.totalPieces === currentSalesEstimator.totalPieces;
      
      // Check if sliderValue is unchanged (both arrays with same values)
      const sliderUnchanged = 
        (!newSalesEstimator.sliderValue && !currentSalesEstimator.sliderValue) ||
        (Array.isArray(newSalesEstimator.sliderValue) && 
         Array.isArray(currentSalesEstimator.sliderValue) &&
         newSalesEstimator.sliderValue.length === currentSalesEstimator.sliderValue.length &&
         newSalesEstimator.sliderValue.every((val, idx) => 
           Math.abs(val - currentSalesEstimator.sliderValue[idx]) < 0.001
         ));
      
      // Check if distribution is unchanged
      const distributionUnchanged = 
        (!newSalesEstimator.distribution && !currentSalesEstimator.distribution) ||
        (JSON.stringify(newSalesEstimator.distribution) === 
         JSON.stringify(currentSalesEstimator.distribution));
      
      // If nothing changed, return the same state to prevent unnecessary renders
      if (piecesUnchanged && sliderUnchanged && distributionUnchanged) {
        return state;
      }
      
      // Otherwise update with the new values
      return {
        ...state,
        salesEstimator: newSalesEstimator
      };

    case 'RESET_CATEGORIES':
      return {
        ...state,
        categories: action.payload
      };
      
    case 'RESET_SALES_ESTIMATOR':
      return {
        ...state,
        salesEstimator: initialState.salesEstimator
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

const CalculatorContext = createContext<{
  state: CalculatorState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function CalculatorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(calculatorReducer, initialState);

  return (
    <CalculatorContext.Provider value={{ state, dispatch }}>
      {children}
    </CalculatorContext.Provider>
  );
}

export function useCalculator() {
  const context = useContext(CalculatorContext);
  if (!context) {
    throw new Error('useCalculator must be used within a CalculatorProvider');
  }
  return context;
}

export function useCalculations() {
  const { state } = useCalculator();

  const calculateVAT = (price: number) => (price * state.vatRate) / 100;
  const calculateCommission = (category: CategoryData, totalPrice: number) => 
    (totalPrice * category.commission) / 100;

  const calculations = Object.entries(state.categories).reduce((acc, [key, category]) => {
    const basePrice = category.salePrice;
    const totalPrice = basePrice + category.shippingPrice;
    const vat = calculateVAT(totalPrice);
    const commission = calculateCommission(category, totalPrice);
    const totalCosts = category.productCost + category.shippingCost + 
      category.fulfillmentCost + (category.productCost * category.customsDuty / 100);
    
    // Calculate VAT on costs
    const vatOnCosts = calculateVAT(totalCosts);
    const customsVAT = (category.productCost + (category.productCost * category.customsDuty / 100)) * state.vatRate / 100;
    
    const grossProfit = state.profileType === 'vat' 
      ? totalPrice + vat - totalCosts - vatOnCosts - commission
      : totalPrice - totalCosts - commission;
    
    const tax = (grossProfit * state.taxRate) / 100;
    
    // For VAT profile, calculate VAT to be paid
    const vatToBePaid = state.profileType === 'vat'
      ? vat - vatOnCosts - customsVAT
      : 0;
    
    const netProfit = state.profileType === 'vat'
      ? grossProfit - tax - vatToBePaid
      : grossProfit - tax;
    
    const marginProfit = totalPrice > 0 ? (netProfit / totalPrice) * 100 : 0;
    const roi = totalCosts > 0 ? (netProfit / totalCosts) * 100 : 0;

    return {
      ...acc,
      [key]: {
        revenue: totalPrice,
        revenueWithVAT: totalPrice + vat,
        vat,
        commission,
        commissionWithVAT: commission + calculateVAT(commission),
        totalCosts,
        totalCostsWithVAT: totalCosts + vatOnCosts,
        grossProfit,
        tax,
        vatToBePaid,
        netProfit,
        marginProfit,
        roi,
        taxRate: state.taxRate,
        vatRate: state.vatRate,
        customsVAT
      },
    };
  }, {} as Record<keyof CalculatorState['categories'], {
    revenue: number;
    revenueWithVAT: number;
    vat: number;
    commission: number;
    commissionWithVAT: number;
    totalCosts: number;
    totalCostsWithVAT: number;
    grossProfit: number;
    tax: number;
    vatToBePaid: number;
    netProfit: number;
    marginProfit: number;
    roi: number;
    taxRate: number;
    vatRate: number;
    customsVAT: number;
  }>);

  const totals = Object.values(calculations).reduce((acc, curr) => ({
    revenue: acc.revenue + curr.revenue,
    vat: acc.vat + curr.vat,
    commission: acc.commission + curr.commission,
    totalCosts: acc.totalCosts + curr.totalCosts,
    grossProfit: acc.grossProfit + curr.grossProfit,
    tax: acc.tax + curr.tax,
    netProfit: acc.netProfit + curr.netProfit,
  }), {
    revenue: 0,
    vat: 0,
    commission: 0,
    totalCosts: 0,
    grossProfit: 0,
    tax: 0,
    netProfit: 0,
  });

  return { categoryCalculations: calculations, totals };
} 