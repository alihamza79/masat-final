import React, { useState } from 'react';
import {
  Box,
  Card,
  Stack,
  Typography,
  TextField,
  Grid,
  useTheme,
  Slider,
  styled,
  InputAdornment
} from '@mui/material';
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';
import SalesEstimatorInput from './SalesEstimatorInput';
import { useSalesStore, SalesStore } from '../store/salesStore';
import { useCommissionStore, CommissionStore } from '../store/commissionStore';
import { useFulfillmentStore, FulfillmentStore } from '../store/fulfillmentStore';
import { useExpenditureStore, ExpenditureStore } from '../store/expenditureStore';
import { useProductCostStore, ProductCostStore } from '../store/productCostStore';
import { useTaxStore, TaxStore } from '../store/taxStore';
import { useProfitStore, ProfitStore } from '../store/profitStore';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface SalesEstimatorProps {
  onDistributionChange: (distributions: Record<string, { pieces: number; percent: number }>) => void;
  taxRate: number;
}

// Custom styled Slider
const CustomSlider = styled(Slider)(({ theme }) => ({
  height: 8,
  padding: '13px 0',
  '& .MuiSlider-rail': {
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    height: 8,
    borderRadius: 4,
    opacity: 1
  },
  '& .MuiSlider-track': {
    height: 8,
    border: 'none',
    borderRadius: 4,
    '&:after': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'none',
      pointerEvents: 'none'
    }
  },
  '& .MuiSlider-thumb': {
    height: 20,
    width: 20,
    backgroundColor: '#fff',
    border: '2px solid #5D87FF',
    '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
      boxShadow: 'inherit',
    },
    '&:before': {
      display: 'none',
    },
    zIndex: 10,
    '& .MuiSlider-valueLabel': {
      display: 'none'
    },
    '&.Mui-active .MuiSlider-valueLabel': {
      display: 'block'
    }
  },
  '& .MuiSlider-valueLabel': {
    lineHeight: 1.2,
    fontSize: 12,
    background: 'unset',
    padding: 0,
    width: 32,
    height: 32,
    borderRadius: '6px',
    backgroundColor: '#5D87FF',
    transformOrigin: 'bottom left',
    transform: 'translate(50%, -100%)',
    '&:before': { display: 'none' },
    '& > *': {
      transform: 'none',
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
  },
}));

const SalesEstimator: React.FC<SalesEstimatorProps> = ({ onDistributionChange, taxRate }) => {
  const theme = useTheme();
  const [totalPieces, setTotalPieces] = useState<number>(1);
  const [sliderValue, setSliderValue] = useState<number[]>([33.33, 66.66]);
  const sliderRef = React.useRef<HTMLSpanElement>(null);
  const [manualPieces, setManualPieces] = useState<Record<CalculatorType, number>>({
    'FBM-NonGenius': 0,
    'FBM-Genius': 0,
    'FBE': 1
  });
  
  type CalculatorType = 'FBM-NonGenius' | 'FBM-Genius' | 'FBE';
  type Distribution = {
    pieces: number;
    percent: number;
  };
  type Distributions = Record<CalculatorType, Distribution>;

  const salesHeaderValues = useSalesStore((state: SalesStore) => state.salesHeaderValues);
  const commissionHeaderValues = useCommissionStore((state: CommissionStore) => state.commissionHeaderValues);
  const fulfillmentHeaderValues = useFulfillmentStore((state: FulfillmentStore) => state.fulfillmentHeaderValues);
  const expenditureHeaderValues = useExpenditureStore((state: ExpenditureStore) => state.expenditureHeaderValues);
  const productCostHeaderValues = useProductCostStore((state: ProductCostStore) => state.productCostHeaderValues);
  const taxValues = useTaxStore((state: TaxStore) => state.taxValues);
  const profitStoreValues = useProfitStore((state: ProfitStore) => state.netProfitValues);

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

  const calculateDistributions = (pieces: number, percentages: number[]): Distributions => {
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

  // Calculate Total Taxes (Income Tax)
  const totalTaxes = React.useMemo(() => {
    // Use pre-calculated tax values from each calculator type
    const nonGeniusTax = expenseHeaderValues['FBM-NonGenius'].taxes * distributions['FBM-NonGenius'].pieces;
    const geniusTax = expenseHeaderValues['FBM-Genius'].taxes * distributions['FBM-Genius'].pieces;
    const fbeTax = expenseHeaderValues['FBE'].taxes * distributions['FBE'].pieces;

    // Sum up all taxes
    return nonGeniusTax + geniusTax + fbeTax;
  }, [expenseHeaderValues, distributions]);

  // Calculate tax percentage of total revenue
  const taxPercentage = totalRevenue !== 0 ? (Math.abs(totalTaxes) / totalRevenue) * 100 : 0;

  // Calculate Total VAT to be paid
  const totalVatToBePaid = React.useMemo(() => {
    // Use pre-calculated VAT values from each calculator type
    const nonGeniusVat = expenseHeaderValues['FBM-NonGenius'].vatToBePaid * distributions['FBM-NonGenius'].pieces;
    const geniusVat = expenseHeaderValues['FBM-Genius'].vatToBePaid * distributions['FBM-Genius'].pieces;
    const fbeVat = expenseHeaderValues['FBE'].vatToBePaid * distributions['FBE'].pieces;

    // Sum up all VAT
    return nonGeniusVat + geniusVat + fbeVat;
  }, [expenseHeaderValues, distributions]);

  // Calculate VAT percentage of total revenue
  const vatPercentage = totalRevenue !== 0 ? (Math.abs(totalVatToBePaid) / totalRevenue) * 100 : 0;

  const updateSliderColors = () => {
    if (!sliderRef.current) return;
    
    const rail = sliderRef.current.querySelector('.MuiSlider-rail') as HTMLElement;
    if (rail) {
      rail.style.background = `linear-gradient(to right, 
        #FF9800 0%, 
        #FF9800 ${sliderValue[0]}%, 
        #5D87FF ${sliderValue[0]}%, 
        #5D87FF ${sliderValue[1]}%, 
        #2CD9C5 ${sliderValue[1]}%, 
        #2CD9C5 100%)`;
    }
  };

  const handleSliderChange = (event: Event, newValue: number | number[]) => {
    if (Array.isArray(newValue)) {
      setSliderValue(newValue);
      onDistributionChange(calculateDistributions(totalPieces, newValue));
      updateSliderColors();
    }
  };

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
      updateSliderColors();
    }
  };

  React.useEffect(() => {
    updateSliderColors();
  }, [sliderValue]);

  // Trigger initial distribution calculation
  React.useEffect(() => {
    onDistributionChange(calculateDistributions(1, [33.33, 66.66]));
  }, []);

  // Bar chart options
  const barOptions: ApexOptions = {
    chart: {
      type: 'bar',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      toolbar: {
        show: false
      }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '40%',
        borderRadius: 6
      },
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent']
    },
    xaxis: {
      categories: ['FBM-NonGenius', 'FBM-Genius', 'FBE'],
      axisBorder: {
        show: false
      }
    },
    yaxis: {
      show: true
    },
    fill: {
      opacity: 1
    },
    tooltip: {
      enabled: true
    },
    grid: {
      borderColor: 'rgba(0,0,0,0.1)'
    },
    colors: ['#5D87FF', '#2CD9C5', '#49BEFF']
  };

  // Donut chart options for metrics
  const donutOptions: ApexOptions = {
    chart: {
      type: 'donut',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      foreColor: '#adb0bb',
      toolbar: {
        show: false
      },
      height: 350
    },
    labels: ['Total Revenue', 'Total Expense', 'Total Taxes', 'Total VAT', 'Total Net Profit'],
    colors: ['#2CD9C5', '#FA896B', '#FFAE1F', '#5D87FF', '#49BEFF'],
    plotOptions: {
      pie: {
        donut: {
          size: '75%',
          background: 'transparent',
          labels: {
            show: true,
            name: {
              show: true,
              offsetY: 7
            },
            value: {
              show: true,
              fontSize: '20px',
              fontWeight: 600,
              formatter: function(val: string) {
                return parseFloat(val).toFixed(2) + ' LEI';
              }
            },
            total: {
              show: true,
              color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.8)' : '#2A3547',
              fontSize: '20px',
              fontWeight: 600,
              label: 'Total',
              formatter: function(w) {
                return w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0).toFixed(2) + ' LEI';
              }
            }
          }
        }
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      show: false
    },
    legend: {
      show: true,
      position: 'bottom',
      fontSize: '14px',
      markers: {
        width: 10,
        height: 10,
        radius: 5
      }
    },
    tooltip: {
      theme: theme.palette.mode === 'dark' ? 'dark' : 'light',
      fillSeriesColor: false,
      y: {
        formatter: function(val: number) {
          return val.toFixed(2) + ' LEI';
        }
      }
    }
  };

  const donutSeries = [
    totalRevenue,
    totalExpense,
    totalTaxes,
    totalVatToBePaid,
    totalNetProfit
  ];

  // Gauge chart options
  const gaugeOptions: ApexOptions = {
    chart: {
      type: 'radialBar',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      height: '100%',
      offsetY: -10,
      sparkline: {
        enabled: true
      }
    },
    plotOptions: {
      radialBar: {
        startAngle: -135,
        endAngle: 135,
        hollow: {
          margin: 0,
          size: '72%',
          background: theme.palette.background.paper,
          position: 'front',
          dropShadow: {
            enabled: true,
            top: 3,
            left: 0,
            blur: 4,
            opacity: 0.15
          }
        },
        track: {
          background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          strokeWidth: '100%',
          margin: 0,
          opacity: 0.85,
          dropShadow: {
            enabled: true,
            top: -3,
            left: 0,
            blur: 4,
            opacity: 0.15
          }
        },
        dataLabels: {
          show: true,
          name: {
            offsetY: -10,
            show: true,
            color: theme.palette.text.primary,
            fontSize: '13px',
            fontWeight: 600
          },
          value: {
            formatter: function (val) {
              return val + "%";
            },
            color: theme.palette.text.primary,
            fontSize: '24px',
            fontWeight: 600,
            show: true,
            offsetY: 5
          }
        }
      }
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark',
        type: 'horizontal',
        shadeIntensity: 0.5,
        gradientToColors: ['#FA896B', '#FFAE1F', '#2CD9C5'],
        inverseColors: false,
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 50, 100]
      }
    },
    stroke: {
      lineCap: 'round',
      width: 3
    },
    labels: ['Performance'],
    grid: {
      padding: {
        top: 25,
        bottom: 25,
        left: 0,
        right: 0
      }
    }
  };

  const gaugeSeries = [67];

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
        Sales Estimator
      </Typography>

      {/* Content */}
      <Box>
        {/* Input Fields Row */}
        <Box mb={{ xs: 3, sm: 4 }}>
          <Stack 
            direction={{ xs: 'column', sm: 'row' }}
            spacing={{ xs: 3, sm: 3, md: 4 }}
            alignItems={{ xs: 'stretch', sm: 'flex-start' }}
          >
            {/* Sales Input */}
            <Box
              sx={{ 
                width: { xs: '100%', sm: '200px', md: '240px' },
                flex: { sm: '0 0 200px', md: '0 0 240px' }
              }}
            >
              <Stack spacing={1}>
                <Typography 
                  sx={{ 
                    fontSize: { xs: '12px', sm: '13px' }, 
                    color: 'text.secondary',
                    fontWeight: 500,
                    height: '20px',
                    lineHeight: '20px'
                  }}
                >
                  Number of sales (PCS)
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  height: '35px',
                  position: 'relative'
                }}>
                  <SalesEstimatorInput
                    label="Number of sales"
                    value={totalPieces}
                    onChange={(value) => {
                      setTotalPieces(value);
                      onDistributionChange(calculateDistributions(value, sliderValue));
                    }}
                    showLabel={false}
                  />
                  <Typography 
                    sx={{ 
                      fontSize: '13px',
                      color: 'text.secondary',
                      userSelect: 'none',
                      pl: 0.5,
                      position: 'absolute',
                      right: { xs: 8, sm: 12 }
                    }}
                  >
                    PCS
                  </Typography>
                </Box>
              </Stack>
            </Box>

            {/* Distribution Slider */}
            <Box sx={{ flex: 1 }}>
              <Stack spacing={1}>
                <Stack 
                  direction="row" 
                  justifyContent="space-between"
                  sx={{ 
                    height: '20px',
                    '& > *': {
                      width: { xs: '80px', sm: '100px', md: '120px' },
                      textAlign: 'center',
                      fontSize: { xs: '11px', sm: '12px', md: '13px' },
                      color: 'text.secondary',
                      fontWeight: 500,
                      lineHeight: '20px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }
                  }}
                >
                  <Typography>FBM-NonGenius</Typography>
                  <Typography>FBM-Genius</Typography>
                  <Typography>FBE</Typography>
                </Stack>
                <Box sx={{ height: '35px', display: 'flex', alignItems: 'center' }}>
                  <CustomSlider
                    ref={sliderRef}
                    value={sliderValue}
                    onChange={handleSliderChange}
                    valueLabelDisplay="on"
                    valueLabelFormat={(value) => `${value}%`}
                  />
                </Box>
                <Stack 
                  direction="row"
                  spacing={{ xs: 1, sm: 2 }}
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ 
                    mt: { xs: 1, sm: 0.5 }
                  }}
                >
                  {(['FBM-NonGenius', 'FBM-Genius', 'FBE'] as CalculatorType[]).map((type) => (
                  <Box
                    key={type}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      height: '35px',
                      position: 'relative',
                      width: { xs: '32%', sm: '100px', md: '120px' },
                      minWidth: '90px'
                    }}
                  >
                    <SalesEstimatorInput
                      label={`${type} pieces`}
                      value={distributions[type].pieces}
                      onChange={(value) => handlePiecesChange(type, value)}
                      showLabel={false}
                    />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        position: 'absolute',
                        right: { xs: 4, sm: 8 },
                        fontSize: { xs: '9px', sm: '11px' },
                        whiteSpace: 'nowrap'
                      }}
                    >
                      ({distributions[type].percent.toFixed(2)}%)
                    </Typography>
                  </Box>
                ))}
                </Stack>
              </Stack>
            </Box>
          </Stack>
        </Box>

        {/* Metrics Cards */}
        <Grid container spacing={{ xs: 2, sm: 2, md: 2 }} mb={3}>
          {[
            { label: 'Total Revenue', value: totalRevenue, percent: '100.00%' },
            { label: 'Total Expense', value: totalExpense, percent: totalRevenue !== 0 ? `${(Math.abs(totalExpense) / totalRevenue * 100).toFixed(2)}%` : '0.00%' },
            { label: 'Total Taxes', value: totalTaxes, percent: `${taxPercentage.toFixed(2)}%` },
            { label: 'Total VAT to be paid', value: totalVatToBePaid, percent: `${vatPercentage.toFixed(2)}%` },
            { label: 'Total Net Profit', value: totalNetProfit, percent: `${netProfitPercentage.toFixed(2)}%` }
          ].map((metric) => (
            <Grid item xs={12} sm={6} md={2.4} key={metric.label}>
              <Card 
                sx={{ 
                  p: { xs: 1.5, sm: 2 }, 
                  bgcolor: theme.palette.mode === 'dark' 
                    ? 'rgba(0, 0, 0, 0.1)' 
                    : 'grey.50',
                  backdropFilter: 'blur(4px)',
                  border: '1px solid',
                  borderColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.1)' 
                    : 'divider',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                  <Typography 
                  variant="subtitle2" 
                    sx={{ 
                    color: 'text.secondary',
                    fontSize: { xs: '11px', sm: '12px' },
                    mb: { xs: 0.5, sm: 1 }
                    }}
                  >
                    {metric.label}
                  </Typography>
                <Stack 
                  direction="row" 
                  alignItems="center" 
                  spacing={1}
                  sx={{
                    flexWrap: { xs: 'wrap', sm: 'nowrap' }
                  }}
                >
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: 'text.primary',
                      fontSize: { xs: '14px', sm: '16px' },
                      fontWeight: 600
                    }}
                  >
                    lei {metric.value.toFixed(2)}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: 'text.secondary',
                      fontSize: { xs: '10px', sm: '11px' }
                    }}
                  >
                    ({metric.percent})
                  </Typography>
                </Stack>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Charts Grid */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ 
              p: { xs: 1.5, sm: 2 },
              height: { xs: '400px', sm: '450px' },
              display: 'flex',
              flexDirection: 'column'
            }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: { xs: 1.5, sm: 2 }, 
                  fontSize: { xs: '13px', sm: '14px' }
                }}
              >
                Revenue Distribution
              </Typography>
              <Box sx={{ 
                flex: 1,
                minHeight: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                '& .apexcharts-canvas': {
                  margin: '0 auto !important',
                  width: '100% !important',
                  height: '100% !important'
                }
              }}>
                <Chart
                  options={{
                    ...donutOptions,
                    chart: {
                      ...donutOptions.chart,
                      height: '100%'
                    }
                  }}
                  series={donutSeries}
                  type="donut"
                  height="100%"
                  width="100%"
                />
              </Box>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ 
              p: { xs: 1.5, sm: 2 },
              height: { xs: '400px', sm: '450px' },
              display: 'flex',
              flexDirection: 'column'
            }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: { xs: 1.5, sm: 2 }, 
                  fontSize: { xs: '13px', sm: '14px' }
                }}
              >
                Overall Performance
              </Typography>
              <Box sx={{ 
                flex: 1,
                minHeight: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                '& .apexcharts-canvas': {
                  margin: '0 auto !important',
                  width: '100% !important',
                  height: '100% !important'
                }
              }}>
                <Chart
                  options={{
                    ...gaugeOptions,
                    chart: {
                      ...gaugeOptions.chart,
                      height: '100%',
                      offsetY: 0
                    },
                    plotOptions: {
                      ...gaugeOptions.plotOptions,
                      radialBar: {
                        ...gaugeOptions.plotOptions?.radialBar,
                        startAngle: -135,
                        endAngle: 135,
                        hollow: {
                          margin: 0,
                          size: '75%',
                          background: theme.palette.background.paper,
                          position: 'front'
                        },
                        track: {
                          background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                          strokeWidth: '100%',
                          margin: 0
                        },
                        dataLabels: {
                          show: true,
                          name: {
                            show: true,
                            fontSize: '18px',
                            fontWeight: 600,
                            offsetY: -15,
                            color: theme.palette.text.primary
                          },
                          value: {
                            show: true,
                            fontSize: '36px',
                            fontWeight: 600,
                            offsetY: 10,
                            color: theme.palette.text.primary,
                            formatter: function (val) {
                              return val + "%";
                            }
                          }
                        }
                      }
                    },
                    grid: {
                      padding: {
                        top: 45,
                        right: 15,
                        bottom: 45,
                        left: 15
                      }
                    }
                  }}
                  series={gaugeSeries}
                  type="radialBar"
                  height="100%"
                  width="100%"
                />
              </Box>
              <Stack 
                direction="row" 
                spacing={2} 
                alignItems="center"
                justifyContent="center"
                sx={{ mt: 2 }}
              >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: '#FA896B',
                          mr: 0.5
                        }}
                      />
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: theme.palette.text.primary, 
                      fontWeight: 500,
                      fontSize: '11px'
                    }}
                  >
                    Poor
                  </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: '#FFAE1F',
                          mr: 0.5
                        }}
                      />
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: theme.palette.text.primary, 
                      fontWeight: 500,
                      fontSize: '11px'
                    }}
                  >
                    Average
                  </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: '#2CD9C5',
                          mr: 0.5
                        }}
                      />
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: theme.palette.text.primary, 
                      fontWeight: 500,
                      fontSize: '11px'
                    }}
                  >
                    Good
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default SalesEstimator; 