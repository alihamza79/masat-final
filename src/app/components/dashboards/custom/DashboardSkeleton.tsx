import React from 'react';
import { Box, Grid, Skeleton, useTheme, Stack } from '@mui/material';
import DashboardCard from '../../shared/DashboardCard';

// Import individual component skeletons
import { RevenueChartSkeleton } from './RevenueChart';
import { ProductPerformanceChartSkeleton } from './ProductPerformanceChart';
import { OrdersByIntegrationSkeleton } from './OrdersByIntegration';
import { ProductTableSkeleton } from './ProductTable';

/**
 * Top stat card skeleton
 */
export const StatCardSkeleton = () => {
  const theme = useTheme();
  
  return (
    <Box 
      sx={{ 
        height: '100%',
        p: 2,
        borderRadius: 2,
        backgroundColor: theme.palette.background.paper,
        boxShadow: theme.shadows[0],
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Icon placeholder */}
      <Skeleton variant="circular" width={36} height={36} sx={{ mb: 1 }} />
      
      {/* Value placeholder */}
      <Skeleton variant="text" width="60%" height={32} sx={{ mb: 0.5 }} />
      
      {/* Title placeholder */}
      <Skeleton variant="text" width="80%" height={24} />
    </Box>
  );
};

/**
 * Chart skeleton for line/area charts
 */
export const ChartSkeleton = ({ height = 350 }: { height?: number }) => {
  return (
    <Box sx={{ width: '100%', height }}>
      <Skeleton variant="rectangular" width="100%" height="100%" sx={{ borderRadius: 1 }} />
    </Box>
  );
};

/**
 * Donut chart skeleton
 */
export const DonutChartSkeleton = ({ height = 280 }: { height?: number }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <Skeleton variant="circular" width={height * 0.7} height={height * 0.7} sx={{ mb: 2 }} />
      <Stack direction="row" spacing={2} justifyContent="center">
        <Skeleton variant="text" width={60} height={20} />
        <Skeleton variant="text" width={60} height={20} />
      </Stack>
    </Box>
  );
};

/**
 * Full dashboard skeleton
 */
const DashboardSkeleton = () => {
  return (
    <Box sx={{ mx: -1.5 }}>
      <Grid container spacing={3} sx={{ px: 1.5 }}>
        {/* Top stat cards row */}
        <Grid container item spacing={3} sx={{ mb: 1 }}>
          {Array(6).fill(0).map((_, i) => (
            <Grid item xs={12} sm={6} md={4} lg={2} key={i}>
              <StatCardSkeleton />
            </Grid>
          ))}
        </Grid>
        
        {/* Revenue chart and Channel Distribution */}
        <Grid item xs={12} lg={8}>
          <RevenueChartSkeleton />
        </Grid>
        
        <Grid item xs={12} lg={4}>
          <DashboardCard title="Channel Distribution" subtitle="Orders by integration">
            <OrdersByIntegrationSkeleton />
          </DashboardCard>
        </Grid>
        
        {/* Orders Distribution and Product Performance */}
        <Grid item xs={12} md={6}>
          <DashboardCard title="Orders Distribution" subtitle="By delivery and payment methods">
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <DonutChartSkeleton />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DonutChartSkeleton />
              </Grid>
            </Grid>
          </DashboardCard>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <DashboardCard title="Product Performance" subtitle="Top 5 products by revenue">
            <ProductPerformanceChartSkeleton />
          </DashboardCard>
        </Grid>
      
        {/* Products table */}
        <Grid item xs={12}>
          <ProductTableSkeleton />
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardSkeleton; 