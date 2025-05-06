import React from 'react';
import dynamic from "next/dynamic";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });
import { Box, useTheme, Typography, Stack, Skeleton } from '@mui/material';
import { useTranslation } from 'react-i18next';

// Create OrdersByIntegrationSkeleton component
export const OrdersByIntegrationSkeleton = () => {
  const theme = useTheme();
  
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      width: '100%', 
      height: '100%',
      p: 1
    }}>
      {/* Main donut skeleton */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        width: '100%', 
        mb: 2,
        position: 'relative',
        pt: 2
      }}>
        <Skeleton 
          variant="circular" 
          width={200} 
          height={200} 
          sx={{ position: 'relative' }} 
        />
        
        {/* Center label */}
        <Box 
          sx={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            textAlign: 'center'
          }}
        >
          <Skeleton variant="text" width={50} height={30} sx={{ mx: 'auto' }} />
          <Skeleton variant="text" width={80} height={20} sx={{ mx: 'auto' }} />
        </Box>
      </Box>
      
      {/* Legend items */}
      <Stack direction="column" spacing={1} width="100%">
        {Array(3).fill(0).map((_, i) => (
          <Box 
            key={i} 
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              p: 1,
              borderRadius: 1
            }}
          >
            <Skeleton variant="circular" width={10} height={10} sx={{ mr: 1 }} />
            <Skeleton variant="text" width={120} height={20} sx={{ flexGrow: 1 }} />
            <Skeleton variant="text" width={30} height={20} />
          </Box>
        ))}
      </Stack>
    </Box>
  );
};

interface OrdersByIntegrationProps {
  data: {
    integrationName: string;
    ordersCount: number;
  }[];
  isLoading?: boolean;
  showTitle?: boolean;
}

const OrdersByIntegration: React.FC<OrdersByIntegrationProps> = ({ 
  data,
  isLoading = false,
  showTitle = false
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  
  // Extract data for chart
  const integrationNames = data.map(item => item.integrationName);
  const orderCounts = data.map(item => item.ordersCount);
  
  // Generate colors based on the number of integrations
  const generateColors = (count: number) => {
    const baseColors = [
      theme.palette.primary.main,
      theme.palette.success.main,
      theme.palette.warning.main,
      theme.palette.error.main,
      theme.palette.secondary.main,
      theme.palette.info.main,
    ];
    
    // If we have more integrations than base colors, generate more colors
    if (count <= baseColors.length) {
      return baseColors.slice(0, count);
    }
    
    // Generate more colors by adjusting opacity
    const extraColors = [];
    for (let i = 0; i < count - baseColors.length; i++) {
      const baseColorIndex = i % baseColors.length;
      const opacity = 0.7 - (i / (count * 2)); // Gradually decrease opacity
      extraColors.push(baseColors[baseColorIndex] + Math.floor(opacity * 255).toString(16));
    }
    
    return [...baseColors, ...extraColors];
  };
  
  const chartColors = generateColors(data.length);
  
  // Chart options
  const chartOptions: any = {
    chart: {
      type: 'pie',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      foreColor: theme.palette.mode === 'dark' ? '#adb0bb' : '#2A3547',
      toolbar: {
        show: false,
      },
    },
    labels: integrationNames,
    colors: chartColors,
    dataLabels: {
      enabled: true,
      formatter: function (val: number) {
        return val.toFixed(1) + '%';
      },
      style: {
        fontSize: '12px',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontWeight: 400,
      },
      dropShadow: {
        enabled: false,
      }
    },
    legend: {
      show: true,
      position: 'bottom',
      fontSize: '12px',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontWeight: 400,
      itemMargin: {
        horizontal: 10,
        vertical: 5
      },
    },
    stroke: {
      show: false,
    },
    plotOptions: {
      pie: {
        donut: {
          size: '0%',
        },
        expandOnClick: true
      }
    },
    tooltip: {
      theme: theme.palette.mode === 'dark' ? 'dark' : 'light',
      fillSeriesColor: false,
      y: {
        formatter: function(value: number) {
          return value + ' orders';
        }
      }
    },
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          height: 280
        },
        legend: {
          position: 'bottom'
        }
      }
    }]
  };
  
  return (
    <Box>
      {showTitle && (
        <Box mb={2}>
          <Typography variant="h5">{t('dashboard.charts.channelDistribution.title')}</Typography>
          <Typography variant="subtitle2" color="textSecondary">
            {t('dashboard.charts.channelDistribution.subtitle')}
          </Typography>
        </Box>
      )}
      <Box 
        sx={{ 
          height: 350, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          width: '100%'
        }}
      >
        {isLoading ? (
          <OrdersByIntegrationSkeleton />
        ) : (
          data.length > 0 ? (
            <Box sx={{ 
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%'
            }}>
              <Chart
                options={chartOptions}
                series={orderCounts}
                type="pie"
                height="350"
                width="100%"
              />
            </Box>
          ) : (
            <Box>{t('dashboard.products.noProductData')}</Box>
          )
        )}
      </Box>
    </Box>
  );
};

export default OrdersByIntegration; 