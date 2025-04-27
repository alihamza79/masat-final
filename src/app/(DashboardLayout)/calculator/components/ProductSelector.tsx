import React, { useState, useEffect } from 'react';
import { Button, Stack, Typography } from '@mui/material';
import { IconPackage, IconChevronRight } from '@tabler/icons-react';
import ProductSelectionModal from './ProductSelectionModal';
import { SavedCalculation } from '../hooks/useSavedCalculations';
import useProducts from '@/lib/hooks/useProducts';

interface ProductSelectorProps {
  selectedProduct: string;
  onSelectProduct: (value: string) => void;
  getProductNameByValue: (value: string) => string | undefined;
  savedCalculations: SavedCalculation[];
  loadingSavedCalculations: boolean;
  savedCalculationsError: string | null;
}

const ProductSelector: React.FC<ProductSelectorProps> = ({
  selectedProduct,
  onSelectProduct,
  getProductNameByValue,
  savedCalculations,
  loadingSavedCalculations,
  savedCalculationsError
}) => {
  const [openProductModal, setOpenProductModal] = useState(false);
  const { products, isLoading: productsLoading, hasProducts, error: productsError } = useProducts();
  const [processedProducts, setProcessedProducts] = useState<any[]>([]);

  // Process and validate products when they change
  useEffect(() => {
    console.log('ProductSelector received products:', products);
    console.log('Products array length:', products?.length || 0);
    
    // Make sure we have valid products
    if (Array.isArray(products) && products.length > 0) {
      // Filter out any invalid products
      const validProducts = products.filter(product => 
        product && (product.emagProductOfferId || product._id)
      );
      console.log(`ProductSelector filtered ${validProducts.length} valid products from ${products.length} total`);
      setProcessedProducts(validProducts);
    } else {
      console.log('No valid products available');
      setProcessedProducts([]);
    }
  }, [products]);

  // Custom handler that calls the provided onSelectProduct and closes the modal
  const handleProductSelect = (value: string) => {
    console.log('Selected product value:', value);
    onSelectProduct(value);
    setOpenProductModal(false);
  };

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
        sx={{ 
          minWidth: { xs: '100%', sm: '320px', md: '380px' },
          maxWidth: { xs: '100%', sm: '400px', md: '450px' },
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
          <IconPackage size={18} />
          <Typography 
            sx={{ 
              fontSize: '13px',
              maxWidth: { xs: 'calc(100vw - 120px)', sm: '280px', md: '340px' },
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {selectedProduct ? 
              // Check if it's a saved calculation
              selectedProduct.startsWith('saved-') ? 
                'Saved Calculation' : 
                // Get product name using the helper function
                getProductNameByValue(selectedProduct) || 
                'Select Product' : 
              'Select Product'}
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
        error={savedCalculationsError || (productsError ? String(productsError) : null)}
        products={processedProducts}
      />
    </Stack>
  );
};

export default ProductSelector; 