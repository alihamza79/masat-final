'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { Grid, Box, Typography, Button, CircularProgress, TextField, InputAdornment } from '@mui/material';
import PageContainer from '@/app/components/container/PageContainer';
import { IconPlus, IconSearch } from '@tabler/icons-react';
import Toast from '@/app/components/common/Toast';
import { useTranslation } from 'react-i18next';
import useAuth from '@/lib/hooks/useAuth';
import FeaturesTable from './components/FeaturesTable';
import FeatureFormDialog from './components/FeatureFormDialog';
import FeatureDetailDialog from './components/FeatureDetailDialog';
import { useFeatures, Feature, FeatureStatus } from '@/lib/hooks/useFeatures';

// Define FeatureFormData interface
export interface FeatureFormData {
  subject: string;
  body: string;
  status: FeatureStatus;
}

const DevelopmentRequestsPage = () => {
  const { t } = useTranslation();
  const [openFormDialog, setOpenFormDialog] = useState<boolean>(false);
  const [openDetailDialog, setOpenDetailDialog] = useState<boolean>(false);
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'info' as 'success' | 'error' | 'info' | 'warning'
  });

  const {
    features,
    isLoading,
    createFeature,
    updateFeature,
    deleteFeature,
    isCreating,
    isUpdating,
    isDeleting,
  } = useFeatures();

  // Filter features based on search query
  const filteredFeatures = features.filter((feature: Feature) => 
    feature.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
    feature.body.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isSubmitting = isCreating || isUpdating;
  const { isAuthenticated, loading } = useAuth();

  const handleOpenFormDialog = (feature?: Feature) => {
    setSelectedFeature(feature || null);
    setOpenFormDialog(true);
  };

  const handleOpenDetailDialog = (feature: Feature) => {
    setSelectedFeature(feature);
    setOpenDetailDialog(true);
  };

  const handleCloseFormDialog = () => {
    // Only close if not currently submitting
    if (!isSubmitting) {
      setOpenFormDialog(false);
      setSelectedFeature(null);
    }
  };

  const handleCloseDetailDialog = () => {
    setOpenDetailDialog(false);
    setSelectedFeature(null);
  };

  const handleCloseToast = () => {
    setToast({ ...toast, open: false });
  };

  const showToast = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setToast({
      open: true,
      message,
      severity
    });
  };

  const handleSubmitFeature = async (data: FeatureFormData): Promise<void> => {
    try {
      if (selectedFeature?._id) {
        // Update existing feature
        await updateFeature({ ...data, _id: selectedFeature._id });
        // Close the dialog after a short delay to show loading state
        setTimeout(() => {
          setOpenFormDialog(false);
          setSelectedFeature(null);
        }, 500);
      } else {
        // Create new feature
        await createFeature(data);
        // Close the dialog after a short delay to show loading state
        setTimeout(() => {
          setOpenFormDialog(false);
          setSelectedFeature(null);
        }, 500);
      }
      return Promise.resolve();
    } catch (error: any) {
      // Error handling will be done by the hook's onError callback
      console.error('Error submitting feature:', error);
      return Promise.reject(error);
    }
  };

  const handleDeleteFeature = async (id: string) => {
    try {
      await deleteFeature(id);
      // Toast will be shown by the hook's onSuccess callback
    } catch (error: any) {
      // Error handling will be done by the hook's onError callback
      console.error('Error deleting feature:', error);
    }
  };

  const handleEditFromDetail = (feature: Feature) => {
    handleCloseDetailDialog();
    handleOpenFormDialog(feature);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  if (loading) {
    return (
      <PageContainer title={t('features.pageTitle')} description={t('features.pageDescription')}>
        <Box sx={{ bgcolor: 'background.paper', p: 3, borderRadius: 1, boxShadow: 1 }} display="flex" justifyContent="center">
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title={t('features.pageTitle')} description={t('features.pageDescription')}>
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
                {t('features.pageTitle')}
              </Typography>
              <Box 
                display="flex" 
                gap={2}
                flexDirection="row"
                width="100%"
                justifyContent={{ xs: 'stretch', sm: 'flex-end' }}
              >
                {/* Search Bar */}
                <TextField
                  placeholder={t('features.search.placeholder') || "Search requests..."}
                  size="small"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconSearch size={18} />
                      </InputAdornment>
                    )
                  }}
                  sx={{
                    width: { xs: '100%', sm: '320px' },
                    '& .MuiOutlinedInput-root': {
                      height: '36px',
                      fontSize: '0.875rem'
                    }
                  }}
                />

                {/* Add Button */}
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<IconPlus size={20} />}
                  onClick={() => handleOpenFormDialog()}
                  disabled={isSubmitting}
                  size="small"
                  sx={{
                    minHeight: { xs: '36px' },
                    fontSize: { xs: '0.813rem', sm: '0.875rem' }
                  }}
                >
                  {t('features.addButton')}
                </Button>
              </Box>
            </Box>
            
            <FeaturesTable 
              features={filteredFeatures}
              isLoading={isLoading}
              onViewFeature={handleOpenDetailDialog}
              onEditFeature={handleOpenFormDialog}
              onDeleteFeature={handleDeleteFeature}
            />
          </Grid>
        </Grid>
      </Box>

      <FeatureFormDialog
        open={openFormDialog}
        onClose={handleCloseFormDialog}
        onSubmit={handleSubmitFeature}
        initialData={selectedFeature}
        isSubmitting={isSubmitting}
        formTitle={selectedFeature ? t('features.form.editTitle') : t('features.form.createTitle')}
      />

      <FeatureDetailDialog
        open={openDetailDialog}
        onClose={handleCloseDetailDialog}
        feature={selectedFeature}
        onEdit={handleEditFromDetail}
      />

      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={handleCloseToast}
      />
    </PageContainer>
  );
};

export default DevelopmentRequestsPage; 