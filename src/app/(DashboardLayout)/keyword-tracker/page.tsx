'use client';
import { useState } from 'react';
import { 
  Grid, 
  Box, 
  Typography, 
  Button, 
  CircularProgress, 
  useTheme,
  TextField,
  InputAdornment
} from '@mui/material';
import PageContainer from '@/app/components/container/PageContainer';
import { IconPlus, IconSearch } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import useAuth from '@/lib/hooks/useAuth';
import KeywordTrackerTable from './components/KeywordTrackerTable';
import AddProductDialog from './components/AddProductDialog';
import EditKeywordsDialog from './components/EditKeywordsDialog';
import DeleteConfirmationDialog from '@/app/components/dialogs/DeleteConfirmationDialog';
import { useKeywordTracker, KeywordTrackedProduct } from '@/lib/hooks/useKeywordTracker';

const KeywordTrackerPage = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [openAddDialog, setOpenAddDialog] = useState<boolean>(false);
  const [openEditDialog, setOpenEditDialog] = useState<boolean>(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);
  const [selectedTrackedProduct, setSelectedTrackedProduct] = useState<KeywordTrackedProduct | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const {
    trackedProducts,
    isLoading,
    createTrackedProduct,
    updateTrackedProduct,
    deleteTrackedProduct,
    isCreating,
    isUpdating,
    isDeleting,
  } = useKeywordTracker();

  const { isAuthenticated, loading } = useAuth();

  // Filter tracked products based on search term
  const filteredTrackedProducts = trackedProducts.filter((product: KeywordTrackedProduct) => 
    product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.productSKU?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.productPNK?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.keywords.some((keyword: string) => keyword.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleOpenAddDialog = () => {
    setOpenAddDialog(true);
  };

  const handleCloseAddDialog = () => {
    // Only close if not currently submitting
    if (!isCreating) {
      setOpenAddDialog(false);
    }
  };

  const handleOpenEditDialog = (trackedProduct: KeywordTrackedProduct) => {
    setSelectedTrackedProduct(trackedProduct);
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    // Only close if not currently submitting
    if (!isUpdating) {
      setOpenEditDialog(false);
      setSelectedTrackedProduct(null);
    }
  };

  const handleOpenDeleteDialog = (trackedProduct: KeywordTrackedProduct) => {
    setSelectedTrackedProduct(trackedProduct);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setSelectedTrackedProduct(null);
  };

  const handleAddProduct = async (productData: any) => {
    try {
      await createTrackedProduct(productData);
      // Close dialog after successful creation
      setTimeout(() => {
        setOpenAddDialog(false);
      }, 500);
    } catch (error) {
      // Error handling is done by the hook's onError callback
      console.error('Error adding product:', error);
    }
  };

  const handleUpdateKeywords = async (keywords: string[]) => {
    if (!selectedTrackedProduct?._id) return;
    
    try {
      await updateTrackedProduct({
        ...selectedTrackedProduct,
        keywords
      });
      // Close dialog after successful update
      setTimeout(() => {
        setOpenEditDialog(false);
        setSelectedTrackedProduct(null);
      }, 500);
    } catch (error) {
      // Error handling is done by the hook's onError callback
      console.error('Error updating keywords:', error);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedTrackedProduct?._id) return;
    
    try {
      await deleteTrackedProduct(selectedTrackedProduct._id);
      setOpenDeleteDialog(false);
      setSelectedTrackedProduct(null);
    } catch (error) {
      // Error handling is done by the hook's onError callback
      console.error('Error deleting tracked product:', error);
    }
  };

  if (loading) {
    return (
      <PageContainer title={t('keywordTracker.pageTitle')} description={t('keywordTracker.pageDescription')}>
        <Box sx={{ bgcolor: 'background.paper', p: 3, borderRadius: 1, boxShadow: 1 }} display="flex" justifyContent="center">
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title={t('keywordTracker.pageTitle')} description={t('keywordTracker.pageDescription')}>
      <Box>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box 
              display="flex" 
              alignItems="center" 
              justifyContent="space-between" 
              mb={3}
              flexDirection={{ xs: 'column', sm: 'row' }}
              gap={2}
            >
              <Typography 
                variant="h2" 
                sx={{ 
                  fontSize: { xs: '1.5rem', md: 'h2.fontSize' },
                  textAlign: { xs: 'center', sm: 'left' },
                  width: '100%'
                }}
              >
                {t('keywordTracker.pageTitle')}
              </Typography>
              <Box 
                display="flex" 
                gap={{ xs: 1, sm: 2 }}
                flexDirection={{ xs: 'column', sm: 'row' }}
                width="100%"
                justifyContent={{ xs: 'stretch', sm: 'flex-end' }}
                alignItems={{ xs: 'stretch', sm: 'center' }}
              >
                <TextField
                  size="small"
                  placeholder={t('keywordTracker.search.placeholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconSearch size={20} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    minWidth: { xs: '100%', sm: '300px' },
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: theme.palette.background.paper,
                    }
                  }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<IconPlus size={20} />}
                  onClick={handleOpenAddDialog}
                  disabled={isCreating}
                  size="small"
                  sx={{
                    minHeight: { xs: '36px' },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    px: { xs: 1.5, sm: 2 },
                    '& .MuiButton-startIcon': {
                      mr: { xs: 0.5, sm: 1 },
                      '& svg': {
                        fontSize: { xs: 18, sm: 20 }
                      }
                    }
                  }}
                >
                  {t('keywordTracker.addButton')}
                </Button>
              </Box>
            </Box>
            
            <KeywordTrackerTable 
              trackedProducts={filteredTrackedProducts}
              isLoading={isLoading}
              onEditKeywords={handleOpenEditDialog}
              onDeleteTrackedProduct={handleOpenDeleteDialog}
              isDeleting={isDeleting}
            />
          </Grid>
        </Grid>
      </Box>

      <AddProductDialog
        open={openAddDialog}
        onClose={handleCloseAddDialog}
        onSubmit={handleAddProduct}
        isSubmitting={isCreating}
      />

      <EditKeywordsDialog
        open={openEditDialog}
        onClose={handleCloseEditDialog}
        trackedProduct={selectedTrackedProduct}
        onSubmit={handleUpdateKeywords}
        isSubmitting={isUpdating}
      />

      <DeleteConfirmationDialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
        integrationName={selectedTrackedProduct ? selectedTrackedProduct.productName : ''}
        title={t('keywordTracker.delete.title')}
        message={t('keywordTracker.delete.confirmation', { name: selectedTrackedProduct?.productName || '' })}
      />
    </PageContainer>
  );
};

export default KeywordTrackerPage; 