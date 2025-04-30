'use client';
import { Grid, Box, Card, Typography, Stack, useTheme, useMediaQuery, Skeleton } from '@mui/material';
import { IconArrowUpRight, IconArrowDownRight } from '@tabler/icons-react';
import useExpenses from '@/lib/hooks/useExpenses';
import useExpenseStats from '@/lib/hooks/useExpenseStats';

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Fetch all expense data
  const { expenses, isLoading } = useExpenses();
  
  // Calculate expense statistics
  const stats = useExpenseStats(expenses);

  // Create cards data based on expense stats
  const summaryData = [
    {
      title: 'One Time',
      amount: stats.expensesByType['one-time'],
      change: 8.4, // Sample value for now
      type: 'increase' as const,
    },
    {
      title: 'Monthly',
      amount: stats.expensesByType['monthly'],
      change: 5.6,
      type: 'increase' as const,
    },
    {
      title: 'Annually',
      amount: stats.expensesByType['annually'],
      change: 12.3,
      type: 'decrease' as const,
    },
    {
      title: 'COGS',
      amount: stats.expensesByType['cogs'],
      change: 3.2,
      type: 'increase' as const,
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
                  vs Last Year
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
                vs Last Year
              </Typography>
            </Stack>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default ExpensesSummaryCards; 