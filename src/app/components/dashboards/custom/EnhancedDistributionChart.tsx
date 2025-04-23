import React from 'react';
import dynamic from "next/dynamic";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });
import { 
  Box, 
  Typography, 
  useTheme, 
  Stack,
  Chip
} from '@mui/material';

interface DistributionData {
  name: string;
  value: number;
  color?: string;
  icon?: React.ReactNode;
}

interface EnhancedDistributionChartProps {
  data: DistributionData[];
  isLoading?: boolean;
  title?: string;
  height?: number;
}

const EnhancedDistributionChart: React.FC<EnhancedDistributionChartProps> = ({
  data,
  isLoading = false,
  title,
  height = 220
}) => {
  const theme = useTheme();
  
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
      show: false,
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
        expandOnClick: false,
        donut: {
          size: '75%',
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
  };
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {title && (
        <Typography 
          variant="subtitle1" 
          fontWeight={600} 
          color="textPrimary"
          align="center"
          mb={1}
        >
          {title}
        </Typography>
      )}
      
      <Box 
        sx={{ 
          flexGrow: 1,
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          position: 'relative',
          minHeight: height
        }}
      >
        {isLoading ? (
          <Box display="flex" alignItems="center" justifyContent="center" height="100%">
            <Typography variant="body2" color="textSecondary">Loading...</Typography>
          </Box>
        ) : (
          data.length > 0 ? (
            <>
              <Box sx={{ 
                width: '100%', 
                height: height * 0.7,
                position: 'relative'
              }}>
                <Chart
                  options={chartOptions}
                  series={values}
                  type="donut"
                  height="100%"
                  width="100%"
                />
              </Box>
              
              <Stack 
                direction="row" 
                spacing={1}
                justifyContent="center"
                alignItems="center"
                flexWrap="wrap"
                sx={{ 
                  mt: 2,
                  gap: 1
                }}
              >
                {data.map((item, index) => (
                  <Chip
                    key={index}
                    icon={item.icon ? item.icon : undefined}
                    label={`${item.name}: ${((item.value / total) * 100).toFixed(1)}%`}
                    size="small"
                    sx={{
                      borderColor: colors[index],
                      color: colors[index],
                      fontWeight: 500,
                      '& .MuiChip-icon': {
                        color: colors[index]
                      }
                    }}
                    variant="outlined"
                  />
                ))}
              </Stack>
            </>
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