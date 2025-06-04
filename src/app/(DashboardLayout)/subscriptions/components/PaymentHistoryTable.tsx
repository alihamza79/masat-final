'use client';

import React, { useState } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Alert,
  Box,
  CircularProgress,
} from '@mui/material';
import moment from 'moment';
import { Payment, Pagination } from '@/lib/hooks/useSubscription';
import { useTranslation } from 'react-i18next';

interface PaymentHistoryTableProps {
  payments: Payment[];
  pagination: Pagination;
  isLoading: boolean;
  error: Error | null;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
}

const PaymentHistoryTable = ({
  payments,
  pagination,
  isLoading,
  error,
  onPageChange,
  onRowsPerPageChange
}: PaymentHistoryTableProps) => {
  const { t } = useTranslation();

  // Function to format currency
  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  // Function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      case 'refunded':
        return 'info';
      default:
        return 'default';
    }
  };

  // Function to capitalize first letter
  const capitalize = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // Handle page change
  const handleChangePage = (_: unknown, newPage: number) => {
    onPageChange(newPage + 1); // API uses 1-indexed pages
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    onRowsPerPageChange(parseInt(event.target.value, 10));
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" my={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        {error.message || t('subscription.errors.fetchPayments')}
      </Alert>
    );
  }

  if (payments.length === 0) {
    return (
      <Alert severity="info" sx={{ my: 2 }}>
        {t('subscription.noPaymentHistory')}
      </Alert>
    );
  }

  return (
    <>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="payment history table">
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
            {payments.map((payment) => (
              <TableRow key={payment._id} hover>
                <TableCell>
                  {moment(payment.createdAt).format('MMM DD, YYYY')}
                </TableCell>
                <TableCell>
                  {payment.stripeInvoiceId || payment.stripeSessionId || '-'}
                </TableCell>
                <TableCell>
                  {capitalize(payment.plan)}
                </TableCell>
                <TableCell>
                  {capitalize(payment.billingCycle)}
                </TableCell>
                <TableCell>
                  {formatCurrency(payment.amount, payment.currency)}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={capitalize(payment.status)} 
                    size="small" 
                    color={getStatusColor(payment.status) as any}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={pagination.total}
        rowsPerPage={pagination.limit}
        page={pagination.page - 1} // API uses 1-indexed pages, MUI uses 0-indexed
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </>
  );
};

export default PaymentHistoryTable; 