import React from 'react';
import dynamic from "next/dynamic";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });
import { Box, Stack, Typography, useTheme } from '@mui/material';
import DashboardCard from '../../shared/DashboardCard';

interface DistributionData {
  name: string;
  value: number;
}

interface DistributionChartProps {
  title: string;
  subtitle?: string;
  data: DistributionData[];
  isLoading?: boolean;
}

const DistributionChart: React.FC<DistributionChartProps> = ({
  title,
  subtitle,
  data,
  isLoading = false
}) => {
  const theme = useTheme();
  
  // Extract data for chart
  const labels = data.map(item => item.name);
  const values = data.map(item => item.value);
  const total = values.reduce((acc, val) => acc + val, 0);
  
  // Set colors based on the theme
  const primaryColor = theme.palette.primary.main;
  const secondaryColor = theme.palette.secondary.main;
  const colors = [primaryColor, secondaryColor, 
    theme.palette.success.main, theme.palette.warning.main,
    theme.palette.error.main, theme.palette.info.main];
  
  // Chart options
  const chartOptions: any = {
    chart: {
      type: 'donut',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      foreColor: theme.palette.mode === 'dark' ? '#adb0bb' : '#2A3547',
      toolbar: {
        show: false,
      },
    },
    labels,
    colors: colors.slice(0, data.length),
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
      show: false,
    },
    stroke: {
      width: 0,
    },
    plotOptions: {
      pie: {
        donut: {
          size: '60%',
          labels: {
            show: true,
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
      theme: theme.palette.mode === 'dark' ? 'dark' : 'light',
      fillSeriesColor: false,
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
    }
  };
  
  return (
    <DashboardCard 
      title={title}
      subtitle={subtitle}
    >
      <Box 
        sx={{ 
          height: 290, 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'space-between',
          mt: 2 
        }}
      >
        {isLoading ? (
          <Box>Loading...</Box>
        ) : (
          data.length > 0 ? (
            <>
              <Chart
                options={chartOptions}
                series={values}
                type="donut"
                height="220"
                width="100%"
              />
              
              <Stack 
                direction="row" 
                spacing={3}
                mt={2}
                justifyContent="center"
                alignItems="center"
              >
                {data.map((item, index) => (
                  <Stack
                    key={index}
                    direction="row"
                    spacing={1}
                    alignItems="center"
                  >
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        bgcolor: colors[index % colors.length],
                        borderRadius: '50%',
                      }}
                    />
                    <Typography variant="caption" fontWeight={500}>
                      {item.name}: {((item.value / total) * 100).toFixed(1)}%
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </>
          ) : (
            <Box>No data available</Box>
          )
        )}
      </Box>
    </DashboardCard>
  );
};

export default DistributionChart; 