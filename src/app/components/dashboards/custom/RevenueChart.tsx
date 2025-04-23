import React, { useState } from 'react';
import dynamic from "next/dynamic";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });
import { 
  Box, 
  Stack, 
  Typography, 
  useTheme, 
  ButtonGroup, 
  Button,
  Chip,
  Divider,
  Grid,
  Switch,
  FormControlLabel,
  IconButton,
  Tooltip
} from '@mui/material';
import DashboardCard from '../../shared/DashboardCard';
import { IconArrowUpRight, IconArrowDownRight, IconCircleCheck, IconNotes, IconCalendar } from '@tabler/icons-react';

interface ChartData {
  date: string;
  revenue: number;
  profit: number;
  costOfGoods: number;
}

interface RevenueChartProps {
  data: ChartData[];
  isLoading?: boolean;
  title?: string;
  subtitle?: string;
}

const RevenueChart: React.FC<RevenueChartProps> = ({
  data,
  isLoading = false,
  title = "Revenue & Profit",
  subtitle = "Sales performance"
}) => {
  const theme = useTheme();
  const [displayType, setDisplayType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [showComparison, setShowComparison] = useState<boolean>(false);
  
  // Format the data for the chart
  const dates = data.map(item => item.date);
  const revenue = data.map(item => item.revenue);
  const profit = data.map(item => item.profit);
  const costOfGoods = data.map(item => item.costOfGoods);
  
  // Calculate totals
  const totalRevenue = revenue.reduce((acc, curr) => acc + curr, 0);
  const totalProfit = profit.reduce((acc, curr) => acc + curr, 0);
  const totalCostOfGoods = costOfGoods.reduce((acc, curr) => acc + curr, 0);
  
  // Mock percentage changes (in a real app, this would come from API)
  const revenueChange = 2;
  const profitChange = -2;
  const marginChange = 2;
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'RON',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Calculate profit margin
  const profitMargin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;
  
  // Chart options
  const chartOptions: any = {
    chart: {
      type: 'area',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      foreColor: theme.palette.mode === 'dark' ? '#adb0bb' : '#2A3547',
      toolbar: {
        show: false,
        tools: {
          download: false,
          selection: false,
          zoom: false,
          zoomin: false,
          zoomout: false,
          pan: false,
          reset: false
        }
      },
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
      dropShadow: {
        enabled: true,
        top: 3,
        left: 0,
        blur: 4,
        opacity: 0.1
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: 3,
    },
    colors: [theme.palette.primary.main, theme.palette.success.main, theme.palette.warning.main],
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: "vertical",
        shadeIntensity: 0.4,
        opacityFrom: 0.8,
        opacityTo: 0.2,
        stops: [0, 90, 100]
      }
    },
    grid: {
      borderColor: theme.palette.divider,
      strokeDashArray: 5,
      xaxis: {
        lines: {
          show: true,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 10
      },
    },
    markers: {
      size: 6,
      strokeWidth: 0,
      hover: {
        size: 9,
      }
    },
    xaxis: {
      type: 'datetime',
      categories: dates,
      labels: {
        style: {
          cssClass: 'apexcharts-xaxis-label',
        },
      },
      axisBorder: {
        show: false,
      },
    },
    yaxis: {
      labels: {
        formatter: (value: number) => {
          return `RON ${value.toLocaleString()}`;
        },
        style: {
          cssClass: 'apexcharts-yaxis-label',
        },
      },
      min: (value: number) => Math.floor(value * 0.85),
      max: (value: number) => Math.ceil(value * 1.15),
      tickAmount: 5,
    },
    tooltip: {
      theme: theme.palette.mode === 'dark' ? 'dark' : 'light',
      x: {
        format: 'dd MMM',
      },
      y: {
        formatter: (value: number) => formatCurrency(value)
      },
      shared: true,
      intersect: false,
      style: {
        fontSize: '12px',
        fontFamily: 'Plus Jakarta Sans, sans-serif',
      },
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'right',
      offsetY: -15,
      itemMargin: {
        horizontal: 16,
        vertical: 8,
      },
      labels: {
        useSeriesColors: false
      },
      markers: {
        width: 10,
        height: 10,
        radius: 50
      }
    },
    annotations: {
      points: [
        {
          x: dates[dates.length - 2],
          y: profit[profit.length - 2],
          marker: {
            size: 6,
            fillColor: '#FE4D65',
            strokeColor: '#ffffff',
            strokeWidth: 2,
            radius: 2
          },
          label: {
            text: 'Google Ads',
            borderWidth: 0,
            style: {
              background: 'rgba(255, 255, 255, 0.9)',
              color: '#333',
              padding: {
                left: 8,
                right: 8,
                top: 4,
                bottom: 4
              },
              fontSize: '12px',
              fontWeight: 500,
              borderRadius: 4,
              cssClass: 'apexcharts-point-annotation-label'
            }
          }
        }
      ]
    }
  };
  
  const chartSeries = [
    {
      name: 'Revenue',
      data: revenue
    },
    {
      name: 'Profit',
      data: profit
    },
    {
      name: 'Cost of Goods',
      data: costOfGoods
    }
  ];
  
  // Mock previous period data
  const previousPeriodSeries = [
    {
      name: 'Previous Revenue',
      data: revenue.map(val => val * 0.9),
      type: 'line',
      dashArray: 5
    },
    {
      name: 'Previous Profit',
      data: profit.map(val => val * 0.85),
      type: 'line',
      dashArray: 5
    },
    {
      name: 'Previous Cost',
      data: costOfGoods.map(val => val * 0.92),
      type: 'line',
      dashArray: 5
    }
  ];
  
  return (
    <DashboardCard
      title={
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="h5">{title}</Typography>
          <IconButton size="small" color="primary">
            <IconCalendar size={20} />
          </IconButton>
        </Stack>
      }
      subtitle={subtitle}
      action={
        <Stack direction="row" spacing={2} alignItems="center">
          <FormControlLabel
            control={<Switch 
              size="small" 
              checked={showComparison} 
              onChange={(e) => setShowComparison(e.target.checked)} 
            />}
            label={<Typography variant="caption">Comparison</Typography>}
            sx={{ mr: 1 }}
          />
          <ButtonGroup size="small" variant="outlined">
            <Button 
              onClick={() => setDisplayType('daily')}
              variant={displayType === 'daily' ? 'contained' : 'outlined'}
            >
              Daily
            </Button>
            <Button 
              onClick={() => setDisplayType('weekly')}
              variant={displayType === 'weekly' ? 'contained' : 'outlined'}
            >
              Weekly
            </Button>
            <Button 
              onClick={() => setDisplayType('monthly')}
              variant={displayType === 'monthly' ? 'contained' : 'outlined'}
            >
              Monthly
            </Button>
          </ButtonGroup>
        </Stack>
      }
    >
      <Box>
        <Grid container spacing={2} sx={{ mb: 3, mt: 0 }}>
          <Grid item xs={12} sm={4}>
            <Box sx={{ 
              p: 1.5, 
              borderLeft: `3px solid ${theme.palette.primary.main}`, 
              bgcolor: theme.palette.background.paper, 
              borderRadius: '4px', 
              boxShadow: 1 
            }}>
              <Stack direction="row" alignItems="center" spacing={0.5} mb={0.5}>
                <IconCircleCheck size={16} color={theme.palette.primary.main} />
                <Typography variant="body2" color="textSecondary">Gross Revenue</Typography>
                {revenueChange !== 0 && (
                  <Chip 
                    icon={revenueChange > 0 ? <IconArrowUpRight size={12} /> : <IconArrowDownRight size={12} />} 
                    label={`${revenueChange}%`} 
                    color={revenueChange > 0 ? "success" : "error"}
                    size="small"
                    variant="outlined"
                    sx={{ height: 18, '& .MuiChip-label': { px: 0.5, py: 0.1, fontSize: '0.65rem' } }}
                  />
                )}
              </Stack>
              <Typography variant="h5" fontWeight={600}>
                {formatCurrency(totalRevenue)}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Box sx={{ 
              p: 1.5, 
              borderLeft: `3px solid ${theme.palette.success.main}`, 
              bgcolor: theme.palette.background.paper, 
              borderRadius: '4px', 
              boxShadow: 1 
            }}>
              <Stack direction="row" alignItems="center" spacing={0.5} mb={0.5}>
                <IconCircleCheck size={16} color={theme.palette.success.main} />
                <Typography variant="body2" color="textSecondary">Net Profit</Typography>
                {profitChange !== 0 && (
                  <Chip 
                    icon={profitChange > 0 ? <IconArrowUpRight size={12} /> : <IconArrowDownRight size={12} />} 
                    label={`${profitChange}%`} 
                    color={profitChange > 0 ? "success" : "error"}
                    size="small"
                    variant="outlined"
                    sx={{ height: 18, '& .MuiChip-label': { px: 0.5, py: 0.1, fontSize: '0.65rem' } }}
                  />
                )}
              </Stack>
              <Typography variant="h5" fontWeight={600}>
                {formatCurrency(totalProfit)}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Box sx={{ 
              p: 1.5, 
              borderLeft: `3px solid ${theme.palette.warning.main}`, 
              bgcolor: theme.palette.background.paper, 
              borderRadius: '4px', 
              boxShadow: 1 
            }}>
              <Stack direction="row" alignItems="center" spacing={0.5} mb={0.5}>
                <IconCircleCheck size={16} color={theme.palette.warning.main} />
                <Typography variant="body2" color="textSecondary">Cost of Goods</Typography>
                {marginChange !== 0 && (
                  <Chip 
                    icon={marginChange > 0 ? <IconArrowUpRight size={12} /> : <IconArrowDownRight size={12} />} 
                    label={`${marginChange}%`} 
                    color={marginChange > 0 ? "success" : "error"}
                    size="small"
                    variant="outlined"
                    sx={{ height: 18, '& .MuiChip-label': { px: 0.5, py: 0.1, fontSize: '0.65rem' } }}
                  />
                )}
              </Stack>
              <Typography variant="h5" fontWeight={600}>
                {formatCurrency(totalCostOfGoods)}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      
        <Box>
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" mb={1}>
            <Typography variant="body2" color="textSecondary">
              {showComparison ? 'Current Period vs Previous Period' : 'Current Period'}
            </Typography>
            
            <Tooltip title="Add annotation">
              <IconButton size="small">
                <IconNotes size={20} />
              </IconButton>
            </Tooltip>
          </Stack>
          
          <Box height="350px" sx={{ mt: 1, position: 'relative' }}>
            {isLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <Typography variant="body2">Loading chart data...</Typography>
              </Box>
            ) : (
              <Chart
                options={chartOptions}
                series={showComparison ? [...chartSeries, ...previousPeriodSeries] : chartSeries}
                type="area"
                height="350px"
                width="100%"
              />
            )}
          </Box>
        </Box>
      </Box>
    </DashboardCard>
  );
};

export default RevenueChart; 