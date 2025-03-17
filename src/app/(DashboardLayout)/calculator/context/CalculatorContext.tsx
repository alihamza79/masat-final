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
  | { type: 'RESET' };

const initialState: CalculatorState = {
  totalPieces: 0,
  categories: {
    'FBM-NonGenius': {
      pieces: 0,
      percentage: 33.33,
      salePrice: 0,
      shippingPrice: 0,
      commission: 20,
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
      commission: 20,
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
      commission: 20,
      fulfillmentCost: 0,
      productCost: 0,
      shippingCost: 0,
      fulfillmentShippingCost: 0,
      customsDuty: 0,
      otherExpenses: 0,
    },
  },
  vatRate: 19,
  taxRate: 3,
  profileType: 'profile',
  purchaseType: 'romania',
  vatRateOfPurchase: '19',
  syncValues: true,
  emagCommission: '20',
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
      if (state.syncValues && (
        action.payload.data.productCost !== undefined ||
        action.payload.data.shippingCost !== undefined ||
        action.payload.data.customsDuty !== undefined
      )) {
        // When sync is enabled, update all categories
        return {
          ...state,
          categories: Object.keys(state.categories).reduce((acc, category) => ({
            ...acc,
            [category]: {
              ...state.categories[category],
              ...action.payload.data,
            },
          }), {} as CalculatorState['categories']),
        };
      } else {
        // When sync is disabled or for other fields, update only the specified category
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