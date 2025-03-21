import { useCalculator } from '../context/CalculatorContext';
import { useState, Dispatch, SetStateAction } from 'react';
import { CategoryData } from '../context/CalculatorContext';

export type CardKey = 'FBM-NonGenius' | 'FBM-Genius' | 'FBE';
export type VisibleCards = Record<CardKey, boolean>;

export const useCalculatorReset = (
  resetSavedCalculation: () => void,
  setSelectedProduct: (value: string) => void
) => {
  const { state, dispatch } = useCalculator();
  
  // State for visible cards
  const [visibleCards, setVisibleCardsState] = useState<VisibleCards>({
    'FBM-NonGenius': true,
    'FBM-Genius': true,
    'FBE': true
  });

  // Function to reset calculator values
  const resetCalculatorValues = () => {
    // Reset all categories
    Object.keys(state.categories).forEach((category) => {
      dispatch({
        type: 'UPDATE_CATEGORY',
        payload: {
          category: category as keyof typeof state.categories,
          data: {
            salePrice: 0,
            productCost: 0,
            commission: 0,
            shippingCost: 0,
            shippingPrice: 0,
            fulfillmentCost: 0,
            fulfillmentShippingCost: 0,
            customsDuty: 0,
            otherExpenses: 0,
            pieces: 0,
            percentage: 0
          }
        },
      });
    });
    
    // Reset other values
    dispatch({ type: 'SET_TOTAL_PIECES', payload: 1 });
    dispatch({ type: 'SET_EMAG_COMMISSION', payload: '0' });
    
    // Explicitly reset the SalesEstimator to default values
    dispatch({ 
      type: 'UPDATE_SALES_ESTIMATOR', 
      payload: {
        totalPieces: 1,
        distribution: {
          'FBM-NonGenius': { pieces: 0, percent: 33.33 },
          'FBM-Genius': { pieces: 0, percent: 33.33 },
          'FBE': { pieces: 1, percent: 33.34 },
        },
        sliderValue: [33.33, 66.66],
      }
    });
  };

  // Function to handle new calculation (reset everything)
  const handleNewCalculation = () => {
    // Reset selected product
    setSelectedProduct('');
    
    // Reset calculator values
    resetCalculatorValues();
    
    // Reset current saved calculation ID and details
    resetSavedCalculation();
    
    // Reset to default visible cards
    setVisibleCardsState({
      'FBM-NonGenius': true,
      'FBM-Genius': true,
      'FBE': true
    });
    
    // Reset other values to defaults
    dispatch({ type: 'SET_VAT_RATE', payload: 19 });
    dispatch({ type: 'SET_TAX_RATE', payload: 1 });
    dispatch({ type: 'SET_PROFILE_TYPE', payload: 'profile' });
    dispatch({ type: 'SET_PURCHASE_TYPE', payload: 'romania' });
    dispatch({ type: 'SET_VAT_RATE_OF_PURCHASE', payload: '19' });
    dispatch({ type: 'SET_SYNC_VALUES', payload: true });
    dispatch({ type: 'SET_EMAG_COMMISSION', payload: '0' });
    
    // Force a complete reset using the RESET action 
    // This ensures all state is reset to initial values
    dispatch({ type: 'RESET' });
  };

  // Type-safe function to update visible cards
  const setVisibleCards = (newVisibleCards: VisibleCards | ((prev: VisibleCards) => VisibleCards)) => {
    setVisibleCardsState(newVisibleCards);
  };

  return {
    visibleCards,
    resetCalculatorValues,
    handleNewCalculation,
    setVisibleCards
  };
};

export default useCalculatorReset; 