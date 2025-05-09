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
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from "react-i18next";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

// Custom components
import EnhancedDistributionChart from "@/app/components/dashboards/custom/EnhancedDistributionChart";
import IntegrationFilter from "@/app/components/dashboards/custom/IntegrationFilter";
import OrdersByIntegration from "@/app/components/dashboards/custom/OrdersByIntegration";
import PeriodSelector, { PeriodType } from "@/app/components/dashboards/custom/PeriodSelector";
import ProductOffersTable from "@/app/components/dashboards/custom/ProductOffersTable";
import ProductPerformanceChart from "@/app/components/dashboards/custom/ProductPerformanceChart";
import RevenueChart from "@/app/components/dashboards/custom/RevenueChart";
import SimplifiedStatsCard, { SimplifiedStatsCardSkeleton } from "@/app/components/dashboards/custom/SimplifiedStatsCard";
import DashboardCard from "@/app/components/shared/DashboardCard";
import ProductTable from "@/app/components/dashboards/custom/ProductTable";
import DashboardSkeleton from "@/app/components/dashboards/custom/DashboardSkeleton";

// Services and utilities
import { calculateDateRange, formatDateForAPI } from "@/app/components/dashboards/custom/dateUtils";
import dashboardService, { DashboardData, DASHBOARD_QUERY_KEY } from "@/lib/services/dashboardService";

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
  const { t } = useTranslation();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('allTime');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
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
  
  // Calculate date range based on selected period
  const dateRange = calculateDateRange(selectedPeriod, customStartDate, customEndDate);
  const startDateStr = formatDateForAPI(dateRange.startDate);
  const endDateStr = formatDateForAPI(dateRange.endDate);
  
  // Use React Query to fetch dashboard data
  const { 
    data: dashboardResponse, 
    isLoading,
  } = useQuery({
    queryKey: [...DASHBOARD_QUERY_KEY, startDateStr, endDateStr, selectedIntegrationIds],
    queryFn: async () => {
      // If no integrations are selected, don't fetch data
      if (selectedIntegrationIds.length === 0) {
        return {
          success: true,
          data: dashboardService.getMockDashboardData()
        };
      }
      
      try {
        console.log(`Fetching dashboard data for period: ${selectedPeriod}`, {
          startDate: startDateStr,
          endDate: endDateStr,
          integrationIds: selectedIntegrationIds
        });
        
        // Call the dashboard API with date range and integration IDs
        return await dashboardService.getDashboardData(startDateStr, endDateStr, selectedIntegrationIds);
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message || 'An error occurred while fetching dashboard data');
        return {
          success: true,
          data: dashboardService.getMockDashboardData()
        };
      }
    },
    enabled: !isLoadingIntegrations && selectedIntegrationIds.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Extract dashboard data from response
  const dashboardData = dashboardResponse?.success ? dashboardResponse.data : null;
  
  // Handle period selection
  const handlePeriodChange = (period: PeriodType, startDate?: string, endDate?: string) => {
    setSelectedPeriod(period);
    if (period === 'custom' && startDate && endDate) {
      setCustomStartDate(startDate);
      setCustomEndDate(endDate);
    }
  };
  
  // Handle integration filter change
  const handleIntegrationFilterChange = (ids: string[]) => {
    setSelectedIntegrationIds(ids);
  };
  
  // Format currency for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value) + ' RON';
  };
  
  // Prepare delivery and payment methods data for charts
  const deliveryMethodsData = dashboardData ? [
    { name: 'Home Delivery', value: dashboardData.deliveryMethodStats.home },
    { name: 'Locker', value: dashboardData.deliveryMethodStats.locker }
  ] : [];
  
  const paymentMethodsData = dashboardData ? [
    { name: 'Card', value: dashboardData.paymentMethodStats.card },
    { name: 'COD', value: dashboardData.paymentMethodStats.cod },
    { name: 'Bank', value: dashboardData.paymentMethodStats.bank }
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
    <PageContainer title={t('dashboard.title')} description={t('dashboard.pageDescription')}>
      <Box>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box 
              display="flex" 
              alignItems="center" 
              justifyContent="space-between" 
              mb={3}
              flexDirection={{ xs: 'column', sm: 'row' }}
              gap={2}
            >
              <Typography 
                variant="h2" 
                sx={{ 
                  fontSize: { xs: '1.5rem', md: 'h2.fontSize' },
                  textAlign: { xs: 'center', sm: 'left' },
                  width: '100%'
                }}
              >
                {t('dashboard.title')}
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                flexWrap: 'nowrap', 
                alignItems: 'center',
                flexShrink: 0
              }}>
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
          </Grid>
        </Grid>
      
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {/* Only show "no integrations" warning when ALL loading is complete */}
        {!isLoadingIntegrations && !isLoading && selectedIntegrationIds.length === 0 && integrations && integrations.length > 0 && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            {t('dashboard.noIntegrationsSelected')}
          </Alert>
        )}
        
        {/* No integrations created yet - only show after ALL loading is complete */}
        {!isLoadingIntegrations && !isLoading && integrations && integrations.length === 0 && (
          <Alert severity="info" sx={{ mb: 3 }}>
            {t('dashboard.noIntegrationsCreated')}
          </Alert>
        )}
        
        {/* Main dashboard content */}
        {(isLoadingIntegrations || isLoading) ? (
          // Show skeleton during any loading state
          <DashboardSkeleton />
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
                ? t('dashboard.selectToView')
                : t('dashboard.createToView')}
            </Typography>
          </Box>
        ) : (
          // Show dashboard when data is loaded
          <Box sx={{ mx: -1.5 }}>
            <Grid container spacing={3} sx={{ px: 1.5 }}>
              {/* Top stat cards row */}
              <Grid container item spacing={1} sx={{ mb: 1 }}>
                <Grid item xs={12} sm={6} md={4} lg={2} sx={{ p: 0 }}>
                  <SimplifiedStatsCard
                    title={t('dashboard.stats.totalOrders')}
                    value={dashboardData ? dashboardData.orderStats.totalOrders.toString() : "0"}
                    icon={<IconShoppingCart />}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={2} sx={{ p: 0 }}>
                  <SimplifiedStatsCard
                    title={t('dashboard.stats.grossRevenue')}
                    value={dashboardData ? formatCurrency(dashboardData.orderStats.grossRevenue) : "0 RON"}
                    icon={<IconCash />}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={2} sx={{ p: 0 }}>
                  <SimplifiedStatsCard
                    title={t('dashboard.stats.profit')}
                    value={dashboardData ? formatCurrency(dashboardData.orderStats.profitMargin) : "0 RON"}
                    icon={<IconCoin />}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={2} sx={{ p: 0 }}>
                  <SimplifiedStatsCard
                    title={t('dashboard.stats.costOfGoods')}
                    value={dashboardData ? formatCurrency(dashboardData.orderStats.costOfGoods) : "0 RON"}
                    icon={<IconReportMoney />}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={2} sx={{ p: 0 }}>
                  <SimplifiedStatsCard
                    title={t('dashboard.stats.refundedOrders')}
                    value={dashboardData ? dashboardData.orderStats.refundedOrders.toString() : "0"}
                    icon={<IconRefresh />}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={2} sx={{ p: 0 }}>
                  <SimplifiedStatsCard
                    title={t('dashboard.stats.shippingRevenue')}
                    value={dashboardData ? formatCurrency(dashboardData.orderStats.shippingRevenue) : "0 RON"}
                    icon={<IconTruckDelivery />}
                  />
                </Grid>
              </Grid>
              
              {/* Revenue chart and Channel Distribution */}
              <Grid item xs={12} lg={8}>
                <RevenueChart
                  data={dashboardData ? dashboardData.salesOverTime : []}
                  isLoading={isLoading}
                  chartTotals={dashboardData?.chartTotals}
                  title={t('dashboard.charts.revenueProfit.title')}
                  subtitle={t('dashboard.charts.revenueProfit.subtitle')}
                />
              </Grid>
              
              <Grid item xs={12} lg={4}>
                <DashboardCard
                  title={t('dashboard.charts.channelDistribution.title')}
                  subtitle={t('dashboard.charts.channelDistribution.subtitle')}
                >
                  <Box sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%'
                  }}>
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
                  title={t('dashboard.charts.ordersDistribution.title')}
                  subtitle={t('dashboard.charts.ordersDistribution.subtitle')}
                >
                  <Grid container spacing={2} sx={{ height: '100%', alignItems: 'stretch' }}>
                    <Grid item xs={12} sm={6} sx={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      height: { xs: 'auto', sm: '100%' },
                      mb: { xs: 3, sm: 0 },
                      minHeight: { xs: '280px', sm: 'auto' },
                      '& > div': { 
                        width: '100%',
                        height: { xs: '320px', sm: '300px' },
                      }
                    }}>
                      <EnhancedDistributionChart
                        title={t('dashboard.charts.deliveryMethods.title')}
                        data={[
                          { 
                            name: t('dashboard.charts.deliveryMethods.home'), 
                            value: dashboardData?.deliveryMethodStats.home || 0, 
                            icon: <IconHome size={16} />,
                            color: '#7c86ff'
                          },
                          { 
                            name: t('dashboard.charts.deliveryMethods.locker'), 
                            value: dashboardData?.deliveryMethodStats.locker || 0,
                            icon: <IconTimeline size={16} />,
                            color: '#55b9f3'
                          }
                        ].filter(item => 
                          // Only include items with non-zero values, or include all if all are zero
                          item.value > 0 || 
                          ((dashboardData?.deliveryMethodStats.home || 0) + 
                           (dashboardData?.deliveryMethodStats.locker || 0) === 0)
                        )}
                        isLoading={isLoading}
                        height="100%"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} sx={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      height: { xs: 'auto', sm: '100%' },
                      minHeight: { xs: '280px', sm: 'auto' },
                      '& > div': { 
                        width: '100%',
                        height: { xs: '320px', sm: '300px' },
                      }
                    }}>
                      <EnhancedDistributionChart
                        title={t('dashboard.charts.paymentMethods.title')}
                        data={[
                          { 
                            name: t('dashboard.charts.paymentMethods.card'), 
                            value: dashboardData?.paymentMethodStats.card || 0,
                            icon: <IconCreditCard size={16} />,
                            color: '#26c6a0'
                          },
                          { 
                            name: t('dashboard.charts.paymentMethods.cod'), 
                            value: dashboardData?.paymentMethodStats.cod || 0,
                            icon: <IconCash size={16} />,
                            color: '#ffa55c'
                          },
                          { 
                            name: t('dashboard.charts.paymentMethods.bank'), 
                            value: dashboardData?.paymentMethodStats.bank || 0,
                            icon: <IconReportMoney size={16} />,
                            color: '#55b9f3'
                          }
                        ].filter(item => 
                          // Only include items with non-zero values, or include all if all are zero
                          item.value > 0 || 
                          ((dashboardData?.paymentMethodStats.card || 0) + 
                           (dashboardData?.paymentMethodStats.cod || 0) + 
                           (dashboardData?.paymentMethodStats.bank || 0) === 0)
                        )}
                        isLoading={isLoading}
                        height="100%"
                      />
                    </Grid>
                  </Grid>
                </DashboardCard>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <DashboardCard
                  title={t('dashboard.charts.productPerformance.title')}
                  subtitle={t('dashboard.charts.productPerformance.subtitle')}
                >
                  <ProductPerformanceChart
                    data={dashboardData ? dashboardData.productStats : []}
                    isLoading={isLoading}
                  />
                </DashboardCard>
              </Grid>
            
              {/* Products table */}
              <Grid item xs={12}>
                <ProductTable
                  data={dashboardData?.allProducts || []}
                  isLoading={isLoading}
                />
              </Grid>
            </Grid>
          </Box>
        )}
      </Box>
    </PageContainer>
  );
}
