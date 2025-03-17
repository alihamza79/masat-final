import React from 'react';
import { Grid, Card, Typography, Stack, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface MetricsCardsProps {
  totalRevenue: number;
  totalExpense: number;
  totalTaxes: number;
  totalVatToBePaid: number;
  totalNetProfit: number;
  netProfitPercentage: number;
  taxPercentage: number;
  vatPercentage: number;
  expensePercentage: number;
}

const MetricsCards: React.FC<MetricsCardsProps> = ({
  totalRevenue,
  totalExpense,
  totalTaxes,
  totalVatToBePaid,
  totalNetProfit,
  netProfitPercentage,
  taxPercentage,
  vatPercentage,
  expensePercentage
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  // Define metrics data
  const metrics = [
    { 
      label: t('calculator.salesEstimator.totalRevenue'), 
      value: totalRevenue, 
      percent: '100.00%' 
    },
    { 
      label: t('calculator.salesEstimator.totalExpenses'), 
      value: totalExpense, 
      percent: `${expensePercentage.toFixed(2)}%` 
    },
    { 
      label: t('calculator.sections.taxes.title'), 
      value: totalTaxes, 
      percent: `${taxPercentage.toFixed(2)}%` 
    },
    { 
      label: t('calculator.sections.taxes.vatToBePaid'), 
      value: totalVatToBePaid, 
      percent: `${vatPercentage.toFixed(2)}%` 
    },
    { 
      label: t('calculator.salesEstimator.totalProfit'), 
      value: totalNetProfit, 
      percent: `${netProfitPercentage.toFixed(2)}%` 
    }
  ];

  return (
    <Grid container spacing={{ xs: 2, sm: 2, md: 2 }} mb={3}>
      {metrics.map((metric) => (
        <Grid item xs={12} sm={6} md={2.4} key={metric.label}>
          <Card 
            sx={{ 
              p: { xs: 1.5, sm: 2 }, 
              bgcolor: theme.palette.mode === 'dark' 
                ? 'rgba(0, 0, 0, 0.1)' 
                : 'grey.50',
              backdropFilter: 'blur(4px)',
              border: '1px solid',
              borderColor: theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'divider',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}
          >
            <Typography 
              variant="subtitle2" 
              sx={{ 
                color: 'text.secondary',
                fontSize: { xs: '11px', sm: '12px' },
                mb: { xs: 0.5, sm: 1 }
              }}
            >
              {metric.label}
            </Typography>
            <Stack 
              direction="row" 
              alignItems="center" 
              spacing={1}
              sx={{
                flexWrap: { xs: 'wrap', sm: 'nowrap' }
              }}
            >
              <Typography 
                variant="h6" 
                sx={{ 
                  color: 'text.primary',
                  fontSize: { xs: '14px', sm: '16px' },
                  fontWeight: 600
                }}
              >
                lei {metric.value.toFixed(2)}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'text.secondary',
                  fontSize: { xs: '10px', sm: '11px' }
                }}
              >
                ({metric.percent})
              </Typography>
            </Stack>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default MetricsCards; 