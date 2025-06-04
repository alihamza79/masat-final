'use client';

import React, { useEffect, useState } from 'react';
import {
  Grid,
  Typography,
  Box,
  Button,
  CircularProgress,
  Paper,
  Divider,
  Chip,
  Stack,
  Card,
  alpha,
  Zoom,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useSearchParams, useRouter } from 'next/navigation';
import { IconCircleCheck, IconCalendar, IconReceipt, IconArrowRight, IconDashboard, IconCreditCard } from '@tabler/icons-react';
import PageContainer from '@/app/components/container/PageContainer';
import { useTranslation } from 'react-i18next';
import SuccessAnimation from '@/app/components/animations/SuccessAnimation';

// Format a date into a readable string
function formatDate(date: Date): string {
  if (!date || isNaN(date.getTime())) {
    return 'N/A';
  }
  
  try {
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return date.toDateString();
  }
}

const PaymentSuccess = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionDetails, setSessionDetails] = useState<any>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        setError('No session ID provided');
        setLoading(false);
        return;
      }

      try {
        // Verify the payment with your backend
        const response = await fetch(`/api/stripe/verify-payment?session_id=${sessionId}`, {
          method: 'GET',
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to verify payment');
        }

        setSessionDetails(data);
        setLoading(false);
        
        // Trigger celebration effect after data is loaded
        setTimeout(() => {
          setShowCelebration(true);
        }, 300);
      } catch (error: any) {
        console.error('Error verifying payment:', error);
        setError(error.message || 'Something went wrong');
        setLoading(false);
      }
    };

    verifyPayment();
  }, [sessionId]);

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  const handleGoToSubscription = () => {
    router.push('/subscriptions');
  };

  if (loading) {
    return (
      <PageContainer title={t('common.processing')} description={t('common.processing')}>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="60vh"
        >
          <CircularProgress size={60} />
          <Typography variant="h4" mt={4}>
            {t('common.processing')}...
          </Typography>
        </Box>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer title="Payment Error" description="There was an error with your payment">
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="60vh"
        >
          <Typography variant="h3" color="error" gutterBottom>
            Payment Verification Failed
          </Typography>
          <Typography variant="body1" mb={4}>
            {error}
          </Typography>
          <Button variant="contained" color="primary" onClick={() => router.push('/pricing')}>
            Return to Pricing
          </Button>
        </Box>
      </PageContainer>
    );
  }

  const formattedDate = sessionDetails?.created_at 
    ? formatDate(new Date(sessionDetails.created_at)) 
    : sessionDetails?.created 
      ? formatDate(new Date(sessionDetails.created * 1000)) 
      : 'N/A';
      
  const nextBillingDate = sessionDetails?.current_period_end 
    ? formatDate(new Date(sessionDetails.current_period_end * 1000)) 
    : sessionDetails?.period_end 
      ? formatDate(new Date(sessionDetails.period_end * 1000))
      : 'N/A';

  // Format the plan name with proper capitalization
  const formatPlanName = (plan: string | undefined) => {
    if (!plan) return 'N/A';
    return plan.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  // Format the billing cycle with proper capitalization
  const formatBillingCycle = (cycle: string | undefined) => {
    if (!cycle) return 'N/A';
    return cycle.charAt(0).toUpperCase() + cycle.slice(1).toLowerCase();
  };


  return (
    <PageContainer title="Payment Success" description="Your payment was successful">
      {showCelebration && (
        <SuccessAnimation 
          type="confetti"
          duration={2500}
          particleCount={250}
        />
      )}
      
      <Grid container justifyContent="center">
        <Grid item xs={12} sm={10} md={8} lg={6}>
          <Zoom in={!loading} style={{ transitionDelay: '300ms' }}>
            <Card 
              elevation={8} 
              sx={{ 
                p: { xs: 3, sm: 5 }, 
                mt: 4, 
                borderRadius: 2,
                position: 'relative',
                overflow: 'visible'
              }}
            >
              <Box 
                sx={{ 
                  position: 'absolute', 
                  top: -20, 
                  left: '50%', 
                  transform: 'translateX(-50%)',
                  bgcolor: alpha(theme.palette.success.main, 0.1),
                  borderRadius: '50%',
                  p: 1.5
                }}
              >
                <IconCircleCheck size={60} color={theme.palette.success.main} />
              </Box>
              
              <Box textAlign="center" mt={5} mb={4}>
                <Typography variant="h2" fontWeight="bold">
                  Thank You!
                </Typography>
                <Typography variant="h6" color="textSecondary" mt={1}>
                  Your payment was successful
                </Typography>
              </Box>
              
              <Divider sx={{ my: 3 }}>
                <Chip label="Purchase Details" color="primary" />
              </Divider>
              
              {sessionDetails && (
                <Box mb={4}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <Stack spacing={2}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box sx={{ mr: 1.5, color: 'primary.main' }}>
                            <IconReceipt size={22} />
                          </Box>
                          <Box>
                            <Typography variant="caption" color="textSecondary">
                              Plan
                            </Typography>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {formatPlanName(sessionDetails.plan)}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box sx={{ mr: 1.5, color: 'primary.main' }}>
                            <IconCalendar size={22} />
                          </Box>
                          <Box>
                            <Typography variant="caption" color="textSecondary">
                              Billing Cycle
                            </Typography>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {formatBillingCycle(sessionDetails.billing_cycle)}
                            </Typography>
                          </Box>
                        </Box>
                      </Stack>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Stack spacing={2}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box sx={{ mr: 1.5, color: 'primary.main' }}>
                            <IconCreditCard size={22} />
                          </Box>
                          <Box>
                            <Typography variant="caption" color="textSecondary">
                              Amount
                            </Typography>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {sessionDetails.amount || 'N/A'}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box sx={{ mr: 1.5, color: 'primary.main' }}>
                            <IconCalendar size={22} />
                          </Box>
                          <Box>
                            <Typography variant="caption" color="textSecondary">
                              Purchase Date
                            </Typography>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {formattedDate}
                            </Typography>
                          </Box>
                        </Box>
                      </Stack>
                    </Grid>
                  </Grid>
                  
                  <Box 
                    sx={{ 
                      mt: 3, 
                      p: 2, 
                      bgcolor: alpha(theme.palette.primary.main, 0.05), 
                      borderRadius: 1,
                      border: `1px dashed ${alpha(theme.palette.primary.main, 0.3)}`
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          Next Billing Date
                        </Typography>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {nextBillingDate}
                        </Typography>
                      </Box>
                      <Chip 
                        label={sessionDetails.status?.toUpperCase() || 'COMPLETE'} 
                        color="success" 
                        variant="outlined" 
                        size="small"
                      />
                    </Stack>
                  </Box>
                  
                  {(sessionDetails.subscription_id || sessionDetails.invoice_id) && (
                    <Box mt={2}>
                      {sessionDetails.subscription_id && (
                        <Box mb={1}>
                          <Typography variant="caption" color="textSecondary">
                            Subscription ID
                          </Typography>
                          <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                            {sessionDetails.subscription_id}
                          </Typography>
                        </Box>
                      )}
                      
                      {sessionDetails.invoice_id && (
                        <Box>
                          <Typography variant="caption" color="textSecondary">
                            Invoice ID
                          </Typography>
                          <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                            {sessionDetails.invoice_id}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
              )}
              
              <Divider sx={{ my: 3 }} />
              
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<IconDashboard size={20} />}
                  onClick={handleGoToDashboard}
                  fullWidth
                >
                  Go to Dashboard
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  size="large"
                  endIcon={<IconArrowRight size={20} />}
                  onClick={handleGoToSubscription}
                  fullWidth
                >
                  View Subscription
                </Button>
              </Stack>
            </Card>
          </Zoom>
        </Grid>
      </Grid>
    </PageContainer>
  );
};

export default PaymentSuccess; 