import { useState, useEffect, useRef } from 'react';
import { useSalesStore, SalesStore } from '../store/salesStore';
import { useCommissionStore, CommissionStore } from '../store/commissionStore';
import { useFulfillmentStore, FulfillmentStore } from '../store/fulfillmentStore';
import { useExpenditureStore, ExpenditureStore } from '../store/expenditureStore';
import { useProductCostStore, ProductCostStore } from '../store/productCostStore';
import { useTaxStore, TaxStore } from '../store/taxStore';
import { useProfitStore, ProfitStore } from '../store/profitStore';
import { VisibleCards } from './useCalculatorReset';
import { useCalculator } from '../context/CalculatorContext';

export type CalculatorType = 'FBM-NonGenius' | 'FBM-Genius' | 'FBE';
export type Distribution = {
  pieces: number;
  percent: number;
};
export type Distributions = Record<CalculatorType, Distribution>;

export interface ExpenseHeaderValues {
  commission: number;
  fulfillment: number;
  expenditures: number;
  productCost: number;
  taxes: number;
  vatToBePaid: number;
}

export const useSalesEstimatorCalculations = (
  onDistributionChange: (distributions: Record<string, { pieces: number; percent: number }>) => void,
  visibleCards: VisibleCards = { 'FBM-NonGenius': true, 'FBM-Genius': true, 'FBE': true }
) => {
  const { state } = useCalculator();
  
  // Create refs to track initialization and the last values to avoid unnecessary updates
  const initializedFromSaved = useRef(false);
  const visibleCardsRef = useRef(visibleCards);
  const firstRender = useRef(true);
  const lastStateRef = useRef<{
    salesEstimator?: any;
    timestamp: number;
  }>({ timestamp: 0 });
  const loadingFromContextRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize state from context, defaulting if not available
  const [totalPieces, setTotalPieces] = useState<number>(() => {
    return state.salesEstimator?.totalPieces || 1;
  });
  
  const [sliderValue, setSliderValue] = useState<number[]>(() => {
    return state.salesEstimator?.sliderValue || [33.33, 66.66];
  });
  
  const [manualPieces, setManualPieces] = useState<Record<CalculatorType, number>>({
    'FBM-NonGenius': 0,
    'FBM-Genius': 0,
    'FBE': 1
  });

  // Helper function to safely update state with debounce
  const updateStateFromContext = (contextData: any) => {
    // Cancel any pending update
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // Set flag to indicate we're loading from context
    loadingFromContextRef.current = true;
    
    // Debounce the update to prevent immediate re-renders
    timerRef.current = setTimeout(() => {
      setTotalPieces(contextData.totalPieces || 1);
      setSliderValue(contextData.sliderValue || [33.33, 66.66]);
      
      // Clear the loading flag after a short delay
      setTimeout(() => {
        loadingFromContextRef.current = false;
      }, 50);
    }, 50);
  };

  // Add effect to initialize/update from context when it changes (for loading saved calculations)
  useEffect(() => {
    // Skip if we're currently updating from context to avoid loops
    if (loadingFromContextRef.current) return;
    
    // Skip if no salesEstimator data in state
    if (!state.salesEstimator) return;
    
    // Check if state has changed meaningfully
    const currentTimestamp = Date.now();
    const lastState = lastStateRef.current;
    const timeSinceLastUpdate = currentTimestamp - lastState.timestamp;
    
    // Check if the state has actually changed
    const stateHasChanged = 
      lastState.timestamp === 0 || // First time
      JSON.stringify(lastState.salesEstimator) !== JSON.stringify(state.salesEstimator); // Actual change
    
    // Only update if state has changed and enough time has passed
    if (stateHasChanged && timeSinceLastUpdate > 100) {
      // Update our reference to the current state
      lastStateRef.current = {
        salesEstimator: JSON.parse(JSON.stringify(state.salesEstimator)),
        timestamp: currentTimestamp
      };
      
      // Update the state with the new values from context
      updateStateFromContext(state.salesEstimator);
      
      // Mark as initialized
      initializedFromSaved.current = true;
    }
  }, [state.salesEstimator]);

  // Cleanup effect for the timer ref
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Calculate distributions based on pieces, percentages, and visible cards
  const calculateDistributions = (pieces: number, percentages: number[]): Distributions => {
    // Get array of visible calculator types
    const visibleTypes = (Object.entries(visibleCards) as [CalculatorType, boolean][])
      .filter(([_, isVisible]) => isVisible)
      .map(([type]) => type)
      .sort(); // Sort to maintain consistent order
    
    const newDistributions: Distributions = {
      'FBM-NonGenius': { pieces: 0, percent: 0 },
      'FBM-Genius': { pieces: 0, percent: 0 },
      'FBE': { pieces: 0, percent: 0 }
    };

    // Only one visible calculator - all pieces go to that calculator
    if (visibleTypes.length === 1) {
      newDistributions[visibleTypes[0]] = { pieces, percent: 100 };
      return newDistributions;
    }
    
    // Two visible calculators
    if (visibleTypes.length === 2) {
      let firstPercentage, secondPercentage;
      
      if (visibleTypes[0] === 'FBM-NonGenius') {
        // If FBM-NonGenius is the first calculator, use percentages[0]
        firstPercentage = percentages[0];
        secondPercentage = 100 - firstPercentage;
      } else if (visibleTypes[0] === 'FBM-Genius' && visibleTypes[1] === 'FBE') {
        // If FBM-Genius and FBE are visible, use percentages[1]
        firstPercentage = percentages[1];
        secondPercentage = 100 - firstPercentage;
      } else {
        // Fallback for any other combination
        firstPercentage = percentages[0];
        secondPercentage = 100 - firstPercentage;
      }
      
      const firstPieces = Math.floor((firstPercentage / 100) * pieces);
      const secondPieces = pieces - firstPieces;
      
      newDistributions[visibleTypes[0]] = { pieces: firstPieces, percent: firstPercentage };
      newDistributions[visibleTypes[1]] = { pieces: secondPieces, percent: secondPercentage };
      
      return newDistributions;
    }
    
    // Three visible calculators
    if (percentages.length >= 2) {
      const firstPercentage = percentages[0];
      const secondPercentage = percentages[1] - percentages[0];
      const thirdPercentage = 100 - percentages[1];
      
      const firstPieces = Math.floor((firstPercentage / 100) * pieces);
      const secondPieces = Math.floor((secondPercentage / 100) * pieces);
      const thirdPieces = pieces - firstPieces - secondPieces;
      
      newDistributions['FBM-NonGenius'] = { pieces: firstPieces, percent: firstPercentage };
      newDistributions['FBM-Genius'] = { pieces: secondPieces, percent: secondPercentage };
      newDistributions['FBE'] = { pieces: thirdPieces, percent: thirdPercentage };
    }
    
    return newDistributions;
  };

  // Get current distributions
  const distributions = calculateDistributions(totalPieces, sliderValue);

  // Add effect to update slider values when visibleCards change
  useEffect(() => {
    // Skip if we're currently loading from context
    if (loadingFromContextRef.current) return;
    
    // Skip the first render since we already initialize with proper values
    if (firstRender.current) {
      firstRender.current = false;
      
      // Initial call to ensure distribution is set properly
      // This ensures we have proper values even for saved calculations
      if (state.salesEstimator?.distribution) {
        // If saved data exists, notify parent of the loaded distribution
        onDistributionChange(state.salesEstimator.distribution);
      } else {
        // Otherwise calculate a new distribution
        onDistributionChange(calculateDistributions(totalPieces, sliderValue));
      }
      return;
    }

    // Check if visibleCards has actually changed to avoid unnecessary updates
    if (JSON.stringify(visibleCards) === JSON.stringify(visibleCardsRef.current)) {
      return;
    }
    
    // Update the ref with the new value
    visibleCardsRef.current = visibleCards;

    // Get array of visible calculator types
    const visibleTypes = (Object.entries(visibleCards) as [CalculatorType, boolean][])
      .filter(([_, isVisible]) => isVisible)
      .map(([type]) => type);

    // Only one visible calculator - no slider needed
    if (visibleTypes.length <= 1) {
      // When only one calculator is visible, all pieces go to that calculator
      if (visibleTypes.length === 1) {
        const newDistributions = calculateDistributions(totalPieces, [100]); 
        onDistributionChange(newDistributions);
      }
      return;
    }

    // Two visible calculators - adjust slider to show only one point
    if (visibleTypes.length === 2) {
      // Sort visible types to maintain consistent order
      visibleTypes.sort();
      
      // Reset the distribution to an equal split between the two visible calculators
      const firstPercentage = 50;
      
      // Use the percentages array we created above to calculate new slider value
      let newSliderValue: number[];
      
      if (visibleTypes[0] === 'FBM-NonGenius' && visibleTypes[1] === 'FBM-Genius') {
        newSliderValue = [firstPercentage, 100]; // FBM-NonGenius and FBM-Genius
      } else if (visibleTypes[0] === 'FBM-NonGenius' && visibleTypes[1] === 'FBE') {
        newSliderValue = [firstPercentage, 100]; // FBM-NonGenius and FBE
      } else if (visibleTypes[0] === 'FBM-Genius' && visibleTypes[1] === 'FBE') {
        newSliderValue = [0, firstPercentage]; // FBM-Genius and FBE
      } else {
        // Fallback for any other unexpected combination
        newSliderValue = [firstPercentage, 100];
      }
      
      // Set the slider value first
      setSliderValue(newSliderValue);
      
      // Wait for the next render to update distributions
      setTimeout(() => {
        // Calculate new distributions based on the percentages
        const newDistributions = calculateDistributions(totalPieces, newSliderValue);
        onDistributionChange(newDistributions);
      }, 0);
    }
    
    // Three visible calculators - reset to default three-way split
    if (visibleTypes.length === 3) {
      const newSliderValue = [33.33, 66.66];
      setSliderValue(newSliderValue);
      
      // Calculate new distributions based on the percentages
      const newDistributions = calculateDistributions(totalPieces, newSliderValue);
      onDistributionChange(newDistributions);
    }
  }, [visibleCards, totalPieces, onDistributionChange, state.salesEstimator]);

  // Get values from stores
  const salesHeaderValues = useSalesStore((state: SalesStore) => state.salesHeaderValues);
  const commissionHeaderValues = useCommissionStore((state: CommissionStore) => state.commissionHeaderValues);
  const fulfillmentHeaderValues = useFulfillmentStore((state: FulfillmentStore) => state.fulfillmentHeaderValues);
  const expenditureHeaderValues = useExpenditureStore((state: ExpenditureStore) => state.expenditureHeaderValues);
  const productCostHeaderValues = useProductCostStore((state: ProductCostStore) => state.productCostHeaderValues);
  const taxValues = useTaxStore((state: TaxStore) => state.taxValues);
  const profitStoreValues = useProfitStore((state: ProfitStore) => state.netProfitValues);

  // Combine expense header values
  const expenseHeaderValues = {
    'FBM-NonGenius': {
      commission: commissionHeaderValues['FBM-NonGenius'],
      fulfillment: fulfillmentHeaderValues['FBM-NonGenius'],
      expenditures: expenditureHeaderValues['FBM-NonGenius'],
      productCost: productCostHeaderValues['FBM-NonGenius'],
      taxes: taxValues['FBM-NonGenius'].incomeTax,
      vatToBePaid: taxValues['FBM-NonGenius'].vatToBePaid,
    },
    'FBM-Genius': {
      commission: commissionHeaderValues['FBM-Genius'],
      fulfillment: fulfillmentHeaderValues['FBM-Genius'],
      expenditures: expenditureHeaderValues['FBM-Genius'],
      productCost: productCostHeaderValues['FBM-Genius'],
      taxes: taxValues['FBM-Genius'].incomeTax,
      vatToBePaid: taxValues['FBM-Genius'].vatToBePaid,
    },
    'FBE': {
      commission: commissionHeaderValues['FBE'],
      fulfillment: fulfillmentHeaderValues['FBE'],
      expenditures: expenditureHeaderValues['FBE'],
      productCost: productCostHeaderValues['FBE'],
      taxes: taxValues['FBE'].incomeTax,
      vatToBePaid: taxValues['FBE'].vatToBePaid,
    },
  };

  // Calculate total revenue
  const calculateTotalRevenue = () => {
    return Object.entries(distributions).reduce((total, [type, dist]) => {
      const headerValue = salesHeaderValues[type as CalculatorType];
      return total + (headerValue * dist.pieces);
    }, 0);
  };

  // Calculate total expense for a specific calculator type
  const calculateTotalExpenseForType = (type: keyof typeof expenseHeaderValues) => {
    const expenses = expenseHeaderValues[type];
    
    let fulfillmentCost = Math.abs(expenses.fulfillment);
    
    // For FBM-Genius, only include fulfillment if FBM-NonGenius has a shipping cost
    if (type === 'FBM-Genius') {
      const nonGeniusShippingCost = expenseHeaderValues['FBM-NonGenius'].fulfillment;
      fulfillmentCost = nonGeniusShippingCost !== 0 ? fulfillmentCost : 0;
    }
    
    return Math.abs(expenses.commission) + 
           fulfillmentCost + 
           Math.abs(expenses.expenditures) + 
           Math.abs(expenses.productCost);
  };

  // Calculate total expenses
  const calculateTotalExpense = () => {
    const nonGeniusExpense = calculateTotalExpenseForType('FBM-NonGenius') * distributions['FBM-NonGenius'].pieces;
    const geniusExpense = calculateTotalExpenseForType('FBM-Genius') * distributions['FBM-Genius'].pieces;
    const fbeExpense = calculateTotalExpenseForType('FBE') * distributions['FBE'].pieces;
    
    return nonGeniusExpense + geniusExpense + fbeExpense;
  };

  // Calculate total net profit
  const calculateTotalNetProfit = () => {
    return (['FBM-NonGenius', 'FBM-Genius', 'FBE'] as const).reduce((acc, category) => {
      return acc + (profitStoreValues[category] * distributions[category].pieces);
    }, 0);
  };

  // Calculate total taxes
  const calculateTotalTaxes = () => {
    const nonGeniusTax = expenseHeaderValues['FBM-NonGenius'].taxes * distributions['FBM-NonGenius'].pieces;
    const geniusTax = expenseHeaderValues['FBM-Genius'].taxes * distributions['FBM-Genius'].pieces;
    const fbeTax = expenseHeaderValues['FBE'].taxes * distributions['FBE'].pieces;

    return nonGeniusTax + geniusTax + fbeTax;
  };

  // Calculate total VAT to be paid
  const calculateTotalVatToBePaid = () => {
    const nonGeniusVat = expenseHeaderValues['FBM-NonGenius'].vatToBePaid * distributions['FBM-NonGenius'].pieces;
    const geniusVat = expenseHeaderValues['FBM-Genius'].vatToBePaid * distributions['FBM-Genius'].pieces;
    const fbeVat = expenseHeaderValues['FBE'].vatToBePaid * distributions['FBE'].pieces;

    return nonGeniusVat + geniusVat + fbeVat;
  };

  // Handle slider change
  const handleSliderChange = (newValue: number[]) => {
    // Skip if we're loading from context
    if (loadingFromContextRef.current) return;
    
    setSliderValue(newValue);
    onDistributionChange(calculateDistributions(totalPieces, newValue));
  };

  // Handle pieces change
  const handlePiecesChange = (type: CalculatorType, value: number) => {
    // Skip if we're loading from context
    if (loadingFromContextRef.current) return;
    
    const newPieces = { ...manualPieces, [type]: value };
    const total = Object.values(newPieces).reduce((sum, val) => sum + val, 0);
    
    // Update total pieces
    setTotalPieces(total);
    
    // Calculate new percentages for slider
    if (total > 0) {
      const nonGeniusPercent = (newPieces['FBM-NonGenius'] / total) * 100;
      const geniusPercent = (newPieces['FBM-Genius'] / total) * 100;
      const newSliderValue = [
        nonGeniusPercent,
        nonGeniusPercent + geniusPercent
      ];
      
      setSliderValue(newSliderValue);
      setManualPieces(newPieces);
      onDistributionChange(calculateDistributions(total, newSliderValue));
    }
  };

  // Handle total pieces change
  const handleTotalPiecesChange = (value: number) => {
    // Skip if we're loading from context
    if (loadingFromContextRef.current) return;
    
    setTotalPieces(value);
    onDistributionChange(calculateDistributions(value, sliderValue));
  };

  // Calculate all metrics
  const totalRevenue = calculateTotalRevenue();
  const totalExpense = calculateTotalExpense();
  const totalNetProfit = calculateTotalNetProfit();
  const totalTaxes = calculateTotalTaxes();
  const totalVatToBePaid = calculateTotalVatToBePaid();

  // Calculate percentages
  const netProfitPercentage = totalRevenue !== 0 ? (totalNetProfit / totalRevenue) * 100 : 0;
  const taxPercentage = totalRevenue !== 0 ? (Math.abs(totalTaxes) / totalRevenue) * 100 : 0;
  const vatPercentage = totalRevenue !== 0 ? (Math.abs(totalVatToBePaid) / totalRevenue) * 100 : 0;
  const expensePercentage = totalRevenue !== 0 ? (Math.abs(totalExpense) / totalRevenue * 100) : 0;

  return {
    totalPieces,
    sliderValue,
    distributions,
    totalRevenue,
    totalExpense,
    totalNetProfit,
    totalTaxes,
    totalVatToBePaid,
    netProfitPercentage,
    taxPercentage,
    vatPercentage,
    expensePercentage,
    handleSliderChange,
    handlePiecesChange,
    handleTotalPiecesChange,
    calculateDistributions
  };
};

export default useSalesEstimatorCalculations; 