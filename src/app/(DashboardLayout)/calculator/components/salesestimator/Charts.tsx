import React from 'react';
import { Box, Card, Typography, Stack, Grid, useTheme } from '@mui/material';
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';
import { ChartData } from './types';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface ChartsProps {
  chartData: ChartData;
}

const Charts: React.FC<ChartsProps> = ({ chartData }) => {
  const theme = useTheme();

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

  const donutSeries = [
    chartData.totalRevenue,
    chartData.totalExpense,
    chartData.totalTaxes,
    chartData.totalVatToBePaid,
    chartData.totalNetProfit
  ];

  const gaugeSeries = [67]; // This could be calculated based on some performance metric

  return (
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
  );
};

export default Charts; 