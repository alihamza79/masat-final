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
  return isMobile ? (
    <FormControl fullWidth sx={{ mb: 3 }}>
      <InputLabel id="expense-type-select-label">Filter by Type</InputLabel>
      <Select
        labelId="expense-type-select-label"
        id="expense-type-select"
        value={selectedType}
        label="Filter by Type"
        onChange={onTypeSelectChange}
        size="small"
      >
        <MenuItem value="all">All</MenuItem>
        <MenuItem value="one-time">One Time</MenuItem>
        <MenuItem value="monthly">Monthly</MenuItem>
        <MenuItem value="annually">Annually</MenuItem>
        <MenuItem value="cogs">COGS</MenuItem>
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
        <ToggleButton value="all">All</ToggleButton>
        <ToggleButton value="one-time">One Time</ToggleButton>
        <ToggleButton value="monthly">Monthly</ToggleButton>
        <ToggleButton value="annually">Annually</ToggleButton>
        <ToggleButton value="cogs">COGS</ToggleButton>
      </ToggleButtonGroup>
    </Stack>
  );
};

export default ExpenseTypeFilter; 