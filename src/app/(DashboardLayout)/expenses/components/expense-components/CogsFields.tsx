'use client';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { IconCalendar } from '@tabler/icons-react';
import { InputAdornment, Stack, TextField } from '@mui/material';
import React from 'react';
import ProductSearchAutocomplete from './ProductSearchAutocomplete';
import SelectedProductView from './SelectedProductView';
import { useTranslation } from 'react-i18next';

interface CogsFieldsProps {
  date: Date | null;
  setDate: (date: Date | null) => void;
  selectedProduct: any | null;
  handleProductSelect: (product: any | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredProducts: any[];
  productsLoading: boolean;
  unitsCount: string;
  setUnitsCount: (count: string) => void;
  costPerUnit: string;
  setCostPerUnit: (cost: string) => void;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

const CogsFields = ({
  date,
  setDate,
  selectedProduct,
  handleProductSelect,
  searchQuery,
  setSearchQuery,
  filteredProducts,
  productsLoading,
  unitsCount,
  setUnitsCount,
  costPerUnit,
  setCostPerUnit,
  errors,
  setErrors
}: CogsFieldsProps) => {
  const { t } = useTranslation();

  return (
    <Stack spacing={3} sx={{ mt: 0 }}>
      {/* Fields without container */}
      <Stack spacing={3}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label={t('expenses.dialog.purchaseDate')}
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
        
        <ProductSearchAutocomplete
          selectedProduct={selectedProduct}
          onProductSelect={handleProductSelect}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filteredProducts={filteredProducts}
          productsLoading={productsLoading}
          error={errors.product}
        />
      </Stack>

      {selectedProduct && (
        <SelectedProductView
          product={selectedProduct}
          unitsCount={unitsCount}
          setUnitsCount={setUnitsCount}
          costPerUnit={costPerUnit}
          setCostPerUnit={setCostPerUnit}
          errors={errors}
          setErrors={setErrors}
        />
      )}
    </Stack>
  );
};

export default CogsFields; 