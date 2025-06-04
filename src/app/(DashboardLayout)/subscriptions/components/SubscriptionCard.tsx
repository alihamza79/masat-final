'use client';

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Chip,
  Button,
  useTheme
} from '@mui/material';
import { IconCreditCard, IconExternalLink } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import moment from 'moment';
import { Subscription } from '@/lib/hooks/useSubscription';
import { useTranslation } from 'react-i18next';

interface SubscriptionCardProps {
  subscription: Subscription | null | undefined;
  isLoading: boolean;
  onManageSubscription: () => void;
  isBillingPortalLoading: boolean;
}

const SubscriptionCard = ({ 
  subscription, 
  isLoading, 
  onManageSubscription,
  isBillingPortalLoading
}: SubscriptionCardProps) => {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();

  // Function to capitalize first letter
  const capitalize = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // Function to get subscription status color
  const getSubscriptionStatusColor = (status: string | null) => {
    if (!status) return 'default';
    
    switch (status) {
      case 'active':
        return 'success';
      case 'past_due':
        return 'warning';
      case 'canceled':
        return 'error';
      case 'trialing':
        return 'info';
      default:
        return 'default';
    }
  };

  if (!subscription) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" mb={2}>
            {t('subscription.noActiveSubscription')}
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => router.push('/pricing')}
          >
            {t('subscription.viewPricingPlans')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Check if user is on free plan
  const isFreePlan = subscription.plan?.toLowerCase() === 'free';

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={3}>
          <IconCreditCard 
            size={36} 
            color={theme.palette.primary.main} 
            style={{ marginRight: '16px' }}
          />
          <Box>
            <Typography variant="h5" fontWeight="bold">
              {capitalize(subscription.plan)} {t('subscription.plan')}
            </Typography>
            <Chip 
              label={subscription.status ? capitalize(subscription.status) : t('subscription.free')} 
              size="small" 
              color={getSubscriptionStatusColor(subscription.status) as any}
              sx={{ mt: 0.5 }}
            />
          </Box>
        </Box>

        <Grid container spacing={3}>
          {subscription.id && (
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="textSecondary">
                {t('subscription.id')}
              </Typography>
              <Typography variant="body2">
                {subscription.id}
              </Typography>
            </Grid>
          )}
          
          {subscription.createdAt && (
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="textSecondary">
                {t('subscription.startedOn')}
              </Typography>
              <Typography variant="body2">
                {moment(subscription.createdAt).format('MMM DD, YYYY')}
              </Typography>
            </Grid>
          )}
          
          {subscription.expiresAt && (
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="textSecondary">
                {subscription.status === 'canceled' 
                  ? t('subscription.accessUntil')
                  : t('subscription.expiresOn')}
              </Typography>
              <Typography variant="body2">
                {moment(subscription.expiresAt).format('MMM DD, YYYY')}
              </Typography>
            </Grid>
          )}
        </Grid>

        {/* Show different buttons based on subscription status and plan */}
        {isFreePlan ? (
          <Box mt={3}>
            <Button 
              variant="contained" 
              color="primary"
              startIcon={<IconExternalLink size={18} />}
              onClick={() => router.push('/pricing')}
            >
              {t('subscription.upgradeNow')}
            </Button>
          </Box>
        ) : subscription.status === 'active' ? (
          <Box mt={3} display="flex" gap={2}>
            <Button 
              variant="outlined" 
              color="primary"
              onClick={() => router.push('/pricing')}
            >
              {t('subscription.seePricing')}
            </Button>
            <Button 
              variant="contained" 
              color="primary"
              onClick={onManageSubscription}
              disabled={isBillingPortalLoading}
              startIcon={<IconExternalLink size={18} />}
            >
              {isBillingPortalLoading ? t('common.processing') : t('subscription.manageSubscription')}
            </Button>
          </Box>
        ) : subscription.status === 'canceled' && (
          <Box mt={3}>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => router.push('/pricing')}
            >
              {t('subscription.renewSubscription')}
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscriptionCard; 