import { useCalculator, initialCategoryData } from '../context/CalculatorContext';
import { useEffect, useState } from 'react';

export type CardKey = 'FBM-NonGenius' | 'FBM-Genius' | 'FBE';

export interface VisibleCards {
  'FBM-NonGenius': boolean;
  'FBM-Genius': boolean;
  'FBE': boolean;
}

const useCalculatorReset = (
  resetSavedCalculation: () => void,
  setSelectedProduct: (value: string) => void
) => {
  // Default visibility state for all cards
  const defaultVisibleCards: VisibleCards = {
    'FBM-NonGenius': true,
    'FBM-Genius': true,
    'FBE': true
  };

  // Local state for card visibility
  const [visibleCards, setVisibleCards] = useState<VisibleCards>(defaultVisibleCards);

  // Listen for calculatorVisibleCardsUpdated event to update visibleCards from loaded calculations
  useEffect(() => {
    const handleVisibleCardsUpdate = (event: CustomEvent) => {
      if (event.detail) {
        setVisibleCards(event.detail);
      }
    };

    // Add event listener
    document.addEventListener('calculatorVisibleCardsUpdated', handleVisibleCardsUpdate as EventListener);

    // Clean up
    return () => {
      document.removeEventListener('calculatorVisibleCardsUpdated', handleVisibleCardsUpdate as EventListener);
    };
  }, []);

  // Get visible card count
  const visibleCardCount = Object.values(visibleCards).filter(Boolean).length;

  const { dispatch } = useCalculator();

  // Function to reset all calculator values
  const resetCalculatorValues = () => {
    // First reset the categories to initial values
    dispatch({ type: 'RESET_CATEGORIES', payload: initialCategoryData });
    
    // Set Trade Profile section values with exact values from initialState
    dispatch({ type: 'SET_VAT_RATE', payload: 19 });
    dispatch({ type: 'SET_TAX_RATE', payload: 3 });
    dispatch({ type: 'SET_PROFILE_TYPE', payload: 'profile' });
    dispatch({ type: 'SET_PURCHASE_TYPE', payload: 'romania' });
    dispatch({ type: 'SET_VAT_RATE_OF_PURCHASE', payload: '19' });
    dispatch({ type: 'SET_SYNC_VALUES', payload: true });
    
    // Set commission values
    dispatch({ type: 'SET_EMAG_COMMISSION', payload: '0' });
    dispatch({ type: 'SET_COMMISSION_SOURCE', payload: 'default' });
    
    // Reset sales estimator
    dispatch({ type: 'RESET_SALES_ESTIMATOR' });
    
    // Set total pieces after resetting other values to ensure it propagates correctly
    dispatch({ type: 'SET_TOTAL_PIECES', payload: 1 });
    
    // Add specific defaults for sales estimator if needed
    dispatch({ 
      type: 'UPDATE_SALES_ESTIMATOR', 
      payload: {
        totalPieces: 1,
        distribution: {
          'FBM-NonGenius': { pieces: 0, percent: 33.33 },
          'FBM-Genius': { pieces: 0, percent: 33.33 },
          'FBE': { pieces: 1, percent: 33.34 },
        },
        sliderValue: [33.33, 66.66]
      }
    });
  };

  // Function to completely reset the calculator state
  const handleNewCalculation = () => {
    // Use the RESET action to fully reset the calculator to initialState
    dispatch({ type: 'RESET' });
    
    // Reset the saved calculation state
    resetSavedCalculation();
    
    // Reset the selected product
    setSelectedProduct('');
    
    // Reset visible cards to default
    setVisibleCards(defaultVisibleCards);
    
    // Set total pieces to 1 (this needs to happen after RESET)
    dispatch({ type: 'SET_TOTAL_PIECES', payload: 1 });
  };

  return {
    visibleCards,
    visibleCardCount,
    resetCalculatorValues,
    handleNewCalculation,
    setVisibleCards
  };
};

export default useCalculatorReset; 