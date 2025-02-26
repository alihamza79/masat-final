import React, { useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { useSalesStore, SalesStore } from '../store/salesStore';
import { useCommissionStore, CommissionStore } from '../store/commissionStore';
import { useFulfillmentStore, FulfillmentStore } from '../store/fulfillmentStore';
import { useExpenditureStore, ExpenditureStore } from '../store/expenditureStore';
import { useProductCostStore, ProductCostStore } from '../store/productCostStore';
import { useTaxStore, TaxStore } from '../store/taxStore';
import { useProfitStore, ProfitStore } from '../store/profitStore';

import SalesInput from './salesestimator/SalesInput';
import DistributionSlider from './salesestimator/DistributionSlider';
import MetricsCard from './salesestimator/MetricsCard';
import Charts from './salesestimator/Charts';
import { CalculatorType, Distribution, Distributions, ExpenseHeaderValues } from './salesestimator/types';

interface SalesEstimatorProps {
  onDistributionChange: (distributions: Record<string, { pieces: number; percent: number }>) => void;
  taxRate: number;
}

const SalesEstimator: React.FC<SalesEstimatorProps> = ({ onDistributionChange, taxRate }) => {
  const [totalPieces, setTotalPieces] = useState<number>(1);
  const [sliderValue, setSliderValue] = useState<number[]>([33.33, 66.66]);
  const [manualPieces, setManualPieces] = useState<Record<CalculatorType, number>>({
    'FBM-NonGenius': 0,
    'FBM-Genius': 0,
    'FBE': 1
  });

  const salesHeaderValues = useSalesStore((state: SalesStore) => state.salesHeaderValues);
  const commissionHeaderValues = useCommissionStore((state: CommissionStore) => state.commissionHeaderValues);
  const fulfillmentHeaderValues = useFulfillmentStore((state: FulfillmentStore) => state.fulfillmentHeaderValues);
  const expenditureHeaderValues = useExpenditureStore((state: ExpenditureStore) => state.expenditureHeaderValues);
  const productCostHeaderValues = useProductCostStore((state: ProductCostStore) => state.productCostHeaderValues);
  const taxValues = useTaxStore((state: TaxStore) => state.taxValues);
  const profitStoreValues = useProfitStore((state: ProfitStore) => state.netProfitValues);

  const expenseHeaderValues: ExpenseHeaderValues = {
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

  const calculateDistributions = (pieces: number, percentages: number[]): Distributions => {
    const nonGeniusPercent = Number((percentages[0]).toFixed(2));
    const geniusPercent = Number((percentages[1] - percentages[0]).toFixed(2));
    const fbePercent = Number((100 - percentages[1]).toFixed(2));

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

    const piecesArray = [
      Math.floor((nonGeniusPercent / 100) * pieces),
      Math.floor((geniusPercent / 100) * pieces),
      Math.floor((fbePercent / 100) * pieces)
    ];

    const remainingPieces = pieces - piecesArray.reduce((a, b) => a + b, 0);
    if (remainingPieces > 0) {
      const decimalParts = [
        ((nonGeniusPercent / 100) * pieces) % 1,
        ((geniusPercent / 100) * pieces) % 1,
        ((fbePercent / 100) * pieces) % 1
      ];

      const indices = [0, 1, 2].sort((a, b) => decimalParts[b] - decimalParts[a]);

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

  const distributions = calculateDistributions(totalPieces, sliderValue);

  const calculateTotalRevenue = () => {
    return Object.entries(distributions).reduce((total, [type, dist]) => {
      const headerValue = salesHeaderValues[type as CalculatorType];
      return total + (headerValue * dist.pieces);
    }, 0);
  };

  const calculateTotalExpenseForType = (type: keyof typeof expenseHeaderValues) => {
    const expenses = expenseHeaderValues[type];
    
    let fulfillmentCost = Math.abs(expenses.fulfillment);
    
    if (type === 'FBM-Genius') {
      const nonGeniusShippingCost = expenseHeaderValues['FBM-NonGenius'].fulfillment;
      fulfillmentCost = nonGeniusShippingCost !== 0 ? fulfillmentCost : 0;
    }
    
    return Math.abs(expenses.commission) + 
           fulfillmentCost + 
           Math.abs(expenses.expenditures) + 
           Math.abs(expenses.productCost);
  };

  const calculateTotalExpense = () => {
    const nonGeniusExpense = calculateTotalExpenseForType('FBM-NonGenius') * distributions['FBM-NonGenius'].pieces;
    const geniusExpense = calculateTotalExpenseForType('FBM-Genius') * distributions['FBM-Genius'].pieces;
    const fbeExpense = calculateTotalExpenseForType('FBE') * distributions['FBE'].pieces;
    
    return nonGeniusExpense + geniusExpense + fbeExpense;
  };

  const totalRevenue = calculateTotalRevenue();
  const totalExpense = calculateTotalExpense();
  const totalNetProfit = (['FBM-NonGenius', 'FBM-Genius', 'FBE'] as const).reduce((acc, category) => {
    return acc + (profitStoreValues[category] * distributions[category].pieces);
  }, 0);
  const netProfitPercentage = totalRevenue !== 0 ? (totalNetProfit / totalRevenue) * 100 : 0;

  const totalTaxes = React.useMemo(() => {
    const nonGeniusTax = expenseHeaderValues['FBM-NonGenius'].taxes * distributions['FBM-NonGenius'].pieces;
    const geniusTax = expenseHeaderValues['FBM-Genius'].taxes * distributions['FBM-Genius'].pieces;
    const fbeTax = expenseHeaderValues['FBE'].taxes * distributions['FBE'].pieces;
    return nonGeniusTax + geniusTax + fbeTax;
  }, [expenseHeaderValues, distributions]);

  const taxPercentage = totalRevenue !== 0 ? (Math.abs(totalTaxes) / totalRevenue) * 100 : 0;

  const totalVatToBePaid = React.useMemo(() => {
    const nonGeniusVat = expenseHeaderValues['FBM-NonGenius'].vatToBePaid * distributions['FBM-NonGenius'].pieces;
    const geniusVat = expenseHeaderValues['FBM-Genius'].vatToBePaid * distributions['FBM-Genius'].pieces;
    const fbeVat = expenseHeaderValues['FBE'].vatToBePaid * distributions['FBE'].pieces;
    return nonGeniusVat + geniusVat + fbeVat;
  }, [expenseHeaderValues, distributions]);

  const vatPercentage = totalRevenue !== 0 ? (Math.abs(totalVatToBePaid) / totalRevenue) * 100 : 0;

  const handleSliderChange = (event: Event, newValue: number | number[]) => {
    if (Array.isArray(newValue)) {
      setSliderValue(newValue);
      onDistributionChange(calculateDistributions(totalPieces, newValue));
    }
  };

  const handlePiecesChange = (type: CalculatorType, value: number) => {
    const newPieces = { ...manualPieces, [type]: value };
    const total = Object.values(newPieces).reduce((sum, val) => sum + val, 0);
    
    setTotalPieces(total);
    
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

  const metrics = [
    { label: 'Total Revenue', value: totalRevenue, percent: '100.00%' },
    { label: 'Total Expense', value: totalExpense, percent: totalRevenue !== 0 ? `${(Math.abs(totalExpense) / totalRevenue * 100).toFixed(2)}%` : '0.00%' },
    { label: 'Total Taxes', value: totalTaxes, percent: `${taxPercentage.toFixed(2)}%` },
    { label: 'Total VAT to be paid', value: totalVatToBePaid, percent: `${vatPercentage.toFixed(2)}%` },
    { label: 'Total Net Profit', value: totalNetProfit, percent: `${netProfitPercentage.toFixed(2)}%` }
  ];

  const chartData = {
    totalRevenue,
    totalExpense,
    totalTaxes,
    totalVatToBePaid,
    totalNetProfit,
    netProfitPercentage,
    taxPercentage,
    vatPercentage
  };

  React.useEffect(() => {
    onDistributionChange(calculateDistributions(1, [33.33, 66.66]));
  }, []);

  return (
    <Box>
      <Typography 
        variant="h5" 
        sx={{ 
          fontSize: '24px',
          fontWeight: 600,
          mb: 4,
          color: 'text.primary'
        }}
      >
        Sales Estimator
      </Typography>

      <Box>
        <Box mb={{ xs: 3, sm: 4 }}>
          <Stack 
            direction={{ xs: 'column', sm: 'row' }}
            spacing={{ xs: 3, sm: 3, md: 4 }}
            alignItems={{ xs: 'stretch', sm: 'flex-start' }}
          >
            <SalesInput
              totalPieces={totalPieces}
              onTotalPiecesChange={(value) => {
                      setTotalPieces(value);
                      onDistributionChange(calculateDistributions(value, sliderValue));
                    }}
                  />
            <DistributionSlider
              sliderValue={sliderValue}
              distributions={distributions}
              onSliderChange={handleSliderChange}
              onPiecesChange={handlePiecesChange}
                    />
          </Stack>
        </Box>

        <MetricsCard metrics={metrics} />
        <Charts chartData={chartData} />
      </Box>
    </Box>
  );
};

export default SalesEstimator; 