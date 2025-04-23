import React from 'react';
import dynamic from "next/dynamic";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });
import { Box, Typography, useTheme, Chip, Stack } from '@mui/material';
import { IconTrendingUp, IconTrendingDown } from '@tabler/icons-react';
import { ApexOptions } from 'apexcharts';
import { alpha } from '@mui/material/styles';

interface ProductPerformanceProps {
  data: {
    id: string;
    name: string;
    averagePrice: number;
    sold: number;
    refunded: number;
    grossRevenue: number;
    costOfGoods: number;
    emagCommission: number;
    profitMargin: number;
  }[];
  isLoading?: boolean;
}

const ProductPerformanceChart: React.FC<ProductPerformanceProps> = ({
  data,
  isLoading = false
}) => {
  const theme = useTheme();
  
  // Sort products by revenue (descending) and take top 5
  const topProducts = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    return [...data]
      .sort((a, b) => b.grossRevenue - a.grossRevenue)
      .slice(0, 5);
  }, [data]);
  
  // Extract data for chart
  const productNames = topProducts.map(item => item.name.length > 15 
    ? item.name.substring(0, 15) + '...' 
    : item.name);
  const revenueValues = topProducts.map(item => item.grossRevenue);
  const profitValues = topProducts.map(item => item.grossRevenue * (item.profitMargin / 100));
  
  // Calculate totals
  const totalRevenue = revenueValues.reduce((acc, curr) => acc + curr, 0);
  const totalSold = topProducts.reduce((acc, curr) => acc + curr.sold, 0);
  const totalRefunded = topProducts.reduce((acc, curr) => acc + curr.refunded, 0);
  const refundRate = totalSold > 0 ? (totalRefunded / totalSold) * 100 : 0;
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'RON',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Chart options
  const chartOptions: ApexOptions = {
    chart: {
      type: 'bar',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      foreColor: theme.palette.mode === 'dark' ? '#adb0bb' : '#2A3547',
      toolbar: {
        show: false,
      },
      parentHeightOffset: 0,
      offsetX: 0,
      offsetY: -15,
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350
        }
      },
      stacked: false,
    },
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: '65%',
        borderRadius: 6,
        distributed: false,
        columnWidth: '70%',
        dataLabels: {
          position: 'top',
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent']
    },
    grid: {
      padding: {
        top: -25,
        bottom: -20,
        left: -5,
        right: -5
      }
    },
    colors: [theme.palette.primary.main, alpha(theme.palette.success.main, 0.85)],
    xaxis: {
      categories: productNames,
      labels: {
        show: true,
        trim: true,
        style: {
          fontSize: '13px',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        },
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      min: 0
    },
    yaxis: {
      labels: {
        show: true,
        style: {
          fontSize: '13px',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }
      }
    },
    tooltip: {
      theme: theme.palette.mode,
      x: { show: false },
      y: {
        formatter: (val) => formatCurrency(val),
      },
      style: {
        fontSize: '12px',
        fontFamily: theme.typography.fontFamily
      }
    },
    legend: {
      show: true,
      position: 'top',
      fontSize: '14px',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      offsetY: 0,
      horizontalAlign: 'center',
      markers: {
        radius: 8,
        width: 10,
        height: 10
      },
      itemMargin: {
        horizontal: 15
      }
    }
  };
  
  const series = [
    {
      name: 'Revenue',
      data: revenueValues
    },
    {
      name: 'Profit',
      data: profitValues
    }
  ];
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack 
        direction="row" 
        spacing={3} 
        justifyContent="space-between" 
        alignItems="center"
        mb={2}
        px={1}
      >
        <Box>
          <Typography variant="subtitle2" color="textSecondary">Total Revenue</Typography>
          <Typography variant="h5" fontWeight={600}>
            {formatCurrency(totalRevenue)}
          </Typography>
        </Box>
        <Box>
          <Typography variant="subtitle2" color="textSecondary">Refund Rate</Typography>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Typography variant="h5" fontWeight={600} color={refundRate > 5 ? 'error.main' : 'success.main'}>
              {refundRate.toFixed(1)}%
            </Typography>
            {refundRate > 5 ? (
              <IconTrendingUp size={16} color={theme.palette.error.main} />
            ) : (
              <IconTrendingDown size={16} color={theme.palette.success.main} />
            )}
          </Stack>
        </Box>
      </Stack>
      
      <Box sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        width: '100%', 
        minHeight: 320,
        mx: -3,
        position: 'relative',
        maxWidth: {
          xs: 'calc(100% + 24px)',
          sm: 'calc(100% + 24px)',
          md: 'calc(100% + 30px)'
        }
      }}>
        {isLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <Typography variant="body2">Loading chart data...</Typography>
          </Box>
        ) : topProducts.length > 0 ? (
          <Chart
            options={chartOptions}
            series={series}
            type="bar"
            height="100%"
            width="120%"
          />
        ) : (
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <Typography variant="body2" color="textSecondary">No product data available</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ProductPerformanceChart; 