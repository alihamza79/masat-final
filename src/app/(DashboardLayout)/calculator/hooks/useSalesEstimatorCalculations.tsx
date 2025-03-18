import { useState, useEffect } from 'react';
import { useSalesStore, SalesStore } from '../store/salesStore';
import { useCommissionStore, CommissionStore } from '../store/commissionStore';
import { useFulfillmentStore, FulfillmentStore } from '../store/fulfillmentStore';
import { useExpenditureStore, ExpenditureStore } from '../store/expenditureStore';
import { useProductCostStore, ProductCostStore } from '../store/productCostStore';
import { useTaxStore, TaxStore } from '../store/taxStore';
import { useProfitStore, ProfitStore } from '../store/profitStore';
import { VisibleCards } from './useCalculatorReset';

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
  const [totalPieces, setTotalPieces] = useState<number>(1);
  const [sliderValue, setSliderValue] = useState<number[]>([33.33, 66.66]);
  const [manualPieces, setManualPieces] = useState<Record<CalculatorType, number>>({
    'FBM-NonGenius': 0,
    'FBM-Genius': 0,
    'FBE': 1
  });

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

  // Calculate distributions based on pieces, percentages, and visible cards
  const calculateDistributions = (pieces: number, percentages: number[]): Distributions => {
    // Get array of visible calculator types
    const visibleTypes = (Object.entries(visibleCards) as [CalculatorType, boolean][])
      .filter(([_, isVisible]) => isVisible)
      .map(([type]) => type);

    // If no calculators are visible, return zeros
    if (visibleTypes.length === 0) {
      return {
        'FBM-NonGenius': { pieces: 0, percent: 0 },
        'FBM-Genius': { pieces: 0, percent: 0 },
        'FBE': { pieces: 0, percent: 0 }
      };
    }

    // Handle case of only one calculator visible
    if (visibleTypes.length === 1) {
      const visibleType = visibleTypes[0];
      const result = {
        'FBM-NonGenius': { pieces: 0, percent: 0 },
        'FBM-Genius': { pieces: 0, percent: 0 },
        'FBE': { pieces: 0, percent: 0 }
      };
      result[visibleType] = { pieces, percent: 100 };
      return result;
    }

    // Handle case of two calculators visible
    if (visibleTypes.length === 2) {
      // Determine which calculators are visible
      const [first, second] = visibleTypes;
      
      // For two visible calculators, adjust slider to only show division between them
      let firstPercent, secondPercent;
      
      if (first === 'FBM-NonGenius' && second === 'FBM-Genius') {
        // First and second calculators visible
        firstPercent = percentages[0];
        secondPercent = 100 - firstPercent;
      } else if (first === 'FBM-NonGenius' && second === 'FBE') {
        // First and third calculators visible
        firstPercent = percentages[0];
        secondPercent = 100 - firstPercent;
      } else {
        // Second and third calculators visible
        firstPercent = percentages[1] - percentages[0];
        secondPercent = 100 - firstPercent;
      }
      
      // Calculate pieces
      const firstPieces = Math.floor((firstPercent / 100) * pieces);
      const secondPieces = pieces - firstPieces;
      
      const result = {
        'FBM-NonGenius': { pieces: 0, percent: 0 },
        'FBM-Genius': { pieces: 0, percent: 0 },
        'FBE': { pieces: 0, percent: 0 }
      };
      
      result[first] = { pieces: firstPieces, percent: firstPercent };
      result[second] = { pieces: secondPieces, percent: secondPercent };
      
      return result;
    }

    // All three calculators are visible - use original logic
    // Calculate exact percentages from slider positions
    const nonGeniusPercent = Number((percentages[0]).toFixed(2));
    const geniusPercent = Number((percentages[1] - percentages[0]).toFixed(2));
    const fbePercent = Number((100 - percentages[1]).toFixed(2));

    // If there's only 1 piece, assign it to the calculator with highest percentage
    if (pieces === 1) {
      const maxPercent = Math.max(nonGeniusPercent, geniusPercent, fbePercent);
      return {
        'FBM-NonGenius': {
          pieces: maxPercent === nonGeniusPercent ? 1 : 0,
          percent: nonGeniusPercent
        },
        'FBM-Genius': {
          pieces: maxPercent === geniusPercent ? 1 : 0,
          percent: geniusPercent
        },
        'FBE': {
          pieces: maxPercent === fbePercent ? 1 : 0,
          percent: fbePercent
        }
      };
    }

    // Calculate pieces based on percentages
    const piecesArray = [
      Math.floor((nonGeniusPercent / 100) * pieces),
      Math.floor((geniusPercent / 100) * pieces),
      Math.floor((fbePercent / 100) * pieces)
    ];

    // Distribute remaining pieces to maintain total
    const remainingPieces = pieces - piecesArray.reduce((a, b) => a + b, 0);
    if (remainingPieces > 0) {
      // Calculate decimal parts
      const decimalParts = [
        ((nonGeniusPercent / 100) * pieces) % 1,
        ((geniusPercent / 100) * pieces) % 1,
        ((fbePercent / 100) * pieces) % 1
      ];

      // Sort indices by decimal parts descending
      const indices = [0, 1, 2].sort((a, b) => decimalParts[b] - decimalParts[a]);

      // Distribute remaining pieces to calculators with highest decimal parts
      for (let i = 0; i < remainingPieces; i++) {
        piecesArray[indices[i]]++;
      }
    }

    return {
      'FBM-NonGenius': {
        pieces: Math.max(0, piecesArray[0]),
        percent: nonGeniusPercent
      },
      'FBM-Genius': {
        pieces: Math.max(0, piecesArray[1]),
        percent: geniusPercent
      },
      'FBE': {
        pieces: Math.max(0, piecesArray[2]),
        percent: fbePercent
      }
    };
  };

  // Get current distributions
  const distributions = calculateDistributions(totalPieces, sliderValue);

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
    setSliderValue(newValue);
    onDistributionChange(calculateDistributions(totalPieces, newValue));
  };

  // Handle pieces change
  const handlePiecesChange = (type: CalculatorType, value: number) => {
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
    setTotalPieces(value);
    onDistributionChange(calculateDistributions(value, sliderValue));
  };

  // Watch for changes in visibleCards and update distributions
  useEffect(() => {
    const newDistributions = calculateDistributions(totalPieces, sliderValue);
    onDistributionChange(newDistributions);
  }, [visibleCards]);

  // Trigger initial distribution calculation
  useEffect(() => {
    onDistributionChange(calculateDistributions(1, [33.33, 66.66]));
  }, []);

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