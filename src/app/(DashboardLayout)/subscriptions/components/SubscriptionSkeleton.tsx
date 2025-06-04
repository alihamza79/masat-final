'use client';

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Skeleton,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Tabs,
  Tab,
  Typography
} from '@mui/material';
import { IconReceipt } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

export const SubscriptionCardSkeleton = () => {
  return (
    <Card sx={{ mb: 3 }}>
      <CardContent sx={{ py: 2 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <Skeleton variant="circular" width={32} height={32} sx={{ mr: 2 }} />
          <Box>
            <Skeleton variant="text" width={150} height={28} />
            <Skeleton variant="rectangular" width={80} height={20} sx={{ mt: 0.5, borderRadius: 1 }} />
          </Box>
        </Box>

        <Grid container spacing={2} sx={{ mb: 1 }}>
          <Grid item xs={12} sm={6}>
            <Skeleton variant="text" width={120} height={16} sx={{ mb: 0.5 }} />
            <Skeleton variant="text" width={180} height={20} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Skeleton variant="text" width={120} height={16} sx={{ mb: 0.5 }} />
            <Skeleton variant="text" width={150} height={20} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Skeleton variant="text" width={120} height={16} sx={{ mb: 0.5 }} />
            <Skeleton variant="text" width={160} height={20} />
          </Grid>
        </Grid>

        <Box mt={2} display="flex" gap={2}>
          <Skeleton variant="rectangular" width={120} height={32} sx={{ borderRadius: 1 }} />
          <Skeleton variant="rectangular" width={180} height={32} sx={{ borderRadius: 1 }} />
        </Box>
      </CardContent>
    </Card>
  );
};

export const PaymentHistoryTableSkeleton = () => {
  const { t } = useTranslation();
  
  return (
    <>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="payment history skeleton table">
          <TableHead>
            <TableRow>
              <TableCell>{t('subscription.date')}</TableCell>
              <TableCell>{t('subscription.invoiceId')}</TableCell>
              <TableCell>{t('subscription.plan')}</TableCell>
              <TableCell>{t('subscription.billingCycle')}</TableCell>
              <TableCell>{t('subscription.amount')}</TableCell>
              <TableCell>{t('subscription.status')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {[1, 2, 3, 4, 5].map((item) => (
              <TableRow key={item} hover>
                <TableCell><Skeleton variant="text" width={100} /></TableCell>
                <TableCell><Skeleton variant="text" width={150} /></TableCell>
                <TableCell><Skeleton variant="text" width={80} /></TableCell>
                <TableCell><Skeleton variant="text" width={80} /></TableCell>
                <TableCell><Skeleton variant="text" width={80} /></TableCell>
                <TableCell><Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 1 }} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box display="flex" justifyContent="flex-end" py={2}>
        <Skeleton variant="rectangular" width={300} height={40} sx={{ borderRadius: 1 }} />
      </Box>
    </>
  );
};

const SubscriptionSkeleton = () => {
  const { t } = useTranslation();
  
  return (
    <Box mt={0}>
      <Typography variant="h4" mb={4}>
        {t('subscription.title')}
      </Typography>
      
      {/* Subscription Card Skeleton */}
      <SubscriptionCardSkeleton />
      
      {/* Tabs - showing real tab instead of skeleton */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={0} aria-label="subscription tabs">
          <Tab 
            icon={<IconReceipt size="18" />} 
            iconPosition="start" 
            label={t('subscription.paymentHistory')}
            id="tab-0" 
          />
        </Tabs>
      </Box>
      
      {/* Payment History Skeleton */}
      <PaymentHistoryTableSkeleton />
    </Box>
  );
};

export default SubscriptionSkeleton; 