'use client';
import { Box, Button, Typography } from '@mui/material';
import { IconPlus } from '@tabler/icons-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

interface ExpenseEmptyStateProps {
  onAddClick: () => void;
}

const ExpenseEmptyState = ({ onAddClick }: ExpenseEmptyStateProps) => {
  const { t } = useTranslation();
  
  return (
    <Box sx={{ textAlign: 'center', py: 3 }}>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        {t('expenses.list.noExpensesFound')}
      </Typography>
      <Button
        variant="outlined"
        startIcon={<IconPlus />}
        onClick={onAddClick}
        sx={{ mt: 1 }}
      >
        {t('expenses.list.addYourFirstExpense')}
      </Button>
    </Box>
  );
};

export default ExpenseEmptyState; 