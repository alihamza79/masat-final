'use client';
import { Card, CardContent, Typography, Box, useMediaQuery, Skeleton } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import dynamic from 'next/dynamic';
import useExpenses, { Expense } from '@/lib/hooks/useExpenses';
import { useMemo } from 'react';
import { isThisYear, getMonth } from 'date-fns';
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const ExpensesVsProfitChart = ({ fullHeight = false, height }: { fullHeight?: boolean, height?: number }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Fetch expense data
  const { expenses, isLoading } = useExpenses();

  // Calculate monthly expenses for the current year
  const monthlyData = useMemo(() => {
    // Initialize arrays with zeros for all 12 months
    const expensesData = Array(12).fill(0);
    const profitData = Array(12).fill(0); // We don't have real profit data yet
    
    // Process real expenses data
    if (expenses && expenses.length > 0) {
      expenses.forEach((expense: Expense) => {
        const expenseDate = new Date(expense.date);
        
        // Only include expenses from the current year
        if (isThisYear(expenseDate)) {
          const month = getMonth(expenseDate);
          expensesData[month] += expense.amount;
          
          // For now, let's simulate profit as 1.2x expenses
          // This should be replaced with real profit data when available
          profitData[month] += expense.amount * 1.2;
        }
      });
    }
    
    return {
      expenses: expensesData,
      profit: profitData
    };
  }, [expenses]);

  // Prepare chart data
  const series = [
    {
      name: 'Expenses',
      data: monthlyData.expenses,
    },
    {
      name: 'Profit',
      data: monthlyData.profit,
    },
  ];

  // Calculate min and max values for y-axis with some padding
  const allValues = [...monthlyData.expenses, ...monthlyData.profit];
  const maxValue = Math.max(...allValues, 10000) * 1.2; // Add 20% padding
  const minValue = Math.max(0, Math.min(...allValues) * 0.8); // Don't go below zero

  const options = {
    chart: {
      type: 'area' as const,
      stacked: false,
      zoom: {
        enabled: false,
      },
      toolbar: {
        show: false,
      },
      fontFamily: theme.typography.fontFamily,
      background: 'transparent',
      sparkline: {
        enabled: false,
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: 'smooth' as const,
      width: 2,
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        inverseColors: false,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [20, 100, 100, 100],
      },
    },
    grid: {
      borderColor: theme.palette.divider,
      padding: {
        left: 20,
        right: 20,
        top: 5,
        bottom: 20
      },
      xaxis: {
        lines: {
          show: false,
        },
      },
    },
    xaxis: {
      categories: [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ],
      labels: {
        style: {
          colors: theme.palette.text.secondary,
          fontSize: '12px',
        },
        offsetY: 0,
        trim: false,
        hideOverlappingLabels: false,
      },
      axisBorder: {
        color: theme.palette.divider,
      },
      axisTicks: {
        color: theme.palette.divider,
      },
      tickAmount: undefined,
      tickPlacement: 'between',
    },
    yaxis: {
      labels: {
        style: {
          colors: theme.palette.text.secondary,
          fontSize: '12px',
        },
        formatter: (value: number) => `${(value / 1000).toFixed(0)}k${isMobile ? '' : ' RON'}`,
        offsetX: -5,
      },
      tickAmount: 7,
      min: minValue,
      max: maxValue,
      forceNiceScale: true,
    },
    tooltip: {
      y: {
        formatter: (value: number) => `${value.toLocaleString()} RON`,
      },
      theme: theme.palette.mode,
      style: {
        fontSize: '12px',
        fontFamily: theme.typography.fontFamily,
      },
      background: {
        color: theme.palette.background.paper,
      },
    },
    colors: [theme.palette.error.main, theme.palette.success.main],
    legend: {
      fontSize: '14px',
      position: 'top' as const,
      horizontalAlign: 'right' as const,
      offsetY: 0,
      itemMargin: {
        horizontal: 10,
        vertical: 0
      },
      labels: {
        colors: theme.palette.text.primary
      },
      markers: {
        strokeWidth: 0
      }
    },
    responsive: [{
      breakpoint: 600,
      options: {
        legend: {
          fontSize: '12px',
        },
        grid: {
          padding: {
            left: 10,
            right: 10,
            bottom: 15,
          }
        },
        xaxis: {
          labels: {
            style: {
              fontSize: '10px',
            },
          }
        }
      }
    }]
  };

  // Calculate chart height based on container height
  const chartHeight = isMobile 
    ? 300
    : (height && fullHeight) 
      ? height - 80 // account for title, padding, legend, and x-axis labels
      : fullHeight 
        ? '100%' 
        : (height || 500);

  return (
    <Card sx={{ 
      height: fullHeight ? '100%' : undefined,  
      display: 'flex', 
      flexDirection: 'column', 
      p: 2.5, 
      pt: 2,
      pb: 3,
      borderRadius: 2,
    }}>
      <CardContent sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        p: 0, 
        pb: '0 !important',
        height: '100%',
      }}>
        <Typography 
          variant="h5" 
          fontWeight={800} 
          sx={{ 
            mb: { xs: 2, sm: 2 },
            fontSize: isMobile ? '1.1rem' : undefined
          }}
        >
          Expenses vs Profit
        </Typography>
        <Box sx={{ 
          width: '100%', 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100% - 40px)',
        }}>
          {isLoading ? (
            <Box sx={{ 
              width: '100%',
              flex: 1,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Skeleton variant="rectangular" width="100%" height={chartHeight} animation="wave" />
            </Box>
          ) : (
            <Box sx={{ 
              width: '100%',
              flex: 1,
              height: '100%',
            }}>
              <Chart
                options={options}
                series={series}
                type="area"
                height={chartHeight}
                width="100%"
              />
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ExpensesVsProfitChart; 