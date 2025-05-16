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
    const imageUrl = getImageUrl(option);
    
    // Helper function to highlight matching text
    const highlightMatch = (text: string, query: string) => {
      if (!text || !query.trim()) return <span>{text || ''}</span>;
      
      const parts = text.split(new RegExp(`(${query})`, 'gi'));
      return (
        <>
          {parts.map((part, i) => (
            <span 
              key={i} 
              style={{
                fontWeight: part.toLowerCase() === query.toLowerCase() ? 700 : 400,
                color: part.toLowerCase() === query.toLowerCase() ? theme.palette.primary.main : 'inherit'
              }}
            >
              {part}
            </span>
          ))}
        </>
      );
    };
    
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
              {highlightMatch(option.name, inputValue)}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              <span style={{ display: 'inline-block', minWidth: '100px' }}>
                {t('expenses.dialog.sku')}: {highlightMatch(option.part_number || '-', inputValue)}
              </span>
              |
              <span style={{ display: 'inline-block', marginLeft: '8px' }}>
                {t('expenses.dialog.pnk')}: {highlightMatch(option.part_number_key || '-', inputValue)}
              </span>
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
      filterOptions={(x) => x}
      getOptionLabel={(option) => {
        if (typeof option === 'string') return option;
        
        // Create a more descriptive label including SKU and PNK when available
        let label = option.name || '';
        
        // Only add identifiers to label if we're searching
        if (searchQuery.trim() && (option.part_number || option.part_number_key)) {
          if (option.part_number) label += ` [${option.part_number}]`;
          if (option.part_number_key) label += ` (${option.part_number_key})`;
        }
        
        return label;
      }}
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