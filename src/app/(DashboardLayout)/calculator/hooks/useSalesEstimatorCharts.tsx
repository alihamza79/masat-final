import { useTheme } from '@mui/material';
import { ApexOptions } from 'apexcharts';

export const useSalesEstimatorCharts = (
  totalRevenue: number,
  totalExpense: number,
  totalTaxes: number,
  totalVatToBePaid: number,
  totalNetProfit: number
) => {
  const theme = useTheme();

  // Bar chart options
  const barOptions: ApexOptions = {
    chart: {
      type: 'bar',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      toolbar: {
        show: false
      }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '40%',
        borderRadius: 6
      },
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent']
    },
    xaxis: {
      categories: ['FBM-NonGenius', 'FBM-Genius', 'FBE'],
      axisBorder: {
        show: false
      }
    },
    yaxis: {
      show: true
    },
    fill: {
      opacity: 1
    },
    tooltip: {
      enabled: true
    },
    grid: {
      borderColor: 'rgba(0,0,0,0.1)'
    },
    colors: ['#5D87FF', '#2CD9C5', '#49BEFF']
  };

  // Donut chart options for metrics
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
      fontSize: '13px',
      fontWeight: 500,
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      labels: {
        colors: theme.palette.text.primary
      },
      markers: {
        size: 12,
        strokeWidth: 0,
        customHTML: undefined,
        onClick: undefined,
        offsetX: -2,
        offsetY: 0
      },
      itemMargin: {
        horizontal: 8,
        vertical: 5
      },
      onItemClick: {
        toggleDataSeries: true
      },
      onItemHover: {
        highlightDataSeries: true
      },
      formatter: function(legendName, opts) {
        // Format labels to be more consistent
        const simpleNames: Record<string, string> = {
          'Total Revenue': 'Total Revenue',
          'Total Expense': 'Total Expense',
          'Total Taxes': 'Total Taxes',
          'Total VAT': 'Total VAT',
          'Total Net Profit': 'Total Net Profit'
        };
        
        return `<span style="font-weight: 500;">${simpleNames[legendName] || legendName}</span>`;
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

  const donutSeries = [
    totalRevenue,
    totalExpense,
    totalTaxes,
    totalVatToBePaid,
    totalNetProfit
  ];

  // Gauge chart options
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

  // Calculate performance percentage based on profit margin
  const calculatePerformancePercentage = () => {
    if (totalRevenue === 0) return 0;
    
    const profitMargin = (totalNetProfit / totalRevenue) * 100;
    
    // Map profit margin to a 0-100 scale for the gauge
    // Negative profit margin = 0% performance
    // 0% profit margin = 33% performance
    // 15% profit margin = 67% performance
    // 30%+ profit margin = 100% performance
    
    if (profitMargin <= 0) return 0;
    if (profitMargin >= 30) return 100;
    
    if (profitMargin <= 15) {
      return 33 + (profitMargin / 15) * 34;
    } else {
      return 67 + ((profitMargin - 15) / 15) * 33;
    }
  };

  const gaugeSeries = [Math.round(calculatePerformancePercentage())];

  return {
    barOptions,
    donutOptions,
    donutSeries,
    gaugeOptions,
    gaugeSeries
  };
};

export default useSalesEstimatorCharts; 