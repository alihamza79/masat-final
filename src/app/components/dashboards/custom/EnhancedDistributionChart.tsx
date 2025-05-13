import React, { ReactElement } from 'react';
import dynamic from "next/dynamic";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });
import { 
  Box, 
  Typography, 
  useTheme, 
  Stack,
  Chip,
  Skeleton
} from '@mui/material';

interface DistributionData {
  name: string;
  value: number;
  color?: string;
  icon?: ReactElement;
}

interface EnhancedDistributionChartProps {
  data: DistributionData[];
  isLoading?: boolean;
  title?: string;
  height?: number | string;
}

export const EnhancedDistributionChartSkeleton = ({ height = 280 }: { height?: number | string }) => {
  const theme = useTheme();
  
  return (
    <Box sx={{ 
      width: '100%', 
      height: height, 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative'
    }}>
      {/* Chart title */}
      <Skeleton variant="text" width={120} height={24} sx={{ mb: 2 }} />
      
      {/* Donut chart */}
      <Box sx={{ position: 'relative', height: '70%', width: '70%' }}>
        <Skeleton variant="circular" width="100%" height="100%" />
        
        {/* Center label */}
        <Box sx={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          textAlign: 'center'
        }}>
          <Skeleton variant="text" width={40} height={30} sx={{ mx: 'auto' }} />
        </Box>
      </Box>
      
      {/* Legend */}
      <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center' }}>
        {[1, 2].map(item => (
          <Box key={item} sx={{ display: 'flex', alignItems: 'center' }}>
            <Skeleton variant="circular" width={12} height={12} sx={{ mr: 1 }} />
            <Skeleton variant="text" width={40} height={16} />
          </Box>
        ))}
      </Box>
    </Box>
  );
};

const EnhancedDistributionChart: React.FC<EnhancedDistributionChartProps> = ({
  data,
  isLoading = false,
  title,
  height = 280
}) => {
  const theme = useTheme();
  
  // Show skeleton loader when loading
  if (isLoading) {
    return <EnhancedDistributionChartSkeleton height={height} />;
  }
  
  // Extract data for chart
  const labels = data.map(item => item.name);
  const values = data.map(item => item.value);
  const total = values.reduce((acc, val) => acc + val, 0);
  
  // Default colors based on the theme
  const primaryColor = theme.palette.primary.main;
  const secondaryColor = theme.palette.secondary.main;
  const defaultColors = [
    primaryColor, 
    secondaryColor, 
    theme.palette.success.main, 
    theme.palette.warning.main,
    theme.palette.error.main, 
    theme.palette.info.main
  ];
  
  // Use custom colors if provided
  const colors = data.map((item, index) => 
    item.color || defaultColors[index % defaultColors.length]
  );
  
  // Chart options
  const chartOptions: any = {
    chart: {
      type: 'donut',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      foreColor: theme.palette.mode === 'dark' ? '#adb0bb' : '#2A3547',
      toolbar: {
        show: false,
      },
      animations: {
        enabled: true,
        speed: 500,
        animateGradually: {
          enabled: true,
          delay: 150
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350
        }
      }
    },
    labels,
    colors,
    legend: {
      show: true,
      position: 'bottom',
      fontSize: '12px',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontWeight: 400,
      formatter: function(seriesName: string, opts: any) {
        // Get the percentage value
        const percent = opts.w.globals.series[opts.seriesIndex] / total * 100;
        // Format with 1 decimal place
        return `${seriesName.split(':')[0]}: ${percent.toFixed(1)}%`;
      },
      itemMargin: {
        horizontal: 15,
        vertical: 5
      },
      horizontalAlign: 'center',
      width: 'auto',
      offsetY: 8,
      floating: false,
      onItemClick: {
        toggleDataSeries: true
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      width: 0,
    },
    fill: {
      opacity: 1,
    },
    states: {
      hover: {
        filter: {
          type: 'none',
        }
      },
      active: {
        filter: {
          type: 'none',
        }
      },
    },
    plotOptions: {
      pie: {
        expandOnClick: true,
        donut: {
          size: '70%',
          background: 'transparent',
          labels: {
            show: true,
            name: {
              show: false,
            },
            total: {
              show: true,
              showAlways: true,
              label: 'Total',
              fontSize: '16px',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 600,
              color: theme.palette.text.primary,
              formatter: function() {
                return total.toString();
              }
            },
            value: {
              show: true,
              fontSize: '22px',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 600,
              color: theme.palette.text.primary,
              offsetY: 0,
            }
          }
        }
      }
    },
    tooltip: {
      enabled: true,
      theme: theme.palette.mode === 'dark' ? 'dark' : 'light',
      fillSeriesColor: false,
      style: {
        fontSize: '12px',
      },
      y: {
        formatter: function(value: number) {
          return value.toString();
        }
      }
    },
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          height: 250
        },
        legend: {
          position: 'bottom'
        }
      }
    }]
  };
  
  return (
    <Box sx={{ 
      width: '100%',
      height: height,
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start'
    }}>
      {title && (
        <Typography 
          variant="subtitle1" 
          fontWeight={600} 
          color="textPrimary"
          align="center"
          mb={0.5}
        >
          {title}
        </Typography>
      )}
      
      <Box 
        sx={{ 
          flex: 1,
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          position: 'relative',
          width: '100%',
          pt: 1,
          maxWidth: { xs: '100%', sm: '240px' },
          mx: 'auto'
        }}
      >
        {isLoading ? (
          <Box display="flex" alignItems="center" justifyContent="center" height="100%">
            <Typography variant="body2" color="textSecondary">Loading...</Typography>
          </Box>
        ) : (
          data.length > 0 && total > 0 ? (
            <Box sx={{ 
              width: '100%', 
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'visible',
              '& .apexcharts-legend': {
                overflow: 'visible !important',
                display: 'flex !important',
                justifyContent: 'center !important',
                flexWrap: 'nowrap !important',
                padding: '0 8px !important',
                height: '32px !important',
                width: '100% !important',
                maxWidth: 'none !important'
              },
              '& .apexcharts-legend-series': {
                display: 'inline-flex !important',
                margin: '0 6px !important'
              }
            }}>
              <Chart
                key={`enhanced-distribution-${JSON.stringify(values)}`}
                options={chartOptions}
                series={values}
                type="donut"
                height="100%"
                width="100%"
              />
            </Box>
          ) : (
            <Box display="flex" alignItems="center" justifyContent="center" height="100%">
              <Typography variant="body2" color="textSecondary">No data available</Typography>
            </Box>
          )
        )}
      </Box>
    </Box>
  );
};

export default EnhancedDistributionChart; 