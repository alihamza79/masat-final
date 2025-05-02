'use client';
import { Box, Button, Typography } from '@mui/material';
import { IconPlus } from '@tabler/icons-react';
import React from 'react';

interface ExpenseEmptyStateProps {
  onAddClick: () => void;
}

const ExpenseEmptyState = ({ onAddClick }: ExpenseEmptyStateProps) => {
  return (
    <Box sx={{ textAlign: 'center', py: 3 }}>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        No expenses found.
      </Typography>
      <Button
        variant="outlined"
        startIcon={<IconPlus />}
        onClick={onAddClick}
        sx={{ mt: 1 }}
      >
        Add Your First Expense
      </Button>
    </Box>
  );
};

export default ExpenseEmptyState; 