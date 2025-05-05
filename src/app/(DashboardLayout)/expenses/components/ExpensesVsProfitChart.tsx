'use client';
import { Card, CardContent, Typography, Box, useMediaQuery, Skeleton, CircularProgress } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import dynamic from 'next/dynamic';
import useExpenses, { Expense } from '@/lib/hooks/useExpenses';
import { useMemo, useState } from 'react';
import { isThisYear, getMonth, format, parseISO } from 'date-fns';
import dashboardService, { DASHBOARD_QUERY_KEY } from '@/lib/services/dashboardService';
import { useIntegrations } from '@/lib/hooks/useIntegrations';
import { useQuery } from '@tanstack/react-query';
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const ExpensesVsProfitChart = ({ fullHeight = false, height }: { fullHeight?: boolean, height?: number }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Get current year for the chart title
  const currentYear = new Date().getFullYear();
  
  // Fetch expense data
  const { expenses, isLoading: isLoadingExpenses } = useExpenses();
  
  // Get integrations for dashboard data
  const { integrations, isLoading: isLoadingIntegrations } = useIntegrations();
  
  // Prepare date range for current year
  const startDate = format(new Date(currentYear, 0, 1), 'yyyy-MM-dd');
  const endDate = format(new Date(currentYear, 11, 31), 'yyyy-MM-dd');
  
  // Use React Query to fetch dashboard data
  const { data: dashboardData, isLoading: isLoadingDashboard } = useQuery({
    queryKey: [...DASHBOARD_QUERY_KEY, startDate, endDate, integrations ? integrations.map(i => i._id) : []],
    queryFn: async () => {
      if (!integrations || integrations.length === 0) {
        return { success: true, data: { salesOverTime: [] } };
      }
      
      // Get all integration IDs
      const integrationIds = integrations.map(int => int._id as string);
      
      // Fetch dashboard data
      return dashboardService.getDashboardData(startDate, endDate, integrationIds);
    },
    enabled: !isLoadingIntegrations && integrations && integrations.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Extract profit and revenue data from dashboard data
  const { profitData, revenueData } = useMemo(() => {
    // Initialize monthly arrays
    const monthlyProfit = Array(12).fill(0);
    const monthlyRevenue = Array(12).fill(0);
    
    if (dashboardData?.success && dashboardData.data?.salesOverTime) {
      // Process salesOverTime data to extract monthly profit
      dashboardData.data.salesOverTime.forEach(item => {
        try {
          // Check if the date is a full date string (YYYY-MM-DD)
          if (item.date && item.date.includes('-') && !item.date.includes('Q')) {
            const date = parseISO(item.date);
            const month = getMonth(date);
            monthlyProfit[month] += item.profit;
            monthlyRevenue[month] += item.revenue;
          }
        } catch (error) {
          console.error('Error processing date:', item.date, error);
        }
      });
    }
    
    return {
      profitData: monthlyProfit,
      revenueData: monthlyRevenue
    };
  }, [dashboardData]);
  
  const isLoading = isLoadingExpenses || isLoadingDashboard || isLoadingIntegrations;

  // Calculate monthly expenses for the current year
  const monthlyData = useMemo(() => {
    // Initialize arrays with zeros for all 12 months
    const expensesData = Array(12).fill(0);
    
    // Process real expenses data
    if (expenses && expenses.length > 0) {
      expenses.forEach((expense: Expense) => {
        const expenseDate = new Date(expense.date);
        
        // Only include expenses from the current year
        if (isThisYear(expenseDate)) {
          const month = getMonth(expenseDate);
          expensesData[month] += expense.amount;
        }
      });
    }
    
    return {
      expenses: expensesData,
      profit: profitData,
      revenue: revenueData
    };
  }, [expenses, profitData, revenueData]);

  // Prepare chart data
  const series = [
    {
      name: 'Expenses',
      data: monthlyData.expenses,
    },
    {
      name: 'Profit',
      data: monthlyData.profit,
    }
  ];

  // Original legend items
  const legendItems = [
    { name: 'Expenses', color: theme.palette.error.main },
    { name: 'Profit', color: theme.palette.success.main }
  ];

  // Calculate min and max values for y-axis with some padding
  const allValues = [...monthlyData.expenses, ...monthlyData.profit];
  const maxValue = Math.max(...allValues, 10000) * 1.2; // Add 20% padding
  // Allow for negative values - find the minimum value and add 20% padding
  const minValue = Math.min(...allValues) < 0 
    ? Math.min(...allValues) * 1.2 // Add 20% padding for negative values
    : 0; // Keep 0 as minimum if no negative values

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
      yaxis: {
        lines: {
          show: true,
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
        formatter: (value: number) => {
          // Handle negative values with appropriate formatting
          const absValue = Math.abs(value);
          const prefix = value < 0 ? '-' : '';
          return `${prefix}${(absValue / 1000).toFixed(0)}k${isMobile ? '' : ' RON'}`;
        },
        offsetX: -5,
      },
      tickAmount: 7,
      min: minValue,
      max: maxValue,
      forceNiceScale: true,
      // Add a zero line if we have negative values
      crosshairs: {
        show: true,
        position: 'back',
        stroke: {
          color: theme.palette.divider,
          width: 1,
          dashArray: 0,
        },
      },
    },
    tooltip: {
      y: {
        formatter: (value: number) => {
          // Format with a minus sign for negative values
          const absValue = Math.abs(value);
          const prefix = value < 0 ? '-' : '';
          return `${prefix}${absValue.toLocaleString()} RON`;
        }
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
      show: false, // Hide default legend as we'll use custom one
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
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'row', 
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: { xs: 2, sm: 2 } 
        }}>
          <Typography 
            variant="h5" 
            fontWeight={800} 
            sx={{ 
              fontSize: isMobile ? '1.1rem' : undefined
            }}
          >
            Expenses vs Profit {currentYear}
          </Typography>
          
          {/* Custom legend */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'row',
            alignItems: 'center',
            gap: 2
          }}>
            {legendItems.map((item, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: item.color
                  }}
                />
                <Typography variant="caption" fontWeight={500}>
                  {item.name}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
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
              <Skeleton 
                variant="rectangular" 
                width="100%" 
                height={chartHeight} 
                animation="wave"
                sx={{
                  borderRadius: 1,
                  bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                }}
              />
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