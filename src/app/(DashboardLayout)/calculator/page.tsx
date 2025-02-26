'use client';
import React from 'react';
import { Grid, Box, Card } from "@mui/material";
import PageContainer from '@/app/components/container/PageContainer';
import PageHeader from './components/PageHeader';
import Calculator from '@/app/(DashboardLayout)/calculator/components/Calculator';
import TradeProfiles from './components/TradeProfiles';
import { CalculatorProvider } from './context/CalculatorContext';

const CalculatorPage = () => {
  return (
    <PageContainer title="Calculator" description="Product Performance Calculator">
      <Box>
        <PageHeader />
        <Grid container spacing={3} mt={1}>
          <Grid item xs={12}>
            <CalculatorProvider>
              {/* Trade Profiles Section */}
              <Box sx={{ mb: 3, px: { xs: 1, sm: 2 } }}>
                <TradeProfiles />
              </Box>

              {/* Calculator Section */}
              <Box sx={{ mb: 4, mt: 5, px: { xs: 1, sm: 2 } }}>
                <Calculator />
              </Box>
            </CalculatorProvider>
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  );
};

export default CalculatorPage; 