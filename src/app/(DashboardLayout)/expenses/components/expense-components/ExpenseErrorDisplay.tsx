'use client';
import { Alert, Button, Card, CardContent } from '@mui/material';
import React from 'react';

interface ExpenseErrorDisplayProps {
  error: Error | unknown;
}

const ExpenseErrorDisplay = ({ error }: ExpenseErrorDisplayProps) => {
  return (
    <Card>
      <CardContent>
        <Alert severity="error" sx={{ mb: 3 }}>
          Error loading expenses: {error instanceof Error ? error.message : 'Unknown error'}
        </Alert>
        <Button variant="outlined" onClick={() => window.location.reload()}>
          Reload Page
        </Button>
      </CardContent>
    </Card>
  );
};

export default ExpenseErrorDisplay; 