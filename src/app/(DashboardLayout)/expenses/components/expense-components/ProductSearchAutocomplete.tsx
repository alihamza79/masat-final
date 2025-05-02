'use client';
import { Autocomplete, CircularProgress, InputAdornment, Paper, Stack, TextField, Typography } from '@mui/material';
import { IconSearch } from '@tabler/icons-react';
import React from 'react';
import ProductImage from './ProductImage';
import HighlightedText from './HighlightedText';

interface ProductSearchAutocompleteProps {
  selectedProduct: any | null;
  onProductSelect: (product: any | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredProducts: any[];
  productsLoading: boolean;
  error: string | undefined;
}

const ProductSearchAutocomplete = ({ 
  selectedProduct, 
  onProductSelect, 
  searchQuery, 
  setSearchQuery, 
  filteredProducts, 
  productsLoading, 
  error 
}: ProductSearchAutocompleteProps) => {
  return (
    <Autocomplete
      value={selectedProduct}
      onChange={(_, newValue) => onProductSelect(newValue)}
      getOptionLabel={(option) => option.name || ''}
      options={filteredProducts}
      filterOptions={(options) => options}
      loading={productsLoading}
      noOptionsText={searchQuery ? "No products found" : "Type to search"}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Search Product"
          onChange={(e) => setSearchQuery(e.target.value)}
          error={Boolean(error)}
          helperText={error || "Search by name, SKU or PNK"}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <>
                <InputAdornment position="start">
                  <IconSearch size={20} />
                </InputAdornment>
                {params.InputProps.startAdornment}
              </>
            ),
            endAdornment: (
              <>
                {productsLoading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
          fullWidth
        />
      )}
      renderOption={(props, option) => (
        <li {...props}>
          <Stack direction="row" spacing={1.5} width="100%" alignItems="center">
            {/* Small product image in dropdown */}
            <ProductImage product={option} size="small" />
            
            <Stack spacing={0.5} flex={1}>
              <Typography variant="body1" fontWeight={500}>
                <HighlightedText text={option.name} highlight={searchQuery} />
              </Typography>
              <Stack direction="row" spacing={1}>
                {option.part_number && (
                  <Typography variant="caption" color="text.secondary">
                    SKU: <HighlightedText text={option.part_number} highlight={searchQuery} />
                  </Typography>
                )}
                {option.part_number_key && (
                  <Typography variant="caption" color="text.secondary">
                    PNK: <HighlightedText text={option.part_number_key} highlight={searchQuery} />
                  </Typography>
                )}
              </Stack>
            </Stack>
          </Stack>
        </li>
      )}
      PaperComponent={(props) => (
        <Paper {...props} elevation={6} sx={{ mt: 0.5 }} />
      )}
    />
  );
};

export default ProductSearchAutocomplete; 