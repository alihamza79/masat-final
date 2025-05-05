'use client';
import { Grid, Box, Card, Typography, Stack, useTheme, useMediaQuery, Skeleton } from '@mui/material';
import { IconArrowUpRight, IconArrowDownRight } from '@tabler/icons-react';
import useExpenses, { Expense, ExpenseType } from '@/lib/hooks/useExpenses';
import useExpenseStats from '@/lib/hooks/useExpenseStats';
import { useMemo } from 'react';
import { subYears, format, isWithinInterval } from 'date-fns';
import { useTranslation } from 'react-i18next';

interface ExpensesSummaryCardsProps {
  onlyFirstTwo?: boolean;
  grid2x2?: boolean;
  height?: number;
}

const ExpensesSummaryCards: React.FC<ExpensesSummaryCardsProps> = ({ 
  onlyFirstTwo = false, 
  grid2x2 = false, 
  height 
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Fetch all expense data
  const { expenses, isLoading } = useExpenses();
  
  // Calculate expense statistics
  const stats = useExpenseStats(expenses);

  // Calculate year-over-year percentages
  const yearOverYearComparison = useMemo(() => {
    const result = {
      'one-time': 0,
      'monthly': 0,
      'annually': 0,
      'cogs': 0
    };
    
    if (!expenses || expenses.length === 0) {
      return result;
    }
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const lastYear = currentYear - 1;
    
    // Get expenses from this year and last year by comparing year values
    const thisYearExpenses = expenses.filter((expense: Expense) => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getFullYear() === currentYear;
    });
    
    const lastYearExpenses = expenses.filter((expense: Expense) => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getFullYear() === lastYear;
    });
    
    // Calculate totals by expense type for this year and last year
    const thisYearByType = {
      'one-time': 0,
      'monthly': 0,
      'annually': 0,
      'cogs': 0
    };
    
    const lastYearByType = {
      'one-time': 0,
      'monthly': 0,
      'annually': 0,
      'cogs': 0
    };
    
    thisYearExpenses.forEach((expense: Expense) => {
      thisYearByType[expense.type as keyof typeof thisYearByType] += expense.amount;
    });
    
    lastYearExpenses.forEach((expense: Expense) => {
      lastYearByType[expense.type as keyof typeof lastYearByType] += expense.amount;
    });
    
    // Calculate percentage change
    Object.keys(result).forEach(type => {
      const typedKey = type as keyof typeof result;
      if (lastYearByType[typedKey] > 0) {
        const change = ((thisYearByType[typedKey] - lastYearByType[typedKey]) / lastYearByType[typedKey]) * 100;
        result[typedKey] = parseFloat(change.toFixed(1));
      } else if (thisYearByType[typedKey] > 0) {
        // If no expenses last year but some this year, show 100% increase
        result[typedKey] = 100;
      }
    });

    
    return result;
  }, [expenses]);

  // Create cards data based on expense stats and year-over-year comparison
  const summaryData = [
    {
      title: t('expenses.summary.oneTime'),
      amount: stats.expensesByType['one-time'],
      change: yearOverYearComparison['one-time'],
      type: yearOverYearComparison['one-time'] >= 0 ? 'increase' as const : 'decrease' as const,
    },
    {
      title: t('expenses.summary.monthly'),
      amount: stats.expensesByType['monthly'],
      change: yearOverYearComparison['monthly'],
      type: yearOverYearComparison['monthly'] >= 0 ? 'increase' as const : 'decrease' as const,
    },
    {
      title: t('expenses.summary.annually'),
      amount: stats.expensesByType['annually'],
      change: yearOverYearComparison['annually'],
      type: yearOverYearComparison['annually'] >= 0 ? 'increase' as const : 'decrease' as const,
    },
    {
      title: t('expenses.summary.cogs'),
      amount: stats.expensesByType['cogs'],
      change: yearOverYearComparison['cogs'],
      type: yearOverYearComparison['cogs'] >= 0 ? 'increase' as const : 'decrease' as const,
    },
  ];

  // Filter data based on props
  const data = onlyFirstTwo ? summaryData.slice(0, 2) : summaryData;
  
  // Render loading skeleton
  if (isLoading) {
    return (
      <Grid container spacing={isMobile ? 2 : 3} sx={{ 
        height: height && !isMobile ? `${height}px` : '100%', 
        minHeight: height && !isMobile ? `${height}px` : undefined 
      }}>
        {Array(onlyFirstTwo ? 2 : 4).fill(0).map((_, index) => (
          <Grid 
            item 
            xs={6} 
            sm={6} 
            md={grid2x2 ? 6 : 12} 
            key={index} 
            sx={{ 
              display: 'flex', 
              height: { 
                md: height ? `calc(50% - ${isMobile ? 8 : 12}px)` : 'auto', 
                xs: 'auto' 
              } 
            }}
          >
            <Card sx={{ 
              p: isMobile ? 1.5 : 2.5, 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'center', 
              borderRadius: 2 
            }}>
              <Stack spacing={isMobile ? 0.3 : 1}>
                <Skeleton variant="text" width={80} />
                <Skeleton variant="text" width={120} height={40} />
                <Skeleton variant="text" width={60} />
                <Skeleton variant="text" width={90} />
              </Stack>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }
  
  if (grid2x2) {
    return (
      <Grid container spacing={isMobile ? 2 : 3} sx={{ 
        height: height && !isMobile ? `${height}px` : '100%', 
        minHeight: height && !isMobile ? `${height}px` : undefined 
      }}>
        {data.map((item, index) => (
          <Grid item xs={6} sm={6} md={6} key={index} sx={{ 
            display: 'flex', 
            height: { 
              md: height ? `calc(50% - ${isMobile ? 8 : 12}px)` : 'auto', 
              xs: 'auto' 
            } 
          }}>
            <Card sx={{ 
              p: isMobile ? 1.5 : 2.5, 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'center', 
              borderRadius: 2 
            }}>
              <Stack spacing={isMobile ? 0.3 : 1}>
                <Typography 
                  variant="subtitle1" 
                  fontWeight={700} 
                  mb={isMobile ? 0 : 0.5}
                  fontSize={isMobile ? '0.875rem' : undefined}
                >
                  {item.title}
                </Typography>
                <Typography 
                  variant={isMobile ? "h6" : "h3"} 
                  fontWeight={800} 
                  mb={0.5}
                  sx={isMobile ? {
                    fontSize: '1.125rem',
                    lineHeight: 1.2
                  } : {}}
                >
                  {item.amount.toLocaleString()} RON
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {item.type === 'increase' ? (
                    <IconArrowUpRight size={isMobile ? 16 : 18} color="#22c55e" />
                  ) : (
                    <IconArrowDownRight size={isMobile ? 16 : 18} color="#ef4444" />
                  )}
                  <Typography 
                    variant={isMobile ? "body2" : "subtitle1"} 
                    fontWeight={700} 
                    ml={0.5} 
                    color={item.type === 'increase' ? 'success.main' : 'error.main'}
                    fontSize={isMobile ? '0.75rem' : undefined}
                  >
                    {Math.abs(item.change)}%
                  </Typography>
                </Box>
                <Typography 
                  variant="caption" 
                  color="text.secondary" 
                  mt={isMobile ? 0 : 0.5}
                  fontSize={isMobile ? '0.7rem' : undefined}
                >
                  {t('expenses.summary.vsLastYear')}
                </Typography>
              </Stack>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }
  
  return (
    <Grid container spacing={isMobile ? 2 : 3} sx={{ 
      height: height && !isMobile ? `${height}px` : '100%', 
      minHeight: height && !isMobile ? `${height}px` : undefined 
    }}>
      {data.map((item, index) => (
        <Grid item xs={6} sm={6} md={12} key={index} sx={{ 
          flex: 1, 
          display: 'flex', 
          height: height ? `calc(50% - ${isMobile ? 8 : 12}px)` : 'auto' 
        }}>
          <Card sx={{ 
            p: isMobile ? 1.5 : 2.5, 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            borderRadius: 2 
          }}>
            <Stack spacing={isMobile ? 0.3 : 1}>
              <Typography 
                variant="subtitle1" 
                fontWeight={700} 
                mb={isMobile ? 0 : 0.5}
                fontSize={isMobile ? '0.875rem' : undefined}
              >
                {item.title}
              </Typography>
              <Typography 
                variant={isMobile ? "h6" : "h3"} 
                fontWeight={800} 
                mb={0.5}
                sx={isMobile ? {
                  fontSize: '1.125rem',
                  lineHeight: 1.2
                } : {}}
              >
                {item.amount.toLocaleString()} RON
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {item.type === 'increase' ? (
                  <IconArrowUpRight size={isMobile ? 16 : 18} color="#22c55e" />
                ) : (
                  <IconArrowDownRight size={isMobile ? 16 : 18} color="#ef4444" />
                )}
                <Typography 
                  variant={isMobile ? "body2" : "subtitle1"} 
                  fontWeight={700} 
                  ml={0.5} 
                  color={item.type === 'increase' ? 'success.main' : 'error.main'}
                  fontSize={isMobile ? '0.75rem' : undefined}
                >
                  {Math.abs(item.change)}%
                </Typography>
              </Box>
              <Typography 
                variant="caption" 
                color="text.secondary" 
                mt={isMobile ? 0 : 0.5}
                fontSize={isMobile ? '0.7rem' : undefined}
              >
                {t('expenses.summary.vsLastYear')}
              </Typography>
            </Stack>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default ExpensesSummaryCards; 