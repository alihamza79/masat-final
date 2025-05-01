import React from 'react';
import dynamic from "next/dynamic";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });
import { Box, useTheme, Typography } from '@mui/material';

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
          <Typography variant="h5">Orders by Integration</Typography>
          <Typography variant="subtitle2" color="textSecondary">
            Distribution of orders across different integrations
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
          <Box>Loading...</Box>
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
            <Box>No data available</Box>
          )
        )}
      </Box>
    </Box>
  );
};

export default OrdersByIntegration; 