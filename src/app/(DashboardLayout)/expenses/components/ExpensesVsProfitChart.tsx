'use client';
import { Card, CardContent, Typography, Box, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import dynamic from 'next/dynamic';
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const ExpensesVsProfitChart = ({ fullHeight = false, height }: { fullHeight?: boolean, height?: number }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Dummy data for the chart
  const series = [
    {
      name: 'Expenses',
      data: [35000, 42000, 38000, 45000, 39000, 41000, 48000, 44000, 46000, 43000, 40000, 42000],
    },
    {
      name: 'Profit',
      data: [45000, 52000, 49000, 55000, 48000, 51000, 58000, 54000, 56000, 53000, 50000, 52000],
    },
  ];

  const options = {
    chart: {
      type: 'area' as const,
      stacked: false,
      zoom: {
        enabled: false,
      },
      toolbar: {
        show: false,
      },
      fontFamily: theme.typography.fontFamily,
      background: 'transparent',
      sparkline: {
        enabled: false,
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: 'smooth' as const,
      width: 2,
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        inverseColors: false,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [20, 100, 100, 100],
      },
    },
    grid: {
      borderColor: theme.palette.divider,
      padding: {
        left: 20,
        right: 20,
        top: 5,
        bottom: 20
      },
      xaxis: {
        lines: {
          show: false,
        },
      },
    },
    xaxis: {
      categories: [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ],
      labels: {
        style: {
          colors: theme.palette.text.secondary,
          fontSize: '12px',
        },
        offsetY: 0,
        trim: false,
        hideOverlappingLabels: false,
      },
      axisBorder: {
        color: theme.palette.divider,
      },
      axisTicks: {
        color: theme.palette.divider,
      },
      tickAmount: undefined,
      tickPlacement: 'between',
    },
    yaxis: {
      labels: {
        style: {
          colors: theme.palette.text.secondary,
          fontSize: '12px',
        },
        formatter: (value: number) => `${(value / 1000).toFixed(0)}k${isMobile ? '' : ' RON'}`,
        offsetX: -5,
      },
      tickAmount: 7,
      min: 30000,
      max: 60000,
      forceNiceScale: true,
    },
    tooltip: {
      y: {
        formatter: (value: number) => `${value.toLocaleString()} RON`,
      },
    },
    colors: [theme.palette.error.main, theme.palette.success.main],
    legend: {
      fontSize: '14px',
      position: 'top' as const,
      horizontalAlign: 'right' as const,
      offsetY: 0,
      itemMargin: {
        horizontal: 10,
        vertical: 0
      },
    },
    responsive: [{
      breakpoint: 600,
      options: {
        legend: {
          fontSize: '12px',
        },
        grid: {
          padding: {
            left: 10,
            right: 10,
            bottom: 15,
          }
        },
        xaxis: {
          labels: {
            style: {
              fontSize: '10px',
            },
          }
        }
      }
    }]
  };

  // Calculate chart height based on container height
  const chartHeight = isMobile 
    ? 300
    : (height && fullHeight) 
      ? height - 80 // account for title, padding, legend, and x-axis labels
      : fullHeight 
        ? '100%' 
        : (height || 500);

  return (
    <Card sx={{ 
      height: fullHeight ? '100%' : undefined,  
      display: 'flex', 
      flexDirection: 'column', 
      p: 2.5, 
      pt: 2,
      pb: 3,
      borderRadius: 2,
    }}>
      <CardContent sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        p: 0, 
        pb: '0 !important',
        height: '100%',
      }}>
        <Typography 
          variant="h5" 
          fontWeight={800} 
          sx={{ 
            mb: { xs: 2, sm: 2 },
            fontSize: isMobile ? '1.1rem' : undefined
          }}
        >
          Expenses vs Profit
        </Typography>
        <Box sx={{ 
          width: '100%', 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100% - 40px)',
        }}>
          <Box sx={{ 
            width: '100%',
            flex: 1,
            height: '100%',
          }}>
            <Chart
              options={options}
              series={series}
              type="area"
              height={chartHeight}
              width="100%"
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ExpensesVsProfitChart; 