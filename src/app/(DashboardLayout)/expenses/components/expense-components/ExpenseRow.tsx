'use client';
import { Box, Chip, CircularProgress, IconButton, Stack, TableCell, TableRow, Typography } from '@mui/material';
import { IconDotsVertical } from '@tabler/icons-react';
import { format } from 'date-fns';
import React from 'react';
import { ProductImage } from './index';
import { Expense } from '@/lib/hooks/useExpenses';
import { useTranslation } from 'react-i18next';

interface ExpenseRowProps {
  expense: Expense;
  isMobile: boolean;
  isDeleting: string | null;
  onMenuOpen: (event: React.MouseEvent<HTMLElement>, expense: Expense) => void;
}

const ExpenseRow = ({ expense, isMobile, isDeleting, onMenuOpen }: ExpenseRowProps) => {
  const { t } = useTranslation();

  // Format date in a readable format
  const formatDate = (dateString: string | Date) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch (error) {
      return t('expenses.list.invalidDate');
    }
  };

  return (
    <TableRow sx={{ '&:not(:last-child)': { borderBottom: isMobile ? '8px solid rgba(0, 0, 0, 0.04)' : 'inherit' } }}>
      <TableCell align="left" sx={{ py: isMobile ? 2 : 1 }}>
        {expense.type === 'cogs' && expense.product ? (
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="flex-start">
            <Box sx={{ 
              width: isMobile ? 48 : 40, 
              height: isMobile ? 48 : 40, 
              flexShrink: 0,
              overflow: 'hidden',
              bgcolor: 'background.neutral', 
              borderRadius: 1,
              aspectRatio: '1/1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              '& img': {
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }
            }}>
              <ProductImage product={expense.product} size="small" />
            </Box>
            <Typography variant={isMobile ? "body1" : "body2"} fontWeight={isMobile ? 500 : 400}>
              {expense.description}
            </Typography>
          </Stack>
        ) : (
          <Typography variant={isMobile ? "body1" : "body2"} fontWeight={isMobile ? 500 : 400}>
            {expense.description}
          </Typography>
        )}
        {isMobile && (
          <>
            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: "flex-start" }}>
              <Chip
                label={expense.type === 'one-time' ? t('expenses.list.oneTime') : t(`expenses.list.${expense.type}`)}
                color={
                  expense.type === 'cogs'
                    ? 'warning'
                    : expense.type === 'one-time'
                    ? 'info'
                    : 'default'
                }
                size="small"
                sx={{ height: 24 }}
              />
              {expense.isRecurring && (
                <Chip 
                  label={t('expenses.list.recurring')} 
                  color="success" 
                  size="small"
                  sx={{ height: 24 }}
                />
              )}
            </Box>
            <Typography 
              variant="caption" 
              display="block" 
              sx={{ mt: 1, color: 'text.secondary' }}
            >
              {formatDate(expense.date)}
            </Typography>
          </>
        )}
      </TableCell>
      {!isMobile && (
        <TableCell align="center">
          <Chip
            label={expense.type === 'one-time' ? t('expenses.list.oneTime') : t(`expenses.list.${expense.type}`)}
            color={
              expense.type === 'cogs'
                ? 'warning'
                : expense.type === 'one-time'
                ? 'info'
                : 'default'
            }
            size="small"
          />
        </TableCell>
      )}
      <TableCell align="center">
        <Typography 
          variant={isMobile ? "subtitle1" : "body2"} 
          fontWeight={isMobile ? 600 : 400}
        >
          {expense.amount.toLocaleString()} RON
        </Typography>
      </TableCell>
      {!isMobile && <TableCell align="center">{formatDate(expense.date)}</TableCell>}
      {!isMobile && (
        <TableCell align="center">
          {expense.isRecurring ? (
            <Chip label={t('expenses.list.recurring')} color="success" size="small" />
          ) : (
            <Typography variant="body2" color="text.secondary">-</Typography>
          )}
        </TableCell>
      )}
      <TableCell align="right">
        <IconButton
          size="small"
          onClick={(e) => onMenuOpen(e, expense)}
          disabled={isDeleting === expense._id}
        >
          {isDeleting === expense._id ? (
            <CircularProgress size={18} />
          ) : (
            <IconDotsVertical size={isMobile ? 18 : 20} />
          )}
        </IconButton>
      </TableCell>
    </TableRow>
  );
};

export default ExpenseRow; 