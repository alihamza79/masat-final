import React from 'react';
import { Grid, Card, Typography, Box, Stack, useTheme } from '@mui/material';
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';
import { useTranslation } from 'react-i18next';

// Dynamically import Chart component to avoid SSR issues
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface ChartSectionProps {
  donutOptions: ApexOptions;
  donutSeries: number[];
  gaugeOptions: ApexOptions;
  gaugeSeries: number[];
}

const ChartSection: React.FC<ChartSectionProps> = ({
  donutOptions,
  donutSeries,
  gaugeOptions,
  gaugeSeries
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  // Define custom legend colors that match the chart
  const legendItems = [
    { name: t('calculator.salesEstimator.totalRevenue'), color: '#2CD9C5' },
    { name: t('calculator.salesEstimator.totalExpense'), color: '#FA896B' },
    { name: t('calculator.salesEstimator.totalTaxes'), color: '#FFAE1F' },
    { name: t('calculator.salesEstimator.totalVAT'), color: '#5D87FF' },
    { name: t('calculator.salesEstimator.totalProfit'), color: '#49BEFF' }
  ];

  return (
    <Grid container spacing={3}>
      {/* Distribution Chart */}
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
            {t('calculator.salesEstimator.distribution')}
          </Typography>
          <Box sx={{ 
            flex: 1,
            minHeight: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            '& .apexcharts-canvas': {
              margin: '0 auto !important',
              width: '100% !important',
              height: '100% !important'
            },
            // Hide the built-in legend
            '& .apexcharts-legend': {
              display: 'none !important'
            }
          }}>
            <Chart
              options={{
                ...donutOptions,
                chart: {
                  ...donutOptions.chart,
                  height: '100%'
                },
                legend: {
                  show: false // Hide the built-in legend
                }
              }}
              series={donutSeries}
              type="donut"
              height="100%"
              width="100%"
            />
          </Box>
          
          {/* Custom Legend */}
          <Stack 
            direction="row" 
            spacing={0.5}
            flexWrap="wrap"
            justifyContent="center"
            sx={{ 
              mt: 1,
              mx: 'auto',
              maxWidth: '100%'
            }}
          >
            {legendItems.map((item) => (
              <Box 
                key={item.name}
                sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  mx: 1,
                  my: 0.5
                }}
              >
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    bgcolor: item.color,
                    mr: 0.75,
                    flexShrink: 0
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '12px',
                    lineHeight: 1.2,
                    color: theme.palette.text.primary,
                    fontWeight: 500,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {item.name}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Card>
      </Grid>

      {/* Performance Gauge Chart */}
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
            {t('calculator.salesEstimator.overallPerformance')}
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
                },
                plotOptions: {
                  ...gaugeOptions.plotOptions,
                  radialBar: {
                    ...gaugeOptions.plotOptions?.radialBar,
                    startAngle: -135,
                    endAngle: 135,
                    hollow: {
                      margin: 0,
                      size: '75%',
                      background: theme.palette.background.paper,
                      position: 'front'
                    },
                    track: {
                      background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                      strokeWidth: '100%',
                      margin: 0
                    },
                    dataLabels: {
                      show: true,
                      name: {
                        show: true,
                        fontSize: '18px',
                        fontWeight: 600,
                        offsetY: -15,
                        color: theme.palette.text.primary
                      },
                      value: {
                        show: true,
                        fontSize: '36px',
                        fontWeight: 600,
                        offsetY: 10,
                        color: theme.palette.text.primary,
                        formatter: function (val) {
                          return val + "%";
                        }
                      }
                    }
                  }
                },
                grid: {
                  padding: {
                    top: 45,
                    right: 15,
                    bottom: 45,
                    left: 15
                  }
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
                {t('calculator.salesEstimator.poor')}
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
                {t('calculator.salesEstimator.average')}
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
                {t('calculator.salesEstimator.good')}
              </Typography>
            </Box>
          </Stack>
        </Card>
      </Grid>
    </Grid>
  );
};

export default ChartSection; 