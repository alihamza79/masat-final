import React from 'react';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import useSalesEstimatorCalculations from '../../hooks/useSalesEstimatorCalculations';
import useSalesEstimatorCharts from '../../hooks/useSalesEstimatorCharts';
import DistributionControls from './DistributionControls';
import MetricsCards from './MetricsCards';
import ChartSection from './ChartSection';

interface SalesEstimatorProps {
  onDistributionChange: (distributions: Record<string, { pieces: number; percent: number }>) => void;
  taxRate: number;
}

const SalesEstimator: React.FC<SalesEstimatorProps> = ({ onDistributionChange, taxRate }) => {
  const { t } = useTranslation();
  
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
  } = useSalesEstimatorCalculations(onDistributionChange);

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