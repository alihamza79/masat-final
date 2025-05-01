"use client";
import PageContainer from "@/app/components/container/PageContainer";
import { useIntegrations } from "@/lib/hooks/useIntegrations";
import { Alert, Box, CircularProgress, Grid, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  IconCash,
  IconCreditCard,
  IconHome,
  IconPercentage,
  IconRefresh,
  IconReportMoney,
  IconShoppingCart,
  IconTimeline,
  IconTruckDelivery,
  IconCoin
} from "@tabler/icons-react";
import dynamic from "next/dynamic";
import React, { useEffect, useState } from "react";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

// Custom components
import EnhancedDistributionChart from "@/app/components/dashboards/custom/EnhancedDistributionChart";
import IntegrationFilter from "@/app/components/dashboards/custom/IntegrationFilter";
import OrdersByIntegration from "@/app/components/dashboards/custom/OrdersByIntegration";
import PeriodSelector, { PeriodType } from "@/app/components/dashboards/custom/PeriodSelector";
import ProductOffersTable from "@/app/components/dashboards/custom/ProductOffersTable";
import ProductPerformanceChart from "@/app/components/dashboards/custom/ProductPerformanceChart";
import RevenueChart from "@/app/components/dashboards/custom/RevenueChart";
import TopStatsCard from "@/app/components/dashboards/custom/TopStatsCard";
import DashboardCard from "@/app/components/shared/DashboardCard";

// Services and utilities
import { calculateDateRange, formatDateForAPI } from "@/app/components/dashboards/custom/dateUtils";
import dashboardService, { DashboardData } from "@/lib/services/dashboardService";

// Create simple chart components that don't use DashboardCard wrapper
interface DistributionData {
  name: string;
  value: number;
}

interface SimpleDistributionChartProps {
  data: DistributionData[];
  isLoading?: boolean;
  title?: string; // Make title optional
}

const SimpleDistributionChart: React.FC<SimpleDistributionChartProps> = ({
  data,
  isLoading = false,
  title
}) => {
  const theme = useTheme();
  
  // Extract data for chart
  const labels = data.map(item => item.name);
  const values = data.map(item => item.value);
  const total = values.reduce((acc: number, val: number) => acc + val, 0);
  
  // Set colors based on the theme
  const primaryColor = theme.palette.primary.main;
  const secondaryColor = theme.palette.secondary.main;
  const colors = [primaryColor, secondaryColor, 
    theme.palette.success.main, theme.palette.warning.main,
    theme.palette.error.main, theme.palette.info.main];
  
  // Chart options
  const chartOptions = {
    chart: {
      type: 'donut' as const,
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
    colors: colors.slice(0, data.length),
    dataLabels: {
      enabled: false,
    },
    legend: {
      show: false,
    },
    stroke: {
      width: 0,
    },
    fill: {
      opacity: 1,
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
              fontSize: '14px',
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
              offsetY: 5,
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
    <Box 
      sx={{ 
        height: { xs: 220, sm: 250 }, 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        width: '100%',
        position: 'relative'
      }}
    >
      {isLoading ? (
        <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body2" color="textSecondary">Loading...</Typography>
        </Box>
      ) : (
        data.length > 0 ? (
          <>
            <Box sx={{ 
              width: '100%', 
              height: { xs: 180, sm: 200 },
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
            
            <Box sx={{ mt: 2, width: '100%' }}>
              <Stack 
                direction="row" 
                spacing={2}
                justifyContent="center"
                alignItems="center"
                flexWrap="wrap"
                sx={{ 
                  px: 1,
                  gap: 1.5
                }}
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
                        flexShrink: 0
                      }}
                    />
                    <Typography variant="caption" fontWeight={500} color="textPrimary">
                      {item.name}: {((item.value / total) * 100).toFixed(1)}%
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          </>
        ) : (
          <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="body2" color="textSecondary">No data available</Typography>
          </Box>
        )
      )}
    </Box>
  );
};

export default function Dashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('allTime');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedIntegrationIds, setSelectedIntegrationIds] = useState<string[]>([]);
  
  // Fetch user integrations
  const { integrations, isLoading: isLoadingIntegrations } = useIntegrations();
  
  // Initialize selected integrations when integrations data is loaded
  useEffect(() => {
    if (integrations && integrations.length > 0 && selectedIntegrationIds.length === 0) {
      setSelectedIntegrationIds(integrations.map(integration => integration._id as string));
    }
  }, [integrations]);
  
  // Fetch dashboard data based on selected period
  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    
    // If no integrations are selected, don't fetch data
    if (selectedIntegrationIds.length === 0) {
      setDashboardData(null);
      setIsLoading(false);
      return;
    }
    
    try {
      // Calculate date range based on selected period
      const dateRange = calculateDateRange(selectedPeriod, customStartDate, customEndDate);
      const startDateStr = formatDateForAPI(dateRange.startDate);
      const endDateStr = formatDateForAPI(dateRange.endDate);
      
      // Only use selected integration IDs
      const integrationIds = selectedIntegrationIds;
      
      console.log(`Fetching dashboard data for period: ${selectedPeriod}`, {
        startDate: startDateStr,
        endDate: endDateStr,
        integrationIds
      });
      
      // Call the dashboard API with date range and integration IDs
      const response = await dashboardService.getDashboardData(startDateStr, endDateStr, integrationIds);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch dashboard data');
      }
      
      // Use the real data for specified metrics
      setDashboardData(response.data);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'An error occurred while fetching dashboard data');
      
      // For development, fall back to mock data
      if (process.env.NODE_ENV === 'development') {
        console.log('Using mock data in development mode due to error');
        setDashboardData(dashboardService.getMockDashboardData());
      } else {
        setDashboardData(null);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Initial data load - wait for integrations to load first
  useEffect(() => {
    if (!isLoadingIntegrations) {
      fetchDashboardData();
    }
  }, [isLoadingIntegrations]);
  
  // Track period changes and fetch data when they change
  useEffect(() => {
    // Don't fetch on initial render or while integrations are still loading
    if (selectedPeriod && !isLoadingIntegrations) {
      fetchDashboardData();
    }
  }, [selectedPeriod, customStartDate, customEndDate, selectedIntegrationIds]);
  
  // Handle period selection
  const handlePeriodChange = (period: PeriodType, startDate?: string, endDate?: string) => {
    setSelectedPeriod(period);
    if (period === 'custom' && startDate && endDate) {
      setCustomStartDate(startDate);
      setCustomEndDate(endDate);
    }
    // Data fetching is now handled by the useEffect that depends on these state variables
  };
  
  // Handle integration filter change
  const handleIntegrationFilterChange = (ids: string[]) => {
    setSelectedIntegrationIds(ids);
  };
  
  // Format currency for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'RON',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Prepare delivery and payment methods data for charts
  const deliveryMethodsData = dashboardData ? [
    { name: 'Home Delivery', value: dashboardData.deliveryMethodStats.home },
    { name: 'Locker', value: dashboardData.deliveryMethodStats.locker }
  ] : [];
  
  const paymentMethodsData = dashboardData ? [
    { name: 'Card', value: dashboardData.paymentMethodStats.card },
    { name: 'COD', value: dashboardData.paymentMethodStats.cod }
  ] : [];

  // Get total orders count
  const totalOrdersCount = dashboardData ? 
    (dashboardData.salesByIntegration.reduce((acc, item) => acc + item.ordersCount, 0)) : 0;
  
  const theme = useTheme();
  
  // Get period display text
  const getPeriodDisplayText = () => {
    if (selectedPeriod === 'custom' && customStartDate && customEndDate) {
      const start = new Date(customStartDate).toLocaleDateString();
      const end = new Date(customEndDate).toLocaleDateString();
      return `from ${start} to ${end}`;
    }
    
    switch (selectedPeriod) {
      case 'today':
        return 'for today';
      case 'yesterday':
        return 'for yesterday';
      case 'last7days':
        return 'for the last 7 days';
      case 'last30days':
        return 'for the last 30 days';
      case 'thisMonth':
        return 'for the current month';
      case 'lastMonth':
        return 'for the previous month';
      case 'thisQuarter':
        return 'for the current quarter';
      case 'lastQuarter':
        return 'for the previous quarter';
      case 'thisYear':
        return 'for the current year';
      case 'lastYear':
        return 'for the previous year';
      case 'allTime':
        return 'for all time';
      default:
        return '';
    }
  };
  
  return (
    <PageContainer title="Dashboard" description="eMAG Seller Dashboard">
      {/* Header with period selector */}
      <Box
        mb={3}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          pb: 2,
          borderBottom: theme => `1px solid ${theme.palette.divider}`
        }}
      >
        <Box>
          <Typography variant="h3">Sales Dashboard</Typography>
          <Typography variant="body2" color="textSecondary">
            Your sales overview {getPeriodDisplayText()}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <PeriodSelector
            selectedPeriod={selectedPeriod}
            customStartDate={customStartDate}
            customEndDate={customEndDate}
            onPeriodChange={handlePeriodChange}
          />
          
          {integrations && integrations.length > 0 && (
            <IntegrationFilter
              integrations={integrations}
              selectedIntegrationIds={selectedIntegrationIds}
              onChange={handleIntegrationFilterChange}
            />
          )}
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Show loading indicator while integrations are being loaded */}
      {isLoadingIntegrations && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
          <CircularProgress />
        </Box>
      )}
      
      {/* Only show "no integrations" warning when integrations have loaded but none are selected */}
      {!isLoadingIntegrations && selectedIntegrationIds.length === 0 && integrations && integrations.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          No integrations selected. Please select at least one integration to view your dashboard data.
        </Alert>
      )}
      
      {/* No integrations created yet */}
      {!isLoadingIntegrations && integrations && integrations.length === 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You don't have any integrations set up yet. Please create an integration to see your dashboard data.
        </Alert>
      )}
      
      {/* Main dashboard content */}
      {isLoadingIntegrations ? (
        // Show nothing while loading integrations (already showing loading spinner above)
        null
      ) : selectedIntegrationIds.length === 0 ? (
        // Empty state when no integrations selected
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          p: 5, 
          backgroundColor: 'background.paper',
          borderRadius: 1
        }}>
          <Typography variant="h6" color="textSecondary">
            {integrations && integrations.length > 0 
              ? "Select at least one integration to view dashboard data"
              : "Create an integration to view dashboard data"}
          </Typography>
        </Box>
      ) : isLoading ? (
        // Show loading state for dashboard data
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          p: 5,
          my: 4
        }}>
          <CircularProgress />
        </Box>
      ) : (
        // Show dashboard when data is loaded
        <Box sx={{ mx: -1.5 }}>
          <Grid container spacing={3} sx={{ px: 1.5 }}>
            {/* Top stat cards row */}
            <Grid container item spacing={3} sx={{ mb: 1 }}>
              <Grid item xs={12} sm={6} md={4} lg={2}>
                <TopStatsCard
                  title="Total Orders"
                  value={dashboardData ? dashboardData.orderStats.totalOrders.toString() : "0"}
                  icon={<IconShoppingCart />}
                  colorScheme="primary"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4} lg={2}>
                <TopStatsCard
                  title="Gross Revenue"
                  value={dashboardData ? formatCurrency(dashboardData.orderStats.grossRevenue) : "RON 0"}
                  icon={<IconCash />}
                  colorScheme="success"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4} lg={2}>
                <TopStatsCard
                  title="Profit"
                  value={dashboardData ? formatCurrency(dashboardData.orderStats.profitMargin) : "RON 0"}
                  icon={<IconCoin />}
                  colorScheme="warning"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4} lg={2}>
                <TopStatsCard
                  title="Cost of Goods"
                  value={dashboardData ? formatCurrency(dashboardData.orderStats.costOfGoods) : "RON 0"}
                  icon={<IconReportMoney />}
                  colorScheme="info"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4} lg={2}>
                <TopStatsCard
                  title="Refunded Orders"
                  value={dashboardData ? dashboardData.orderStats.refundedOrders.toString() : "0"}
                  icon={<IconRefresh />}
                  colorScheme="error"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4} lg={2}>
                <TopStatsCard
                  title="Shipping Revenue"
                  value={dashboardData ? formatCurrency(dashboardData.orderStats.shippingRevenue) : "RON 0"}
                  icon={<IconTruckDelivery />}
                  colorScheme="secondary"
                />
              </Grid>
            </Grid>
            
            {/* Revenue chart and Channel Distribution */}
            <Grid item xs={12} lg={8}>
              <RevenueChart
                data={dashboardData ? dashboardData.salesOverTime : []}
                isLoading={isLoading}
              />
            </Grid>
            
            <Grid item xs={12} lg={4}>
              <DashboardCard
                title="Channel Distribution"
                subtitle="Orders by integration"
              >
                <Box sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
                  <OrdersByIntegration
                    data={dashboardData ? dashboardData.salesByIntegration : []}
                    isLoading={isLoading}
                  />
                </Box>
              </DashboardCard>
            </Grid>
            
            {/* Orders Distribution and Product Performance */}
            <Grid item xs={12} md={6}>
              <DashboardCard
                title="Orders Distribution"
                subtitle="By delivery and payment methods"
              >
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <EnhancedDistributionChart
                      title="Delivery Methods"
                      data={[
                        { 
                          name: 'Home', 
                          value: dashboardData?.deliveryMethodStats.home || 0, 
                          icon: <IconHome size={16} />,
                          color: '#6870fa'
                        },
                        { 
                          name: 'Locker', 
                          value: dashboardData?.deliveryMethodStats.locker || 0,
                          icon: <IconTimeline size={16} />,
                          color: '#7987ff'
                        }
                      ]}
                      isLoading={isLoading}
                      height={250}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <EnhancedDistributionChart
                      title="Payment Methods"
                      data={[
                        { 
                          name: 'Card', 
                          value: dashboardData?.paymentMethodStats.card || 0,
                          icon: <IconCreditCard size={16} />,
                          color: '#00c292'
                        },
                        { 
                          name: 'COD', 
                          value: dashboardData?.paymentMethodStats.cod || 0,
                          icon: <IconCash size={16} />,
                          color: '#ff9f40'
                        }
                      ]}
                      isLoading={isLoading}
                      height={250}
                    />
                  </Grid>
                </Grid>
              </DashboardCard>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <DashboardCard
                title="Product Performance"
                subtitle="Top 5 products by revenue"
              >
                <ProductPerformanceChart
                  data={dashboardData ? dashboardData.productStats : []}
                  isLoading={isLoading}
                />
              </DashboardCard>
            </Grid>
          
            {/* Products table */}
            <Grid item xs={12}>
              <ProductOffersTable
                data={dashboardData ? dashboardData.productStats : []}
                isLoading={isLoading}
              />
            </Grid>
          </Grid>
        </Box>
      )}
    </PageContainer>
  );
}
