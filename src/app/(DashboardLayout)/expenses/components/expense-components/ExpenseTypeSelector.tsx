'use client';
import { Box, Grid, Paper, Stack, Typography } from '@mui/material';
import { IconCalendar, IconPackage } from '@tabler/icons-react';
import React from 'react';
import { ExpenseType } from '@/lib/hooks/useExpenses';
import { useTranslation } from 'react-i18next';

interface ExpenseTypeSelectorProps {
  type: ExpenseType;
  setType: (type: ExpenseType) => void;
  mode?: 'add' | 'edit';
}

const ExpenseTypeSelector = ({ type, setType, mode }: ExpenseTypeSelectorProps) => {
  const { t } = useTranslation();
  
  return (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {t('expenses.dialog.type.label')} {mode === 'edit' && t('expenses.dialog.cannotBeChanged')}
      </Typography>
      <Grid container spacing={1.5}>
        {[
          { value: 'one-time', label: t('expenses.dialog.type.oneTime'), icon: <IconCalendar size={18} /> },
          { value: 'monthly', label: t('expenses.dialog.type.monthly'), icon: <IconCalendar size={18} /> },
          { value: 'annually', label: t('expenses.dialog.type.annually'), icon: <IconCalendar size={18} /> },
          { value: 'cogs', label: t('expenses.dialog.type.cogs'), icon: <IconPackage size={18} /> },
        ].map((option) => (
          <Grid item xs={6} sm={3} key={option.value}>
            <Paper
              onClick={() => !mode || mode !== 'edit' ? setType(option.value as ExpenseType) : null}
              sx={{
                p: 1.5,
                textAlign: 'center',
                cursor: mode === 'edit' ? 'default' : 'pointer',
                border: '1px solid',
                borderColor: type === option.value 
                  ? 'primary.main' 
                  : 'divider',
                bgcolor: type === option.value 
                  ? 'primary.lighter'
                  : 'background.paper',
                color: type === option.value 
                  ? 'primary.main' 
                  : 'text.primary',
                opacity: mode === 'edit' ? 0.7 : 1,
                transition: 'all 0.2s',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                '&:hover': {
                  borderColor: mode === 'edit' ? undefined : (type === option.value ? 'primary.main' : 'grey.400'),
                  boxShadow: mode === 'edit' ? undefined : '0 2px 8px rgba(0,0,0,0.08)',
                }
              }}
            >
              <Stack spacing={1} alignItems="center">
                {option.icon}
                <Typography variant="body2" fontWeight={type === option.value ? 600 : 400}>
                  {option.label}
                </Typography>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ExpenseTypeSelector; 