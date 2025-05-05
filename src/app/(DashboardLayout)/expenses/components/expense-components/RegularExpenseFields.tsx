'use client';
import { FormControlLabel, InputAdornment, Paper, Stack, Switch, TextField, Typography } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { IconCalendar } from '@tabler/icons-react';
import React from 'react';
import { ExpenseType } from '@/lib/hooks/useExpenses';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

interface RegularExpenseFieldsProps {
  type: ExpenseType;
  description: string;
  setDescription: (value: string) => void;
  amount: string;
  setAmount: (value: string) => void;
  date: Date | null;
  setDate: (date: Date | null) => void;
  isRecurring: boolean;
  setIsRecurring: (value: boolean) => void;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

const RegularExpenseFields = ({
  type,
  description,
  setDescription,
  amount,
  setAmount,
  date,
  setDate,
  isRecurring,
  setIsRecurring,
  errors,
  setErrors
}: RegularExpenseFieldsProps) => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Stack spacing={3}>
      {type !== 'cogs' && (
        <TextField
          label={t('expenses.dialog.description')}
          value={description}
          onChange={(e) => {
            const value = e.target.value;
            setDescription(value);
            if (errors.description) {
              const newErrors = { ...errors };
              delete newErrors.description;
              setErrors(newErrors);
            }
          }}
          fullWidth
          required
          error={Boolean(errors.description)}
          helperText={errors.description}
          InputProps={{
            sx: { 
              '& input': { 
                padding: '14px 14px'
              } 
            }
          }}
          sx={{ 
            '& .MuiOutlinedInput-root': {
              borderRadius: 1,
              '&:hover fieldset': {
                borderColor: theme.palette.primary.main,
              }
            }
          }}
        />
      )}

      {/* Date and Amount in a row for better space usage */}
      {type !== 'cogs' && (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            label={t('expenses.dialog.amount')}
            type="number"
            value={amount}
            onChange={(e) => {
              const value = e.target.value;
              setAmount(value);
              if (errors.amount) {
                const newErrors = { ...errors };
                delete newErrors.amount;
                setErrors(newErrors);
              }
            }}
            fullWidth
            required
            error={Boolean(errors.amount)}
            helperText={errors.amount}
            InputProps={{
              endAdornment: <InputAdornment position="end">RON</InputAdornment>,
              inputProps: { min: 0 },
            }}
          />
          
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label={t('expenses.dialog.date')}
              value={date}
              onChange={(newDate) => {
                if (newDate) {
                  const dt = newDate as Date;
                  setDate(dt);
                  if (errors.date) {
                    const newErrors = { ...errors };
                    delete newErrors.date;
                    setErrors(newErrors);
                  }
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  required
                  error={Boolean(errors.date)}
                  helperText={errors.date}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconCalendar size={20} />
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />
          </LocalizationProvider>
        </Stack>
      )}

      {/* Recurring expenses option - made more visual */}
      {(type === 'monthly' || type === 'annually') && (
        <Paper sx={{ p: 1.5, border: '1px solid', borderColor: 'divider' }}>
          <FormControlLabel
            control={
              <Switch
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                color="success"
              />
            }
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography>
                  {t('expenses.dialog.recurring', { type: type === 'monthly' ? t('expenses.dialog.monthly') : t('expenses.dialog.annually') })}
                </Typography>
              </Stack>
            }
          />
        </Paper>
      )}
    </Stack>
  );
};

export default RegularExpenseFields; 