'use client';
import { Box, InputAdornment, Paper, Stack, TextField, Typography } from '@mui/material';
import React from 'react';
import ProductImage from './ProductImage';
import { useTranslation } from 'react-i18next';

interface SelectedProductViewProps {
  product: any;
  unitsCount: string;
  setUnitsCount: (value: string) => void;
  costPerUnit: string;
  setCostPerUnit: (value: string) => void;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

const SelectedProductView = ({ 
  product, 
  unitsCount, 
  setUnitsCount, 
  costPerUnit, 
  setCostPerUnit, 
  errors, 
  setErrors 
}: SelectedProductViewProps) => {
  const { t } = useTranslation();

  return (
    <Paper 
      variant="outlined"
      sx={{ 
        p: 2, 
        borderRadius: 1,
        borderColor: 'divider',
        bgcolor: theme => theme.palette.mode === 'dark' ? 'grey.800' : 'background.paper',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}
    >
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
          {/* Product Image Container - Fixed width container for large size */}
          <Box sx={{ 
            width: { xs: '100%', sm: 100 },
            maxWidth: { xs: '100%', sm: 100 },
            alignSelf: { xs: 'center', sm: 'flex-start' }
          }}>
            <ProductImage product={product} size="large" />
          </Box>
          
          {/* Product Details */}
          <Stack spacing={1} width="100%">
            <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
              <Typography variant="subtitle1" fontWeight={600}>
                {product.name}
              </Typography>
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              {product.part_number && (
                <Typography variant="body2">
                  <strong>{t('expenses.dialog.sku')}:</strong> {product.part_number}
                </Typography>
              )}
              {product.part_number_key && (
                <Typography variant="body2">
                  <strong>{t('expenses.dialog.pnk')}:</strong> {product.part_number_key}
                </Typography>
              )}
            </Stack>
            
            {/* Quantity and Cost fields within the product details */}
            <Box sx={{ 
              mt: 2,
              p: 1.5, 
              bgcolor: theme => theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
              borderRadius: 1
            }}>
              <Typography variant="subtitle2" gutterBottom>
                {t('expenses.dialog.purchaseDetails')}
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label={t('expenses.dialog.numberOfUnits')}
                  type="number"
                  value={unitsCount}
                  onChange={(e) => {
                    const value = e.target.value;
                    setUnitsCount(value);
                    if (errors.unitsCount) {
                      const newErrors = { ...errors };
                      delete newErrors.unitsCount;
                      setErrors(newErrors);
                    }
                  }}
                  fullWidth
                  size="small"
                  error={Boolean(errors.unitsCount)}
                  helperText={errors.unitsCount}
                  InputProps={{
                    inputProps: { min: 0 },
                  }}
                  InputLabelProps={{
                    sx: { 
                      mt: 0.2,
                      ml: 1,
                      "&.MuiInputLabel-shrink": {
                        ml: 0
                      }
                    }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderRadius: '8px',
                      },
                      '& input': {
                        pl: 2,
                        py: 1.5
                      }
                    }
                  }}
                />
                <TextField
                  label={t('expenses.dialog.costPerUnit')}
                  type="number"
                  value={costPerUnit}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCostPerUnit(value);
                    if (errors.costPerUnit) {
                      const newErrors = { ...errors };
                      delete newErrors.costPerUnit;
                      setErrors(newErrors);
                    }
                  }}
                  fullWidth
                  size="small"
                  error={Boolean(errors.costPerUnit)}
                  helperText={errors.costPerUnit}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">RON</InputAdornment>,
                    inputProps: { min: 0 },
                  }}
                  InputLabelProps={{
                    sx: { 
                      mt: 0.2,
                      ml: 1,
                      "&.MuiInputLabel-shrink": {
                        ml: 0
                      }
                    }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderRadius: '8px',
                      },
                      '& input': {
                        pl: 2,
                        py: 1.5
                      }
                    }
                  }}
                />
              </Stack>
              {Number(unitsCount) > 0 && Number(costPerUnit) > 0 && (
                <Box sx={{ mt: 2, textAlign: 'right' }}>
                  <Typography variant="subtitle2">
                    {t('expenses.dialog.total')}: <strong>{(Number(unitsCount) * Number(costPerUnit)).toLocaleString()} RON</strong>
                  </Typography>
                </Box>
              )}
            </Box>
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
};

export default SelectedProductView; 