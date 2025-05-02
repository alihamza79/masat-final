'use client';
import { TableCell, TableHead, TableRow } from '@mui/material';
import React from 'react';

interface ExpenseTableHeaderProps {
  isMobile: boolean;
}

const ExpenseTableHeader = ({ isMobile }: ExpenseTableHeaderProps) => {
  return (
    <TableHead>
      <TableRow>
        <TableCell sx={{ minWidth: 200, maxWidth: 300 }} align="left">Description</TableCell>
        {!isMobile && <TableCell sx={{ width: 100 }} align="center">Type</TableCell>}
        <TableCell sx={{ width: 100 }} align="center">Amount</TableCell>
        {!isMobile && <TableCell sx={{ width: 100 }} align="center">Date</TableCell>}
        {!isMobile && <TableCell sx={{ width: 90 }} align="center">Status</TableCell>}
        <TableCell align="right" sx={{ width: 60 }}>Actions</TableCell>
      </TableRow>
    </TableHead>
  );
};

export default ExpenseTableHeader; 