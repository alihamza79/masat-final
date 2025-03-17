import React, { useState } from 'react';
import { Button, Stack, Typography } from '@mui/material';
import { IconPackage, IconChevronRight } from '@tabler/icons-react';
import ProductSelectionModal from './ProductSelectionModal';
import { SavedCalculation } from '../hooks/useSavedCalculations';

interface ProductSelectorProps {
  selectedProduct: string;
  onSelectProduct: (value: string) => void;
  getProductNameByValue: (value: string) => string | undefined;
  savedCalculations: SavedCalculation[];
  loadingSavedCalculations: boolean;
  savedCalculationsError: string | null;
  integrationsData?: Record<string, any>;
}

const ProductSelector: React.FC<ProductSelectorProps> = ({
  selectedProduct,
  onSelectProduct,
  getProductNameByValue,
  savedCalculations,
  loadingSavedCalculations,
  savedCalculationsError,
  integrationsData
}) => {
  const [openProductModal, setOpenProductModal] = useState(false);

  // Custom handler that calls the provided onSelectProduct and closes the modal
  const handleProductSelect = (value: string) => {
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
        loading={loadingSavedCalculations}
        error={savedCalculationsError}
        integrationsData={integrationsData}
      />
    </Stack>
  );
};

export default ProductSelector; 