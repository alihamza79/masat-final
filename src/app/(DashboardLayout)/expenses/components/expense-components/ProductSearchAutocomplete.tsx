'use client';
import React from 'react';
import {
  Autocomplete,
  CircularProgress,
  InputAdornment,
  TextField,
  Typography,
  Box,
  Avatar
} from '@mui/material';
import { 
  IconSearch,
  IconPackage
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';

interface ProductSearchAutocompleteProps {
  selectedProduct: any | null;
  onProductSelect: (product: any | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredProducts: any[];
  productsLoading: boolean;
  error?: string;
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
  const { t } = useTranslation();
  const theme = useTheme();

  // Function to get image URL from product object
  const getImageUrl = (product: any) => {
    // Direct image property
    if (product.image) {
      return product.image;
    }
    
    // Array of images
    if (product.images && product.images.length > 0 && product.images[0].url) {
      return product.images[0].url;
    }
    
    // API mainImage property
    if (product.mainImage) {
      return product.mainImage;
    }
    
    // No image found
    return null;
  };

  const renderOption = (props: any, option: any, { inputValue }: { inputValue: string }) => {
    const parts = option.name.split(new RegExp(`(${inputValue})`, 'gi'));
    const imageUrl = getImageUrl(option);
    
    return (
      <li {...props}>
        <Box display="flex" alignItems="center" gap={1}>
          {imageUrl ? (
            <Avatar 
              src={imageUrl} 
              alt={option.name} 
              sx={{ 
                width: 40, 
                height: 40, 
                borderRadius: 1,
                '& img': { objectFit: 'cover' }
              }}
            />
          ) : (
            <Avatar 
              sx={{ 
                width: 40, 
                height: 40, 
                borderRadius: 1,
                bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: theme.palette.text.secondary
              }}
            >
              <IconPackage size={20} />
            </Avatar>
          )}
          <Box>
            <Typography>
              {parts.map((part: string, index: number) => (
                <span
                  key={index}
                  style={{
                    fontWeight: part.toLowerCase() === inputValue.toLowerCase() ? 700 : 400,
                  }}
                >
                  {part}
                </span>
              ))}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {t('expenses.dialog.sku')}: {option.part_number} | {t('expenses.dialog.pnk')}: {option.part_number_key}
            </Typography>
          </Box>
        </Box>
      </li>
    );
  };

  return (
    <Autocomplete
      id="product-search-autocomplete"
      options={filteredProducts}
      getOptionLabel={(option) => option.name}
      noOptionsText={
        searchQuery.length > 0 ? t('expenses.dialog.noProductsFound') : t('expenses.dialog.typeToSearch')
      }
      onChange={(_, newValue) => onProductSelect(newValue)}
      value={selectedProduct}
      renderOption={renderOption}
      loading={productsLoading}
      renderInput={(params) => (
        <TextField
          {...params}
          label={t('expenses.dialog.searchProduct')}
          fullWidth
          required
          variant="outlined"
          error={Boolean(error)}
          helperText={error || t('expenses.dialog.searchBy')}
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
              borderRadius: '8px',
              '&:hover fieldset': {
                borderColor: theme.palette.primary.main,
              },
              '& input': {
                pl: 2,
                py: 1.5
              }
            }
          }}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <InputAdornment position="start">
                <IconSearch size={20} />
              </InputAdornment>
            ),
            endAdornment: (
              <>
                {productsLoading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
};

export default ProductSearchAutocomplete; 