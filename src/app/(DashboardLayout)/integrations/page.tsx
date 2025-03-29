'use client';
import { useState } from 'react';
import { Grid, Box, Typography, Button } from '@mui/material';
import PageHeader from '@/app/components/analytics-header/PageHeader';
import IntegrationsTable from './components/IntegrationsTable';
import PageContainer from '@/app/components/container/PageContainer';
import { IconPlus, IconRefresh } from '@tabler/icons-react';
import IntegrationFormDialog, { IntegrationFormData } from './components/IntegrationFormDialog';
import { useIntegrations } from '@/lib/hooks/useIntegrations';
import { useEmagData } from '@/lib/hooks/useEmagData';
import { useEmagDataStore } from '@/app/(DashboardLayout)/integrations/store/emagData';
import Toast from '@/app/components/common/Toast';
import { useTranslation } from 'react-i18next';

const IntegrationsPage = () => {
  const { t } = useTranslation();
  const [openDialog, setOpenDialog] = useState(false);
  const [isRefetching, setIsRefetching] = useState(false);
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'info' as 'success' | 'error' | 'info' | 'warning'
  });

  const { 
    integrations,
    isLoading,
    createIntegration,
    updateIntegration,
    deleteIntegration,
    isCreating,
    refetch: refetchIntegrations
  } = useIntegrations();

  const { refetch: refetchEmagData } = useEmagData();
  const { resetIntegrationsData } = useEmagDataStore();

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
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

  const handleRefetchData = async () => {
    setIsRefetching(true);
    try {
      // Clear existing data from the store
      resetIntegrationsData();
      
      // Refetch both integrations and eMAG data
      await Promise.all([
        refetchIntegrations(),
        refetchEmagData()
      ]);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setIsRefetching(false);
    }
  };

  const handleSubmitIntegration = async (data: IntegrationFormData) => {
    try {
      const result = await createIntegration(data);
      
      if (result.success) {
        showToast(t('integrations.toast.addSuccess'), 'success');
        setOpenDialog(false);
        
        // Trigger import for the new integration
        if (result.integration && result.integration._id) {
          // Refresh integrations data to include the new one
          await refetchIntegrations();
          
          // For immediate feedback, we'll also refresh eMAG data
          // This will automatically start the data sync process
          await refetchEmagData();
        }
      } else {
        // Don't show toast for errors - they're already shown in the dialog
        // Keep the dialog open so the user can fix the error
      }
    } catch (error: any) {
      // Don't show toast for errors - they're already shown in the dialog
    }
  };

  const handleIntegrationUpdate = async (updatedIntegration: IntegrationFormData, index: number) => {
    const integration = integrations[index];
    if (!integration._id) {
      showToast(t('integrations.toast.missingId'), 'error');
      return;
    }

    try {
      const result = await updateIntegration({ id: integration._id, data: updatedIntegration });
      
      if (result.success) {
        showToast(t('integrations.toast.updateSuccess'), 'success');
      } else {
        // Don't show toast for errors - they're already shown in the dialog
        // Keep the dialog open so the user can fix the error
      }
    } catch (error: any) {
      // Don't show toast for errors - they're already shown in the dialog
    }
  };

  const handleIntegrationDelete = async (index: number) => {
    const integration = integrations[index];
    if (!integration._id) {
      showToast(t('integrations.toast.missingId'), 'error');
      return;
    }

    try {
      const result = await deleteIntegration(integration._id);
      
      if (result.success) {
        showToast(t('integrations.toast.deleteSuccess'), 'success');
      } else {
        showToast(`${t('integrations.toast.deleteError')}${result.error}`, 'error');
      }
    } catch (error: any) {
      showToast(`Error: ${error.message || t('integrations.toast.processingError')}`, 'error');
    }
  };

  return (
    <PageContainer title={t('integrations.title')} description={t('integrations.title')}>
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
                {t('integrations.title')}
              </Typography>
              <Box 
                display="flex" 
                gap={1}
                flexDirection="row"
                width="100%"
                justifyContent={{ xs: 'stretch', sm: 'flex-end' }}

              >
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<IconRefresh size={20} />}
                  onClick={handleRefetchData}
                  disabled={isRefetching || isLoading}
                  size="small"
                  sx={{
                    minHeight: { xs: '36px' },
                    fontSize: { xs: '0.813rem', sm: '0.875rem' },
                    width: { xs: '50%', sm: 'auto' }
                  }}
                >
                  {isRefetching ? t('integrations.refreshingButton') : t('integrations.refreshButton')}
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<IconPlus size={20} />}
                  onClick={handleOpenDialog}
                  disabled={isCreating}
                  size="small"
                  sx={{
                    minHeight: { xs: '36px' },
                    fontSize: { xs: '0.813rem', sm: '0.875rem' },
                    width: { xs: '50%', sm: 'auto' }
                  }}
                >
                  {isCreating ? t('integrations.addingButton') : t('integrations.addButton')}
                </Button>
              </Box>
            </Box>
            
            <IntegrationsTable 
              integrations={integrations}
              isLoading={isLoading || isRefetching}
              onIntegrationUpdate={handleIntegrationUpdate}
              onIntegrationDelete={handleIntegrationDelete}
            />
          </Grid>
        </Grid>
      </Box>

      <IntegrationFormDialog
        open={openDialog}
        onClose={handleCloseDialog}
        onSubmit={handleSubmitIntegration}
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

export default IntegrationsPage;