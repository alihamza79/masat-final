import React, { useEffect, useRef, useMemo } from 'react';
import dynamic from "next/dynamic";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });
import { 
  Box, 
  Stack, 
  Typography, 
  useTheme,
  Skeleton
} from '@mui/material';
import DashboardCard from '../../shared/DashboardCard';
import { IconCalendar } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

// Add RevenueChartSkeleton component
export const RevenueChartSkeleton = ({ height = 350 }: { height?: number }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <DashboardCard
      title={t('dashboard.charts.revenueProfit.title')}
      subtitle={t('dashboard.charts.revenueProfit.subtitle')}
      action={
        <Stack direction="row" spacing={3} alignItems="center">
          {[1, 2, 3].map((item, index) => (
            <Stack key={index} direction="row" spacing={1} alignItems="center">
              <Skeleton variant="circular" width={10} height={10} />
              <Skeleton variant="text" width={40} height={20} />
            </Stack>
          ))}
        </Stack>
      }
    >
      <Box sx={{ 
        height: height, 
        minHeight: "350px",
        position: "relative", 
        mt: 1, 
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Skeleton 
          variant="rectangular" 
          width="100%" 
          height="100%" 
          sx={{ 
            borderRadius: 1,
            mb: 1
          }} 
        />

        {/* Simulate x-axis labels */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, px: 2 }}>
          {Array(5).fill(0).map((_, i) => (
            <Skeleton key={i} variant="text" width={30} height={16} />
          ))}
        </Box>
      </Box>
    </DashboardCard>
  );
};

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
  chartTotals?: {
    revenue: number;
    profit: number;
    costOfGoods: number;
  };
}

// Array of month names for formatting
const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

// Define quarter month ranges for 4-month quarters
const QUARTER_RANGES: Record<string, { start: number; end: number; label: string }> = {
  '1': { start: 0, end: 3, label: 'Jan-Apr' },
  '2': { start: 4, end: 7, label: 'May-Aug' },
  '3': { start: 8, end: 11, label: 'Sep-Dec' },
};

// ChartItem with hasDateError property
interface ChartItem extends ChartData {
  originalDate?: string;
  hasDateError?: boolean;
}

const RevenueChart: React.FC<RevenueChartProps> = ({
  data,
  isLoading = false,
  title,
  subtitle,
  chartTotals
}) => {
  const theme = useTheme();
  const chartRef = useRef<any>(null);
  const { t } = useTranslation();
  
  // Pre-process dates to ensure they're in a format ApexCharts can handle
  const processedData = React.useMemo(() => {
    try {
      if (!data || data.length === 0) {
        console.log('No chart data provided');
        return [];
      }
      
      return data.map(item => {
        try {
          if (!item || !item.date) {
            console.warn('Invalid data item or missing date', item);
            return {
              ...item,
              date: 'Unknown',
              hasDateError: true
            } as ChartItem;
          }
          
          let processedDate = item.date;
          
          // Check if date is a timestamp number (long number)
          if (/^\d{10,}$/.test(item.date)) {
            const timestamp = parseInt(item.date);
            if (!isNaN(timestamp)) {
              const date = new Date(timestamp);
              if (isFinite(date.getTime())) {
                // Format as YYYY-MM-DD
                processedDate = date.toISOString().split('T')[0];
                console.log(`Converted timestamp ${item.date} to date ${processedDate}`);
              } else {
                console.warn(`Invalid timestamp conversion: ${item.date}`);
              }
            } else {
              console.warn(`Failed to parse timestamp: ${item.date}`);
            }
          }
          
          // Check if it's a quarterly format like "2023-Q1"
          else if (/^\d{4}-Q[1-3]$/.test(item.date)) {
            // Keep as is - it's already in a good format for category axis
            processedDate = item.date;
            console.log(`Detected quarterly format: ${item.date}`);
          }
          
          // Check if it's just a year "2023"
          else if (/^\d{4}$/.test(item.date)) {
            // Keep as is - it's already in a good format for category axis
            processedDate = item.date;
            console.log(`Detected yearly format: ${item.date}`);
          }
          
          // Try to parse as date if it's in another format
          else if (item.date && typeof item.date === 'string' && !item.date.includes('Q')) {
            try {
              const parsedDate = new Date(item.date);
              if (isFinite(parsedDate.getTime())) {
                // Format as YYYY-MM-DD
                processedDate = parsedDate.toISOString().split('T')[0];
                console.log(`Parsed date string ${item.date} to ${processedDate}`);
              } else {
                console.warn(`Failed to parse date string: ${item.date}`);
              }
            } catch (dateError) {
              console.error(`Error parsing date string: ${item.date}`, dateError);
              // Keep original but mark as error
              return {
                ...item,
                hasDateError: true
              } as ChartItem;
            }
          }
          
          return {
            ...item,
            date: processedDate,
            // Store original date for debugging
            originalDate: item.date
          } as ChartItem;
        } catch (error) {
          console.error("Error processing date:", item.date, error);
          return {
            ...item,
            // If we can't process it, keep original but mark for logging
            hasDateError: true
          } as ChartItem;
        }
      });
    } catch (error) {
      console.error("Critical error processing chart data:", error);
      return [];
    }
  }, [data]);
  
  // Format the data for the chart
  const dates = processedData.map(item => item.date);
  const revenue = processedData.map(item => item.revenue);
  const profit = processedData.map(item => item.profit);
  const costOfGoods = processedData.map(item => item.costOfGoods);
  
  // Calculate totals - use chartTotals if available, otherwise calculate from data
  const totalRevenue = chartTotals?.revenue !== undefined ? chartTotals.revenue : revenue.reduce((acc, curr) => acc + curr, 0);
  const totalProfit = chartTotals?.profit !== undefined ? chartTotals.profit : profit.reduce((acc, curr) => acc + curr, 0);
  const totalCostOfGoods = chartTotals?.costOfGoods !== undefined ? chartTotals.costOfGoods : costOfGoods.reduce((acc, curr) => acc + curr, 0);
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value) + ' RON';
  };
  
  // Determine data types with better logging
  const hasQuarterlyData = dates.some(date => 
    date && 
    typeof date === 'string' && 
    /^\d{4}-Q[1-3]$/.test(date)
  );
  
  if (hasQuarterlyData) {
    console.log('Detected quarterly data format');
  }
  
  const hasYearlyData = dates.some(date => 
    date && 
    typeof date === 'string' && 
    /^\d{4}$/.test(date)
  );
  
  const hasTimestampData = dates.some(date => 
    date && 
    typeof date === 'string' && 
    /^\d{10,}$/.test(date)
  );
  
  // Check if we have mixed formats
  const hasMixedFormats = dates.some(date => 
    date && 
    typeof date === 'string' && 
    date.includes('-') && 
    !date.includes('Q') && 
    !hasQuarterlyData && 
    !hasYearlyData
  );
  
  // Determine the chart x-axis type
  const xAxisType = hasQuarterlyData || hasYearlyData ? 'category' as const : 'datetime' as const;
  
  // Log data format for debugging
  useEffect(() => {
    console.log('Chart data format sample:', dates.slice(0, 3));
    console.log('Data detection:', { 
      hasQuarterlyData, 
      hasYearlyData, 
      hasTimestampData,
      hasMixedFormats,
      chartType: xAxisType
    });
    
    // Log any problematic dates
    const problemDates = processedData.filter(item => item.hasDateError === true);
    if (problemDates.length > 0) {
      console.warn('Problem dates detected:', problemDates);
    }
  }, [dates, processedData, hasQuarterlyData, hasYearlyData, hasTimestampData, hasMixedFormats, xAxisType]);
  
  // Format date for display based on detected format
  const formatDateLabel = (value: any): string => {
    if (!value) return '';
    
    // Convert to string if not already
    const strValue = String(value);
    
    // Quarterly format (e.g., "2023-Q1")
    if (strValue.includes('Q')) {
      // For quarterly format, make it more readable
      const [year, quarterPart] = strValue.split('-Q');
      const quarter = quarterPart;
      
      // Use predefined quarter ranges for 4-month quarters
      const quarterRange = QUARTER_RANGES[quarter as keyof typeof QUARTER_RANGES];
      if (quarterRange) {
        return `${quarterRange.label} ${year}`;
      }
      
      return `Q${quarter} ${year}`;
    }
    
    // Yearly format (e.g., "2023")
    if (/^\d{4}$/.test(strValue)) {
      return strValue;
    }
    
    // Timestamp format (long number)
    if (/^\d{10,}$/.test(strValue)) {
      try {
        const date = new Date(parseInt(strValue));
        if (isFinite(date.getTime())) {
          // Show month and day
          return MONTH_NAMES[date.getMonth()] + ' ' + date.getDate();
        }
      } catch (e) {
        // Fall through to other formats
      }
    }
    
    // Standard date format (YYYY-MM-DD)
    try {
      const date = new Date(strValue);
      if (isFinite(date.getTime())) {
        // Show month and day
        return MONTH_NAMES[date.getMonth()] + ' ' + date.getDate();
      }
    } catch (e) {
      // Not a valid date
    }
    
    // Default fallback - return as is
    return strValue;
  };
  
  // Format date for tooltip
  const formatTooltipDate = (value: any): string => {
    if (!value) return '';
    
    // Convert to string if not already
    const strValue = String(value);
    
    // Quarterly format (e.g., "2023-Q1")
    if (strValue.includes('Q')) {
      const [year, quarterPart] = strValue.split('-Q');
      const quarter = quarterPart;
      
      // Different quarters based on 4-month periods
      const quarterMap: Record<string, string> = {
        '1': 'First Trimester (Jan-Apr)',
        '2': 'Second Trimester (May-Aug)',
        '3': 'Third Trimester (Sep-Dec)'
      };
      
      return `${quarterMap[quarter] || `Q${quarter}`} ${year}`;
    }
    
    // Yearly format (e.g., "2023")
    if (/^\d{4}$/.test(strValue)) {
      return `Year ${strValue}`;
    }
    
    // Timestamp format (long number)
    if (/^\d{10,}$/.test(strValue)) {
      try {
        const date = new Date(parseInt(strValue));
        if (isFinite(date.getTime())) {
          return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
        }
      } catch (e) {
        // Fall through to standard format
      }
    }
    
    // Special handling for dates in "May-Aug 2022" format from x-axis labels
    const trimesterMatch = strValue.match(/([A-Za-z]+)-([A-Za-z]+)\s+(\d{4})/);
    if (trimesterMatch) {
      return strValue; // Return as-is if it's already in our custom format
    }
    
    // Handle YYYY-MM-DD format with more robust validation
    const dateMatch = strValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateMatch) {
      const [_, year, month, day] = dateMatch;
      // Validate date components
      const numYear = parseInt(year, 10);
      const numMonth = parseInt(month, 10) - 1; // 0-indexed month
      const numDay = parseInt(day, 10);
      
      if (numYear > 1900 && numYear < 2100 && numMonth >= 0 && numMonth < 12 && numDay > 0 && numDay <= 31) {
        const date = new Date(numYear, numMonth, numDay);
        // Verify the date is valid (handles cases like Feb 30)
        if (isFinite(date.getTime()) && date.getFullYear() === numYear && date.getMonth() === numMonth) {
          return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
        }
      }
      // If invalid date, return the original string
      return strValue;
    }
    
    // Try standard Date parsing as a fallback, with validation
    try {
      // Use regex to detect if this looks like a date
      if (/\d{1,4}[.\-/]\d{1,2}[.\-/]\d{1,4}/.test(strValue)) {
        const date = new Date(strValue);
        // Make sure the date is valid and recent (not defaulting to 1970 or 2001)
        if (isFinite(date.getTime()) && date.getFullYear() > 2010) {
          return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
        }
      }
    } catch (e) {
      // Not a valid date
    }
    
    // Default fallback - return as is
    return strValue;
  };
  
  // Chart options with better quarterly handling
  const chartOptions = React.useMemo(() => {
    return {
    chart: {
      type: 'area' as const,
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      foreColor: theme.palette.mode === 'dark' ? '#adb0bb' : '#2A3547',
      height: 350,
      toolbar: {
        show: false
      },
      zoom: {
        enabled: false
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
      },
      // Add extra spacing for negative values
      sparkline: {
        enabled: false
      },
      stacked: false,
      // Better handle negative values
      redrawOnParentResize: true,
      redrawOnWindowResize: true
    },
      // Add proper empty state message
      noData: {
        text: 'No data available for this period',
        align: 'center' as const,
        verticalAlign: 'middle' as const,
        offsetX: 0,
        offsetY: 0,
        style: {
          color: theme.palette.text.secondary,
          fontSize: '14px',
          fontFamily: "'Plus Jakarta Sans', sans-serif"
        }
      },
      tooltip: {
        theme: theme.palette.mode === 'dark' ? 'dark' : 'light',
        shared: true,
        intersect: false,
        x: {
          formatter: function(value: any) {
            // Check if value is an x-axis label that's already properly formatted
            if (typeof value === 'string' && dates.includes(value)) {
              // For dates already in our x-axis, use the existing label format
              // This ensures consistency between x-axis labels and tooltips
              return formatDateLabel(value);
            }
            return formatTooltipDate(value);
          }
        },
        y: {
          formatter: function(value: number) {
            return formatCurrency(value);
          }
        }
      },
      // Explicitly force category type for quarterly data
      xaxis: {
        type: xAxisType,
        categories: dates,
        labels: {
          style: {
            cssClass: 'apexcharts-xaxis-label',
            fontSize: '11px',
          },
          // Rotate labels for better readability with many data points
          rotate: dates.length > 15 ? -45 : 0,
          rotateAlways: dates.length > 15,
          // Give more room for labels when rotated
          offsetY: dates.length > 15 ? 5 : 0,
          formatter: function(value: any) {
            return formatDateLabel(value);
          }
        },
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: true
        },
        // For responsive tick count based on chart width
        tickAmount: dates.length > 20 ? 10 : undefined,
        tickPlacement: 'on',
      },
      yaxis: {
        show: true,
        labels: {
          formatter: (value: number) => formatCurrency(value),
          style: {
            cssClass: 'apexcharts-yaxis-label',
          }
        },
        // Better scaling for all values including negative ones
        min: function(min: number) {
          // Check if we have extreme negative values
          if (min < 0) {
            // For negative values, provide good padding below
            return Math.floor(min * 1.2); // 20% more space below negative values
          }
          return min;
        },
        max: function(max: number) {
          // Check if we have extreme positive values
          return Math.ceil(max * 1.1); // 10% more space above maximum values
        },
        // Force the y-axis to show 0 baseline
        forceNiceScale: true,
        // Increase tick amount for better scale distribution
        tickAmount: 8,
        // Ensure the chart adapts well to extreme values
        logarithmic: false,
        // Show zero crosshair for better orientation with negative values
        crosshairs: {
          show: true,
          position: 'back'
        }
      },
      grid: {
        borderColor: theme.palette.divider,
        strokeDashArray: 5,
        xaxis: {
          lines: {
            show: true
          }
        },
        yaxis: {
          lines: {
            show: true
          }
        },
        padding: {
          top: 0,
          right: 10,
          bottom: 10,
          left: 10
        }
      },
      // Add crosshairs for better data reading
      crosshairs: {
        show: true,
        position: 'front' as const,
        stroke: {
          color: theme.palette.divider,
          width: 1,
          dashArray: 3
        }
      },
      // Keep original colors
      colors: [theme.palette.primary.main, theme.palette.success.main, theme.palette.warning.main],
      
      // Original markers with special handling for quarterly
      markers: hasQuarterlyData ? {
        size: 5,
        strokeWidth: 0,  // Remove border by setting stroke width to 0
        hover: {
          size: 7,
          strokeWidth: 0
        }
      } : {
        size: 4,
        strokeWidth: 0,  // Remove border by setting stroke width to 0
        hover: {
          size: 6,
          strokeWidth: 0
        }
      },
    stroke: {
      curve: 'smooth' as const,
      width: 3,
    },
      // Use original gradient fill
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
    // Disable data labels to remove values
    dataLabels: {
      enabled: false
    },
    legend: {
        show: false // Hide default legend as we use custom one
      },
      responsive: [
        {
          breakpoint: 600,
          options: {
            xaxis: {
              labels: {
                rotate: -45,
                rotateAlways: true
              }
            }
          }
        }
      ]
    };
  }, [theme, xAxisType, dates, hasQuarterlyData]);

  // Log any date formatting errors at render time
  useEffect(() => {
    const hasErrors = processedData.some(item => item.hasDateError === true);
    if (hasErrors) {
      console.error('Chart data contains date formatting errors. Some points may not display correctly.');
      console.log('Data with errors:', processedData.filter(item => item.hasDateError === true));
    }
    
    // For quarterly data, log additional debug info
    if (hasQuarterlyData) {
      console.log('Rendering quarterly data chart with quarters:', 
        processedData.map(item => item.date).filter(date => date.includes('Q')));
    }
  }, [processedData, hasQuarterlyData]);

  // Calculate chart height based on data points (more space for quarterly view with few points)
  const chartHeight = hasQuarterlyData && data.length <= 3 ? 400 : 350;

  // Create chart series in original format
  const chartSeries = [
    {
      name: t('dashboard.charts.revenueProfit.revenue'),
      data: revenue
    },
    {
      name: t('dashboard.charts.revenueProfit.profit'),
      data: profit
    },
    {
      name: t('dashboard.charts.revenueProfit.costOfGoods'),
      data: costOfGoods
    }
  ];
  
  // Original legend items
  const legendItems = [
    { name: t('dashboard.charts.revenueProfit.revenue'), color: theme.palette.primary.main },
    { name: t('dashboard.charts.revenueProfit.profit'), color: theme.palette.success.main },
    { name: t('dashboard.charts.revenueProfit.costOfGoods'), color: theme.palette.warning.main }
  ];
  
  // Get title and subtitle either from props or translations
  const chartTitle = title || t('dashboard.charts.revenueProfit.title');
  const chartSubtitle = subtitle || t('dashboard.charts.revenueProfit.subtitle');
  
  return (
    <DashboardCard
      title={
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="h5">{chartTitle}</Typography>
        </Stack>
      }
      subtitle={chartSubtitle}
      action={
        <Stack direction="row" spacing={3} alignItems="center">
          {legendItems.map((item, index) => (
            <Stack key={index} direction="row" spacing={1} alignItems="center">
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: item.color
                }}
              />
              <Typography variant="caption" fontWeight={500}>
                {item.name}
              </Typography>
            </Stack>
          ))}
        </Stack>
      }
    >
            <Box sx={{ 
        height: "100%", 
        minHeight: "350px",
        position: "relative", 
        mt: 1, 
        pb: 0,
        "& .apexcharts-canvas": {
          width: "100% !important",
        }
      }}>
            {isLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <Typography variant="body2">{t('dashboard.charts.loading')}</Typography>
              </Box>
        ) : dates.length === 0 ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <Typography variant="body2">{t('dashboard.charts.revenueProfit.noData')}</Typography>
          </Box>
        ) : (
          <>
            {/* Only show quarterly indicator when needed */}
            {hasQuarterlyData && (
              <Box sx={{ 
                mb: 1,
                px: 1,
                py: 0.5,
                display: 'inline-flex',
                alignSelf: 'flex-end',
                color: theme.palette.text.secondary,
                fontSize: '0.75rem'
              }}>
                <Typography variant="caption">
                  {t('dashboard.charts.revenueProfit.trimesterView')}
                </Typography>
              </Box>
            )}
            
              <Chart
                options={chartOptions}
              series={chartSeries}
                type="area"
              height="100%"
                width="100%"
              />
          </>
            )}
      </Box>
    </DashboardCard>
  );
};

export default RevenueChart; 