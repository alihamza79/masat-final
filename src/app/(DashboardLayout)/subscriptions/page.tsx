'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Alert,
} from '@mui/material';
import PageContainer from '@/app/components/container/PageContainer';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { IconReceipt } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

// Import hooks
import { useSubscription, usePaymentHistory } from '@/lib/hooks/useSubscription';

// Import components
import SubscriptionCard from './components/SubscriptionCard';
import PaymentHistoryTable from './components/PaymentHistoryTable';
import SubscriptionSkeleton from './components/SubscriptionSkeleton';

const SubscriptionsPage = () => {
  const { t } = useTranslation();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Use subscription hook
  const { 
    subscription,
    isSubscriptionLoading,
    subscriptionError,
    openBillingPortal,
    isBillingPortalLoading
  } = useSubscription();

  // Use payment history hook with pagination
  const {
    payments,
    pagination,
    isLoading: isPaymentsLoading,
    error: paymentsError,
    refetch: refetchPayments
  } = usePaymentHistory(1, rowsPerPage);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Handle page change for payment history
  const handlePageChange = (page: number) => {
    refetchPayments();
  };

  // Handle rows per page change for payment history
  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    refetchPayments();
  };

  // Redirect to login if unauthenticated
  if (status === 'unauthenticated') {
    router.push('/auth/auth1/login');
    return null;
  }

  // Show loading skeleton when loading
  if (status === 'loading' || (status === 'authenticated' && isSubscriptionLoading)) {
    return (
      <PageContainer title={t('subscription.title')} description={t('subscription.description')}>
        <SubscriptionSkeleton />
      </PageContainer>
    );
  }

  // Show error if subscription fetch failed
  if (subscriptionError) {
    return (
      <PageContainer title={t('subscription.title')} description={t('subscription.description')}>
        <Alert severity="error" sx={{ my: 2 }}>
          {subscriptionError instanceof Error ? subscriptionError.message : t('subscription.errors.fetchProfile')}
        </Alert>
      </PageContainer>
    );
  }

  return (
    <PageContainer title={t('subscription.title')} description={t('subscription.description')}>
      <Box mt={0}>
        <Typography variant="h4" mb={4}>
          {t('subscription.title')}
        </Typography>

        {/* Subscription Card */}
        <SubscriptionCard 
          subscription={subscription}
          isLoading={isSubscriptionLoading}
          onManageSubscription={openBillingPortal}
          isBillingPortalLoading={isBillingPortalLoading}
        />
        
        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="subscription tabs">
            <Tab 
              icon={<IconReceipt size="18" />} 
              iconPosition="start" 
              label={t('subscription.paymentHistory')}
              id="tab-0" 
            />
          </Tabs>
        </Box>

        {/* Tab Panels */}
        <div role="tabpanel" hidden={activeTab !== 0}>
          {activeTab === 0 && (
            <PaymentHistoryTable
              payments={payments}
              pagination={pagination}
              isLoading={isPaymentsLoading}
              error={paymentsError instanceof Error ? paymentsError : null}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
            />
          )}
        </div>
      </Box>
    </PageContainer>
  );
};

export default SubscriptionsPage; 