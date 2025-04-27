'use client';
import { Grid, Box, Card, Typography, Stack, useTheme, useMediaQuery } from '@mui/material';
import { IconArrowUpRight, IconArrowDownRight } from '@tabler/icons-react';

type ExpenseSummary = {
  title: string;
  amount: number;
  change: number;
  type: 'increase' | 'decrease';
};

const summaryData: ExpenseSummary[] = [
  {
    title: 'One Time',
    amount: 12500,
    change: 2.5,
    type: 'increase',
  },
  {
    title: 'Monthly',
    amount: 34200,
    change: -1.8,
    type: 'decrease',
  },
  {
    title: 'Annually',
    amount: 98500,
    change: 5.2,
    type: 'increase',
  },
  {
    title: 'COGS',
    amount: 45600,
    change: -3.1,
    type: 'decrease',
  },
];

const ExpensesSummaryCards = ({ onlyFirstTwo = false, grid2x2 = false, height }: { onlyFirstTwo?: boolean, grid2x2?: boolean, height?: number }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const data = onlyFirstTwo ? summaryData.slice(0, 2) : summaryData;
  
  if (grid2x2) {
    return (
      <Grid container spacing={isMobile ? 2 : 3} sx={{ height: height && !isMobile ? `${height}px` : '100%', minHeight: height && !isMobile ? `${height}px` : undefined }}>
        {data.map((item, index) => (
          <Grid item xs={6} sm={6} md={6} key={index} sx={{ display: 'flex', height: { md: height ? `calc(50% - ${isMobile ? 8 : 12}px)` : 'auto', xs: 'auto' } }}>
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
    <Grid container spacing={isMobile ? 2 : 3} sx={{ height: height && !isMobile ? `${height}px` : '100%', minHeight: height && !isMobile ? `${height}px` : undefined }}>
      {data.map((item, index) => (
        <Grid item xs={6} sm={6} md={12} key={index} sx={{ flex: 1, display: 'flex', height: height ? `calc(50% - ${isMobile ? 8 : 12}px)` : 'auto' }}>
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