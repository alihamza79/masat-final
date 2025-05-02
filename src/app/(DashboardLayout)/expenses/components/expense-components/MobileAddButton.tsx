'use client';
import { Box, Button } from '@mui/material';
import { IconPlus } from '@tabler/icons-react';
import React from 'react';

interface MobileAddButtonProps {
  onAddClick: () => void;
}

const MobileAddButton = ({ onAddClick }: MobileAddButtonProps) => {
  return (
    <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
      <Button
        variant="contained"
        color="primary"
        startIcon={<IconPlus />}
        onClick={onAddClick}
        fullWidth
        sx={{
          maxWidth: '250px',
          minHeight: '36px',
          fontSize: '0.813rem',
        }}
      >
        Add Expense
      </Button>
    </Box>
  );
};

export default MobileAddButton; 