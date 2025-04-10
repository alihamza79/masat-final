'use client';
export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { Grid, Box, Card } from "@mui/material";
import PageContainer from '@/app/components/container/PageContainer';
import PageHeader from '../../components/analytics-header/PageHeader';
import Calculator from '@/app/(DashboardLayout)/calculator/components/Calculator';
import TradeProfiles from './components/TradeProfiles';
import { CalculatorProvider } from './context/CalculatorContext';
import { CommissionLoadingProvider } from './context/CommissionLoadingContext';

const CalculatorPage = () => {
  return (
    <PageContainer title="Calculator" description="Product Performance Calculator">
      <Box>
        <PageHeader />
        <Grid container spacing={3} mt={1}>
          <Grid item xs={12}>
            <Box sx={{ px: { xs: 2, md: 1.5 } }}>
              <CalculatorProvider>
                <CommissionLoadingProvider>
                  {/* Trade Profiles Section */}
                  <Box sx={{ mb: 4 }}>
                    <TradeProfiles />
                  </Box>

                  {/* Calculator Section */}
                  <Box>
                    <Calculator />
                  </Box>
                </CommissionLoadingProvider>
              </CalculatorProvider>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  );
};

export default CalculatorPage; 