import React, { useEffect, useRef, useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import useSalesEstimatorCalculations from '../../hooks/useSalesEstimatorCalculations';
import useSalesEstimatorCharts from '../../hooks/useSalesEstimatorCharts';
import DistributionControls from './DistributionControls';
import MetricsCards from './MetricsCards';
import ChartSection from './ChartSection';
import { VisibleCards } from '../../hooks/useCalculatorReset';
import { useCalculator } from '../../context/CalculatorContext';

interface SalesEstimatorProps {
  onDistributionChange: (distributions: Record<string, { pieces: number; percent: number }>) => void;
  taxRate: number;
  visibleCards: VisibleCards;
  selectedProduct?: string; // Optional prop to track selected product
}

const SalesEstimator: React.FC<SalesEstimatorProps> = ({ 
  onDistributionChange, 
  taxRate, 
  visibleCards,
  selectedProduct 
}) => {
  const { t } = useTranslation();
  const { dispatch, state } = useCalculator();
  const updatingContextRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const prevValuesRef = useRef<{
    totalPieces: number;
    sliderValue: number[];
    distributions: Record<string, { pieces: number; percent: number }>;
    stateTimestamp: number;
    contextUpdateTimestamp: number;
    selectedProduct?: string;
  }>({
    totalPieces: 0,
    sliderValue: [0, 0],
    distributions: {},
    stateTimestamp: 0,
    contextUpdateTimestamp: 0,
    selectedProduct: ''
  });
  
  // Create a stable onDistributionChange callback that won't recreate on every render
  const stableOnDistributionChange = useCallback((distributions: Record<string, { pieces: number; percent: number }>) => {
    onDistributionChange(distributions);
  }, [onDistributionChange]);
  
  // Use the calculations hook
  const {
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
    handleTotalPiecesChange
  } = useSalesEstimatorCalculations(stableOnDistributionChange, visibleCards);

  // Use the charts hook
  const {
    donutOptions,
    donutSeries,
    gaugeOptions,
    gaugeSeries
  } = useSalesEstimatorCharts(
    totalRevenue,
    totalExpense,
    totalTaxes,
    totalVatToBePaid,
    totalNetProfit
  );

  // Effect to handle product selection changes
  useEffect(() => {
    // If the selected product has changed, capture it in our ref
    if (selectedProduct !== prevValuesRef.current.selectedProduct) {
      prevValuesRef.current.selectedProduct = selectedProduct;
      
      // When product changes, ensure we're using the latest state from context
      if (state.salesEstimator) {
        // Set updating flag
        updatingContextRef.current = true;
        
        // Use a small delay to ensure we're not in the middle of a state update
        setTimeout(() => {
          // Reset the updating flag after applying changes
          updatingContextRef.current = false;
        }, 100);
      }
    }
  }, [selectedProduct, state.salesEstimator]);

  // Safe debounced update to context
  const updateContextDebounced = useCallback((
    totalPieces: number, 
    distributions: Record<string, { pieces: number; percent: number }>,
    sliderValue: number[]
  ) => {
    // If already updating, cancel previous timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // Set updating flag
    updatingContextRef.current = true;
    
    // Update after small delay
    timerRef.current = setTimeout(() => {
      dispatch({
        type: 'UPDATE_SALES_ESTIMATOR',
        payload: {
          totalPieces,
          distribution: distributions,
          sliderValue
        }
      });
      
      // Update the timestamp of last context update
      prevValuesRef.current.contextUpdateTimestamp = Date.now();
      
      // Reset updating flag after another small delay to prevent immediate loops
      setTimeout(() => {
        updatingContextRef.current = false;
      }, 50);
    }, 50);
  }, [dispatch]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Update the context state when sales estimator data changes
  useEffect(() => {
    // Skip if we're currently updating context to prevent loops
    if (updatingContextRef.current) {
      return;
    }
    
    // Only update context if the values are different than what's already in context and from previous values
    const currentState = state.salesEstimator;
    const prevValues = prevValuesRef.current;
    
    // Deep comparison to check if we actually need to update
    const contextNeedsUpdate = 
      !currentState || 
      currentState.totalPieces !== totalPieces ||
      JSON.stringify(currentState.distribution) !== JSON.stringify(distributions) ||
      JSON.stringify(currentState.sliderValue) !== JSON.stringify(sliderValue);
    
    // Check if values changed from previous render to avoid redundant updates
    const valuesChanged = 
      prevValues.totalPieces !== totalPieces ||
      JSON.stringify(prevValues.sliderValue) !== JSON.stringify(sliderValue) ||
      JSON.stringify(prevValues.distributions) !== JSON.stringify(distributions);
    
    // Time thresholds for preventing rapid updates
    const timeThreshold = 200; // 200ms threshold to prevent immediate back-and-forth updates
    const contextUpdateThreshold = 300; // 300ms since last context update
    
    const isRecentUpdate = (Date.now() - prevValues.stateTimestamp) < timeThreshold;
    const isRecentContextUpdate = (Date.now() - prevValues.contextUpdateTimestamp) < contextUpdateThreshold;
    
    // Only dispatch if values have changed to avoid infinite update loops
    if (contextNeedsUpdate && valuesChanged && !isRecentUpdate && !isRecentContextUpdate) {
      // Update previous values
      prevValuesRef.current = {
        ...prevValuesRef.current,
        totalPieces,
        sliderValue: [...sliderValue],
        distributions: {...distributions},
        stateTimestamp: Date.now()
      };
      
      // Update context with debounce
      updateContextDebounced(totalPieces, distributions, sliderValue);
    }
  }, [totalPieces, distributions, sliderValue, state.salesEstimator, updateContextDebounced]);

  return (
    <Box>
      {/* Header */}
      <Typography 
        variant="h5" 
        sx={{ 
          fontSize: '24px',
          fontWeight: 600,
          mb: 3,
          color: 'text.primary'
        }}
      >
        {t('calculator.salesEstimator.title')}
      </Typography>

      {/* Content */}
      <Box>
        {/* Distribution Controls */}
        <DistributionControls
          totalPieces={totalPieces}
          sliderValue={sliderValue}
          distributions={distributions}
          handleSliderChange={handleSliderChange}
          handlePiecesChange={handlePiecesChange}
          handleTotalPiecesChange={handleTotalPiecesChange}
          visibleCards={visibleCards}
        />

        {/* Metrics Cards */}
        <MetricsCards
          totalRevenue={totalRevenue}
          totalExpense={totalExpense}
          totalTaxes={totalTaxes}
          totalVatToBePaid={totalVatToBePaid}
          totalNetProfit={totalNetProfit}
          netProfitPercentage={netProfitPercentage}
          taxPercentage={taxPercentage}
          vatPercentage={vatPercentage}
          expensePercentage={expensePercentage}
        />

        {/* Charts */}
        <ChartSection
          donutOptions={donutOptions}
          donutSeries={donutSeries}
          gaugeOptions={gaugeOptions}
          gaugeSeries={gaugeSeries}
        />
      </Box>
    </Box>
  );
};

export default SalesEstimator; 