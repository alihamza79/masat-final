'use client';
import { Grid, Box, useMediaQuery, useTheme, Typography } from '@mui/material';
import PageContainer from '@/app/components/container/PageContainer';
import ExpensesSummaryCards from './components/ExpensesSummaryCards';
import ExpensesVsProfitChart from './components/ExpensesVsProfitChart';
import ExpensesList from './components/ExpensesList';
import React from 'react';
import { useTranslation } from 'react-i18next';

const CARDS_CHART_HEIGHT = 420;

const ExpensesPage = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <PageContainer title={t('expenses.title')} description={t('expenses.pageDescription')}>
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
                {t('expenses.title')}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Grid container spacing={3} alignItems="stretch">
          {/* Left: 2x2 grid of four summary cards */}
          <Grid item xs={12} md={4} sx={{ height: { md: `${CARDS_CHART_HEIGHT}px`, xs: 'auto' } }}>
            <ExpensesSummaryCards grid2x2 height={isMdUp ? CARDS_CHART_HEIGHT : undefined} />
          </Grid>
          {/* Right: Chart, same height as two rows of cards */}
          <Grid item xs={12} md={8} sx={{ display: 'flex', flexDirection: 'column', height: { md: `${CARDS_CHART_HEIGHT}px`, xs: 'auto' } }}>
            <ExpensesVsProfitChart fullHeight height={isMdUp ? CARDS_CHART_HEIGHT : undefined} />
          </Grid>
        </Grid>
        {/* Expenses List below, full width */}
        <Box mt={3}>
          <ExpensesList />
        </Box>
      </Box>
    </PageContainer>
  );
};

export default ExpensesPage; 