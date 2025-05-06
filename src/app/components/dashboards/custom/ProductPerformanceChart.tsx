import React from 'react';
import dynamic from "next/dynamic";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });
import { Box, Typography, useTheme, Stack, Avatar, Skeleton } from '@mui/material';
import { IconTrendingDown } from '@tabler/icons-react';
import { ApexOptions } from 'apexcharts';

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
    image?: string;
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
  
  // Store both truncated and full product names
  const productData = topProducts.map(item => ({
    fullName: item.name,
    displayName: item.name.length > 25 ? item.name.substring(0, 25) + '...' : item.name,
    revenue: item.grossRevenue
  }));

  // Extract data for chart
  const productNames = productData.map(item => item.displayName);
  const revenueValues = productData.map(item => item.revenue);
  
  // Calculate totals
  const totalRevenue = revenueValues.reduce((acc, curr) => acc + curr, 0);
  const totalSold = topProducts.reduce((acc, curr) => acc + curr.sold, 0);
  const totalRefunded = topProducts.reduce((acc, curr) => acc + curr.refunded, 0);
  const refundRate = totalSold > 0 ? (totalRefunded / totalSold) * 100 : 0;
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value) + ' RON';
  };
  
  // Format currency for x-axis to avoid overlapping
  const formatXAxisCurrency = (value: number) => {
    if (value < 0) return '';
    if (value >= 100000) {
      return `${Math.round(value / 1000)}K`;
    } else if (value >= 10000) {
      return `${Math.round(value / 1000)}K`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
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
      animations: {
        enabled: true,
        speed: 800,
        dynamicAnimation: {
          enabled: true,
          speed: 350
        }
      }
    },
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: '75%',
        borderRadius: 3,
        distributed: false,
        dataLabels: {
          position: 'bottom',
        },
      },
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      show: false
    },
    grid: {
      show: true,
      borderColor: theme.palette.divider,
      strokeDashArray: 4,
      position: 'back',
      xaxis: {
        lines: {
          show: true
        }
      },
      yaxis: {
        lines: {
          show: false
        }
      },
      padding: {
        top: 0,
        right: 0,
        bottom: 5,
        left: 0
      }
    },
    colors: [theme.palette.primary.main],
    xaxis: {
      categories: productNames,
      labels: {
        show: true,
        formatter: function(val) {
          // Format x-axis values as short currency
          return formatXAxisCurrency(Number(val));
        },
        style: {
          fontSize: '12px',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        },
        offsetY: 0
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      crosshairs: {
        show: false
      },
      min: 0,
      max: Math.ceil(Math.max(...revenueValues) * 1.15),
      tickAmount: 5
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
      enabled: true,
      theme: theme.palette.mode,
      x: { show: false },
      marker: { show: false },
      style: {
        fontSize: '12px',
        fontFamily: theme.typography.fontFamily
      },
      y: {
        formatter: function(val) {
          return formatCurrency(val);
        }
      },
      fixed: { enabled: false },
      onDatasetHover: { highlightDataSeries: false }
    },
    legend: {
      show: false
    }
  };
  
  // Simple series with only revenue
  const series = [
    {
      name: 'Revenue',
      data: revenueValues
    }
  ];
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        width: '100%', 
        minHeight: 350,
        position: 'relative',
        pl: 0,
        pr: 0,
        pb: 2,
        pt: 1,
        mx: { xs: -4, sm: -5, md: -6 }
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
            width="135%"
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

// Add skeleton component
export const ProductPerformanceChartSkeleton = () => {
  const theme = useTheme();
  
  return (
    <Box sx={{ 
      width: '100%', 
      p: 1,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center'
    }}>
      {Array(5).fill(0).map((_, i) => (
        <Box 
          key={i} 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: 3, 
            width: '100%'
          }}
        >
          {/* Product image skeleton */}
          <Skeleton 
            variant="rectangular" 
            width={48} 
            height={48} 
            sx={{ 
              borderRadius: 1, 
              flexShrink: 0, 
              mr: 2 
            }} 
          />
          
          <Box sx={{ flexGrow: 1 }}>
            {/* Product name skeleton */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Skeleton variant="text" width="50%" height={20} sx={{ mr: 2 }} />
              <Skeleton variant="text" width="15%" height={20} />
            </Box>
            
            {/* Progress bar skeleton */}
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <Skeleton 
                variant="rectangular" 
                width="90%" 
                height={12} 
                sx={{ 
                  borderRadius: 6
                }}
              />
              <Skeleton variant="text" width="10%" height={16} sx={{ ml: 1 }} />
            </Box>
          </Box>
        </Box>
      ))}
    </Box>
  );
};

export default ProductPerformanceChart; 