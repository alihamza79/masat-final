import React, { useState } from 'react';
import { Button, Stack, Typography, Tooltip, CircularProgress } from '@mui/material';
import { IconPackage, IconChevronRight, IconRefresh } from '@tabler/icons-react';
import ProductSelectionModal from '../ProductSelectionModal';
import { SavedCalculation } from '../../hooks/useSavedCalculations';
import useProducts from '@/lib/hooks/useProducts';

interface ProductSelectorProps {
  selectedProduct: string;
  onSelectProduct: (value: string) => void;
  getProductNameByValue: (value: string, savedCalculations: SavedCalculation[]) => string | undefined;
  savedCalculations: SavedCalculation[];
  loadingSavedCalculations: boolean;
  savedCalculationsError: string | null;
  integrationsData?: Record<string, any>;
  products?: any[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

const ProductSelector: React.FC<ProductSelectorProps> = ({
  selectedProduct,
  onSelectProduct,
  getProductNameByValue,
  savedCalculations,
  loadingSavedCalculations,
  savedCalculationsError,
  integrationsData,
  products,
  onRefresh
}) => {
  const [openProductModal, setOpenProductModal] = useState(false);
  const { isLoading: productsLoading, error: productsError, refetch } = useProducts();
  const [refreshing, setRefreshing] = useState(false);

  // Log when products change to help debug
  React.useEffect(() => {
    console.log('ProductSelector - products updated, length:', products?.length || 0);
    if (Array.isArray(products) && products.length > 0) {
      console.log('ProductSelector - first product:', products[0]);
    }
  }, [products]);

  // Custom handler that calls the provided onSelectProduct and closes the modal
  const handleProductSelect = (value: string) => {
    onSelectProduct(value);
    setOpenProductModal(false);
  };

  // Handler to refresh products
  const handleRefreshProducts = async () => {
    try {
      setRefreshing(true);
      console.log('Manually refreshing products...');
      
      // Use provided onRefresh if available
      if (onRefresh) {
        await onRefresh();
      } else {
        // Otherwise use react-query refetch
        await refetch();
        
        // Also do a direct API call to ensure we get fresh data
        const response = await fetch('/api/db/product-offers', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });
        
        const data = await response.json();
        if (data.success) {
          console.log(`Direct API call returned ${data.data.productOffers.length} products`);
        }
      }
    } catch (error) {
      console.error('Error refreshing products:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const isLoading = productsLoading || refreshing;

  // Memoize the product name calculation to reduce re-renders
  const productDisplayName = React.useMemo(() => {
    if (isLoading) {
      return 'Loading products...';
    }
    
    if (!selectedProduct) {
      return 'Select Product';
    }
    
    if (selectedProduct.startsWith('saved-')) {
      const name = getProductNameByValue(selectedProduct, savedCalculations);
      return name || 'Saved Calculation';
    } 
    
    if (selectedProduct.startsWith('emag-')) {
      const name = getProductNameByValue(selectedProduct, savedCalculations);
      
      // If no name was found, try to extract a simple product ID
      if (!name && selectedProduct.split('-').length > 2) {
        const productId = selectedProduct.split('-')[2];
        return `eMAG Product ${productId}`;
      }
      
      return name || 'eMAG Product';
    }
    
    return getProductNameByValue(selectedProduct, savedCalculations) || 'Select Product';
  }, [selectedProduct, savedCalculations, isLoading, getProductNameByValue]);

  return (
    <Stack 
      direction={{ xs: 'column', sm: 'row' }} 
      spacing={{ xs: 1.5, sm: 2 }} 
      alignItems={{ xs: 'stretch', sm: 'center' }}
      width={{ xs: '100%', sm: 'auto' }}
    >
      <Button
        variant="outlined"
        onClick={() => setOpenProductModal(true)}
        disabled={isLoading}
        sx={{ 
          minWidth: { xs: '100%', sm: '320px', md: '400px' },
          maxWidth: { xs: '100%', sm: '450px', md: '520px' },
          height: { xs: '40px', sm: '35px' },
          justifyContent: 'space-between',
          px: { xs: 1.5, sm: 2 },
          py: 1,
          color: 'text.primary',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'transparent',
            color: 'text.primary'
          }
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          {isLoading ? (
            <CircularProgress size={18} />
          ) : (
            <IconPackage size={18} />
          )}
          <Typography 
            sx={{ 
              fontSize: '13px',
              maxWidth: { xs: 'calc(100vw - 120px)', sm: '240px', md: '300px' },
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {productDisplayName}
          </Typography>
        </Stack>
        <IconChevronRight size={18} />
      </Button>

      <ProductSelectionModal 
        open={openProductModal}
        onClose={() => setOpenProductModal(false)}
        selectedProduct={selectedProduct}
        onSelectProduct={handleProductSelect}
        savedCalculations={savedCalculations}
        loading={loadingSavedCalculations || productsLoading}
        error={savedCalculationsError ? savedCalculationsError : null}
        integrationsData={integrationsData}
        products={products || []}
      />
    </Stack>
  );
};

export default ProductSelector; 