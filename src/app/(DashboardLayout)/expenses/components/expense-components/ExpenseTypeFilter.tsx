'use client';
import { 
  FormControl, 
  InputLabel, 
  MenuItem, 
  Select, 
  SelectChangeEvent, 
  Stack, 
  ToggleButton, 
  ToggleButtonGroup 
} from '@mui/material';
import React from 'react';
import { ExpenseType } from '@/lib/hooks/useExpenses';
import { useTranslation } from 'react-i18next';

interface ExpenseTypeFilterProps {
  isMobile: boolean;
  selectedType: ExpenseType | 'all';
  onTypeChange: (event: React.MouseEvent<HTMLElement>, newType: ExpenseType | 'all') => void;
  onTypeSelectChange: (event: SelectChangeEvent<ExpenseType | 'all'>) => void;
}

const ExpenseTypeFilter = ({ 
  isMobile, 
  selectedType, 
  onTypeChange, 
  onTypeSelectChange 
}: ExpenseTypeFilterProps) => {
  const { t } = useTranslation();
  
  return isMobile ? (
    <FormControl fullWidth sx={{ mb: 3 }}>
      <InputLabel id="expense-type-select-label">{t('expenses.list.filterByType')}</InputLabel>
      <Select
        labelId="expense-type-select-label"
        id="expense-type-select"
        value={selectedType}
        label={t('expenses.list.filterByType')}
        onChange={onTypeSelectChange}
        size="small"
      >
        <MenuItem value="all">{t('expenses.list.all')}</MenuItem>
        <MenuItem value="one-time">{t('expenses.list.oneTime')}</MenuItem>
        <MenuItem value="monthly">{t('expenses.list.monthly')}</MenuItem>
        <MenuItem value="annually">{t('expenses.list.annually')}</MenuItem>
        <MenuItem value="cogs">{t('expenses.list.cogs')}</MenuItem>
      </Select>
    </FormControl>
  ) : (
    <Stack direction="row" spacing={2} sx={{ mb: 3, overflowX: 'auto' }}>
      <ToggleButtonGroup
        value={selectedType}
        exclusive
        onChange={onTypeChange}
        aria-label="expense type filter"
        size={isMobile ? "small" : "medium"}
      >
        <ToggleButton value="all">{t('expenses.list.all')}</ToggleButton>
        <ToggleButton value="one-time">{t('expenses.list.oneTime')}</ToggleButton>
        <ToggleButton value="monthly">{t('expenses.list.monthly')}</ToggleButton>
        <ToggleButton value="annually">{t('expenses.list.annually')}</ToggleButton>
        <ToggleButton value="cogs">{t('expenses.list.cogs')}</ToggleButton>
      </ToggleButtonGroup>
    </Stack>
  );
};

export default ExpenseTypeFilter; 