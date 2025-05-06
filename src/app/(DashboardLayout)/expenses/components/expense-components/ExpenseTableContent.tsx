'use client';
import { Box, Table, TableBody, TableContainer } from '@mui/material';
import React from 'react';
import { Expense } from '@/lib/hooks/useExpenses';
import ExpenseTableHeader from './ExpenseTableHeader';
import ExpenseRow from './ExpenseRow';

interface ExpenseTableContentProps {
  expenses: Expense[];
  isMobile: boolean;
  isDeleting: string | null;
  onMenuOpen: (event: React.MouseEvent<HTMLElement>, expense: Expense) => void;
}

const ExpenseTableContent = ({ 
  expenses, 
  isMobile, 
  isDeleting,
  onMenuOpen 
}: ExpenseTableContentProps) => {
  return (
    <Box sx={{ width: '100%', overflowX: 'auto' }}>
      <TableContainer sx={{ minWidth: { xs: 280, sm: 550 } }}>
        <Table size={isMobile ? "small" : "medium"}>
          <ExpenseTableHeader isMobile={isMobile} />
          <TableBody>
            {expenses.map((expense) => (
              <ExpenseRow
                key={expense._id}
                expense={expense}
                isMobile={isMobile}
                isDeleting={isDeleting}
                onMenuOpen={onMenuOpen}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ExpenseTableContent; 