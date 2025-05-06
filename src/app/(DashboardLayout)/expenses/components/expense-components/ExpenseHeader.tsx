'use client';
import { Box, Button, Typography } from '@mui/material';
import { IconPlus } from '@tabler/icons-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

interface ExpenseHeaderProps {
  isMobile: boolean;
  onAddClick: () => void;
}

const ExpenseHeader = ({ isMobile, onAddClick }: ExpenseHeaderProps) => {
  const { t } = useTranslation();
  
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 2,
        alignItems: { xs: 'stretch', sm: 'center' }, 
        mb: 3 
      }}
    >
      <Typography 
        variant="h5"
        sx={{ 
          fontSize: { xs: '1.25rem', md: 'h5.fontSize' },
          textAlign: { xs: 'center', sm: 'left' },
        }}
      >
        {t('expenses.list.title')}
      </Typography>
      {!isMobile && (
        <Button
          variant="contained"
          color="primary"
          startIcon={<IconPlus />}
          onClick={onAddClick}
          sx={{
            minHeight: { xs: '36px' },
            fontSize: { xs: '0.813rem', sm: '0.875rem' },
          }}
        >
          {t('expenses.list.addExpense')}
        </Button>
      )}
    </Box>
  );
};

export default ExpenseHeader; 