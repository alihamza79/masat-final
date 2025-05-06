'use client';
import { TableCell, TableHead, TableRow } from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';

interface ExpenseTableHeaderProps {
  isMobile: boolean;
}

const ExpenseTableHeader = ({ isMobile }: ExpenseTableHeaderProps) => {
  const { t } = useTranslation();
  
  return (
    <TableHead>
      <TableRow>
        <TableCell sx={{ minWidth: 200, maxWidth: 300 }} align="left">{t('expenses.list.columns.description')}</TableCell>
        {!isMobile && <TableCell sx={{ width: 100 }} align="center">{t('expenses.list.columns.type')}</TableCell>}
        <TableCell sx={{ width: 100 }} align="center">{t('expenses.list.columns.amount')}</TableCell>
        {!isMobile && <TableCell sx={{ width: 100 }} align="center">{t('expenses.list.columns.date')}</TableCell>}
        {!isMobile && <TableCell sx={{ width: 90 }} align="center">{t('expenses.list.columns.status')}</TableCell>}
        <TableCell align="right" sx={{ width: 60 }}>{t('expenses.list.columns.actions')}</TableCell>
      </TableRow>
    </TableHead>
  );
};

export default ExpenseTableHeader; 