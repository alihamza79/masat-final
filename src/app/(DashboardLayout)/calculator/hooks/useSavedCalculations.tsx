import { useState, useEffect } from 'react';
import { useCalculator } from '../context/CalculatorContext';
import { useTranslation } from 'react-i18next';

// Define the SavedCalculation interface
export interface SavedCalculation {
  _id: string;
  title: string;
  description: string;
  image: string;
  calculatorState: any;
  createdAt: string;
}

export const useSavedCalculations = () => {
  const { t } = useTranslation();
  const { state, dispatch } = useCalculator();
  
  // State for saved calculations
  const [savedCalculations, setSavedCalculations] = useState<SavedCalculation[]>([]);
  const [loadingSavedCalculations, setLoadingSavedCalculations] = useState(false);
  const [savedCalculationsError, setSavedCalculationsError] = useState<string | null>(null);
  
  // State for the current saved calculation
  const [currentSavedCalculationId, setCurrentSavedCalculationId] = useState<string | null>(null);
  const [currentSavedCalculationTitle, setCurrentSavedCalculationTitle] = useState<string>('');
  const [currentSavedCalculationDescription, setCurrentSavedCalculationDescription] = useState<string>('');
  
  // State for the save modal
  const [openSaveModal, setOpenSaveModal] = useState(false);
  
  // Fetch saved calculations when the component mounts
  useEffect(() => {
    fetchSavedCalculations();
  }, []);
  
  // Function to fetch saved calculations
  const fetchSavedCalculations = async () => {
    setLoadingSavedCalculations(true);
    setSavedCalculationsError(null);
    
    try {
      const response = await fetch('/api/calculations');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch saved calculations');
      }
      
      setSavedCalculations(result.data);
    } catch (err) {
      console.error('Error fetching saved calculations:', err);
      setSavedCalculationsError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoadingSavedCalculations(false);
    }
  };
  
  // Function to handle successful save
  const handleSaveSuccess = () => {
    // Refresh the saved calculations
    fetchSavedCalculations();
  };
  
  // Function to load a saved calculation
  const loadSavedCalculation = async (calculationId: string) => {
    setCurrentSavedCalculationId(calculationId);
    
    try {
      // Find the calculation in the already loaded savedCalculations
      const savedCalculation = savedCalculations.find(calc => calc._id === calculationId);
      
      if (savedCalculation) {
        // Use the already loaded calculation data
        setCurrentSavedCalculationTitle(savedCalculation.title || '');
        setCurrentSavedCalculationDescription(savedCalculation.description || '');
        
        // Load the saved calculator state
        if (savedCalculation.calculatorState) {
          // Replace the current state with the saved state
          Object.entries(savedCalculation.calculatorState).forEach(([key, value]) => {
            if (key === 'categories') {
              Object.entries(value as Record<string, any>).forEach(([category, categoryData]) => {
                dispatch({
                  type: 'UPDATE_CATEGORY',
                  payload: {
                    category: category as any,
                    data: {
                      ...categoryData as any,
                      _isLoadingFromSaved: true
                    }
                  }
                });
              });
            } else if (key === 'totalPieces') {
              dispatch({ type: 'SET_TOTAL_PIECES', payload: value as number });
            } else if (key === 'vatRate') {
              dispatch({ type: 'SET_VAT_RATE', payload: value as number });
            } else if (key === 'taxRate') {
              dispatch({ type: 'SET_TAX_RATE', payload: value as number });
            } else if (key === 'profileType') {
              dispatch({ type: 'SET_PROFILE_TYPE', payload: value as 'profile' | 'vat' });
            } else if (key === 'purchaseType') {
              dispatch({ type: 'SET_PURCHASE_TYPE', payload: value as string });
            } else if (key === 'vatRateOfPurchase') {
              dispatch({ type: 'SET_VAT_RATE_OF_PURCHASE', payload: value as string });
            } else if (key === 'syncValues') {
              dispatch({ type: 'SET_SYNC_VALUES', payload: value as boolean });
            } else if (key === 'emagCommission') {
              dispatch({ type: 'SET_EMAG_COMMISSION', payload: value as string });
            } else if (key === 'salesEstimator') {
              dispatch({ type: 'UPDATE_SALES_ESTIMATOR', payload: value as any });
            }
          });
        }
      } else {
        // If not found in the preloaded data, fetch it from the API
        const response = await fetch(`/api/calculations/${calculationId}`);
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.message || 'Failed to load saved calculation');
        }
        
        // Store the title and description for later use
        if (result.data) {
          setCurrentSavedCalculationTitle(result.data.title || '');
          setCurrentSavedCalculationDescription(result.data.description || '');
        }
        
        // Load the saved calculator state
        if (result.data && result.data.calculatorState) {
          // Replace the current state with the saved state
          Object.entries(result.data.calculatorState).forEach(([key, value]) => {
            if (key === 'categories') {
              Object.entries(value as Record<string, any>).forEach(([category, categoryData]) => {
                dispatch({
                  type: 'UPDATE_CATEGORY',
                  payload: {
                    category: category as any,
                    data: {
                      ...categoryData as any,
                      _isLoadingFromSaved: true
                    }
                  }
                });
              });
            } else if (key === 'totalPieces') {
              dispatch({ type: 'SET_TOTAL_PIECES', payload: value as number });
            } else if (key === 'taxRate') {
              dispatch({ type: 'SET_TAX_RATE', payload: value as number });
            } else if (key === 'vatRate') {
              dispatch({ type: 'SET_VAT_RATE', payload: value as number });
            } else if (key === 'profileType') {
              dispatch({ type: 'SET_PROFILE_TYPE', payload: value as 'profile' | 'vat' });
            } else if (key === 'purchaseType') {
              dispatch({ type: 'SET_PURCHASE_TYPE', payload: value as string });
            } else if (key === 'vatRateOfPurchase') {
              dispatch({ type: 'SET_VAT_RATE_OF_PURCHASE', payload: value as string });
            } else if (key === 'syncValues') {
              dispatch({ type: 'SET_SYNC_VALUES', payload: value as boolean });
            } else if (key === 'emagCommission') {
              dispatch({ type: 'SET_EMAG_COMMISSION', payload: value as string });
            } else if (key === 'salesEstimator') {
              dispatch({ type: 'UPDATE_SALES_ESTIMATOR', payload: value as any });
            }
          });
        }
      }
    } catch (error) {
      console.error('Error loading saved calculation:', error);
      // You could add a toast notification here
    }
  };
  
  // Function to reset saved calculation state
  const resetSavedCalculation = () => {
    setCurrentSavedCalculationId(null);
    setCurrentSavedCalculationTitle('');
    setCurrentSavedCalculationDescription('');
  };
  
  return {
    // State
    savedCalculations,
    loadingSavedCalculations,
    savedCalculationsError,
    currentSavedCalculationId,
    currentSavedCalculationTitle,
    currentSavedCalculationDescription,
    openSaveModal,
    
    // Functions
    fetchSavedCalculations,
    handleSaveSuccess,
    loadSavedCalculation,
    resetSavedCalculation,
    setOpenSaveModal,
    setCurrentSavedCalculationId,
    setCurrentSavedCalculationTitle,
    setCurrentSavedCalculationDescription
  };
};

export default useSavedCalculations; 