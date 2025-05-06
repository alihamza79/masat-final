'use client';
import { Alert, Button, Card, CardContent } from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';

interface ExpenseErrorDisplayProps {
  error: Error | unknown;
}

const ExpenseErrorDisplay = ({ error }: ExpenseErrorDisplayProps) => {
  const { t } = useTranslation();
  
  return (
    <Card>
      <CardContent>
        <Alert severity="error" sx={{ mb: 3 }}>
          {t('expenses.list.error.loading')} {error instanceof Error ? error.message : t('expenses.list.error.unknown')}
        </Alert>
        <Button variant="outlined" onClick={() => window.location.reload()}>
          {t('expenses.list.error.reload')}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ExpenseErrorDisplay; 