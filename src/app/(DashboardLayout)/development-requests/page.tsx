'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { 
  Grid, 
  Box, 
  Typography, 
  Button, 
  CircularProgress, 
  TextField, 
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Badge,
  useTheme
} from '@mui/material';
import PageContainer from '@/app/components/container/PageContainer';
import { IconPlus, IconSearch, IconUsers, IconUser, IconFilter } from '@tabler/icons-react';
import Toast from '@/app/components/common/Toast';
import { useTranslation } from 'react-i18next';
import useAuth from '@/lib/hooks/useAuth';
import FeaturesTable from './components/FeaturesTable';
import FeatureFormDialog from './components/FeatureFormDialog';
import FeatureDetailDialog from './components/FeatureDetailDialog';
import { useFeatures, Feature, FeatureStatus } from '@/lib/hooks/useFeatures';
import useFeatureOwnership from '@/lib/hooks/useFeatureOwnership';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

// Define FeatureFormData interface
export interface FeatureFormData {
  subject: string;
  body: string;
  status: FeatureStatus;
}

// Define filter types
type FilterType = 'all' | 'my';

const DevelopmentRequestsPage = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const searchParams = useSearchParams();
  const [openFormDialog, setOpenFormDialog] = useState<boolean>(false);
  const [openDetailDialog, setOpenDetailDialog] = useState<boolean>(false);
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
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
    getFeatureById,
    refetch,
  } = useFeatures();

  const { isOwner } = useFeatureOwnership();

  // Add loading state for notification handling
  const [isLoadingNotificationFeature, setIsLoadingNotificationFeature] = useState(false);
  const [pendingFeatureId, setPendingFeatureId] = useState<string | null>(null);

  // Add a dedicated query to fetch a single feature with fresh data
  const {
    data: freshFeatureData,
    isLoading: isFreshFeatureLoading,
  } = useQuery({
    queryKey: ['feature', pendingFeatureId],
    queryFn: async () => {
      if (!pendingFeatureId) return null;
      
      // Force refresh the global features list first
      await refetch();
      
      try {
        // Use the getFeature function from the API directly
        const response = await axios.get(`/api/features/${pendingFeatureId}`);
        if (response.data.success) {
          return response.data.data.feature;
        }
        throw new Error(response.data.error || 'Failed to fetch feature');
      } catch (error: any) {
        console.error('Error fetching feature details:', error);
        throw error;
      }
    },
    enabled: !!pendingFeatureId, // Only run the query when we have a feature ID
    staleTime: 0, // Don't use cached data
    refetchOnWindowFocus: false, // Don't refresh when window gains focus
  });

  // Check for feature ID in URL and sessionStorage, and open the detail dialog if present
  useEffect(() => {
    // First check URL parameter
    const featureIdFromUrl = searchParams.get('featureId');
    
    // Then check sessionStorage (client-side only)
    let featureIdFromStorage = null;
    if (typeof window !== 'undefined') {
      featureIdFromStorage = sessionStorage.getItem('selectedFeatureId');
      // Clear the session storage immediately to prevent unwanted reopening
      if (featureIdFromStorage) {
        sessionStorage.removeItem('selectedFeatureId');
      }
    }
    
    // Use either source of feature ID
    const featureId = featureIdFromUrl || featureIdFromStorage;
    
    if (featureId && features.length > 0) {
      // Force refresh features if coming from a notification click
      const notificationClicked = typeof window !== 'undefined' && 
        sessionStorage.getItem('featureNotificationClicked');
      
      if (notificationClicked) {
        // Clear the flag
        sessionStorage.removeItem('featureNotificationClicked');
        // Force refresh features to get latest data
        refetch().then(() => {
          // After refresh, find the updated feature and show dialog
          const updatedFeature = features.find((f: Feature) => f._id === featureId);
          if (updatedFeature) {
            setSelectedFeature(updatedFeature);
            setOpenDetailDialog(true);
          }
        });
      } else {
        // Regular flow - find feature and show dialog
        const feature = features.find((f: Feature) => f._id === featureId);
        if (feature) {
          setSelectedFeature(feature);
          setOpenDetailDialog(true);
        }
      }
    }
  }, [searchParams, features]);

  // Effect to handle fresh feature data arrival
  useEffect(() => {
    // If we have fresh feature data and we're waiting for a notification feature
    if (freshFeatureData && isLoadingNotificationFeature) {
      // Update the selected feature with fresh data
      setSelectedFeature(freshFeatureData);
      // Open the dialog with fresh data
      setOpenDetailDialog(true);
      // Reset loading state
      setIsLoadingNotificationFeature(false);
      // Clear the pending feature ID
      setPendingFeatureId(null);
    }
  }, [freshFeatureData, isLoadingNotificationFeature]);

  // Add useEffect hook to check for notification data on page load
  useEffect(() => {
    // Check if there's a stored feature ID from notification click
    if (typeof window !== 'undefined') {
      const storedFeatureId = sessionStorage.getItem('selectedFeatureId');
      const notificationTimestamp = sessionStorage.getItem('featureNotificationClicked');
      
      if (storedFeatureId && notificationTimestamp) {
        // Clear the storage to prevent reopening on refresh
        sessionStorage.removeItem('selectedFeatureId');
        sessionStorage.removeItem('featureNotificationClicked');
        
        // Set loading state
        setIsLoadingNotificationFeature(true);
        
        // Set pending feature ID to trigger the dedicated query
        setPendingFeatureId(storedFeatureId);
      }
    }
  }, []);  // Only run once on component mount

  // Register event listener for notification clicks when already on this page
  useEffect(() => {
    // Handler for when a notification is clicked while already on this page
    const handleFeatureNotificationClick = (event: any) => {
      const { featureId } = event.detail;
      
      if (featureId) {
        // Set loading state
        setIsLoadingNotificationFeature(true);
        
        // Set pending feature ID to trigger the dedicated query
        setPendingFeatureId(featureId);
      }
    };

    if (typeof window !== 'undefined') {
      // Event listener for notification clicks when already on the page
      window.addEventListener('featureNotificationClicked', handleFeatureNotificationClick);
      
      return () => {
        window.removeEventListener('featureNotificationClicked', handleFeatureNotificationClick);
      }
    };
  }, []);  // Only need to set up the event listener once

  // Add effect to update selectedFeature whenever features array changes
  useEffect(() => {
    // If we have a selected feature and the dialog is open
    if (selectedFeature && openDetailDialog) {
      // Find the feature with updated data in the latest features array
      const updatedFeature = features.find(
        (feature: Feature) => feature._id === selectedFeature._id
      );
      
      // If we found an updated version, replace the selected feature
      if (updatedFeature) {
        setSelectedFeature(updatedFeature);
      }
    }
  }, [features, selectedFeature?._id, openDetailDialog]);

  // Filter features based on search query and filter type
  const filteredFeatures = features.filter((feature: Feature) => {
    // Apply search filter
    const matchesSearch = 
      feature.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
      feature.body.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Apply type filter (all or my requests)
    const matchesType = filterType === 'all' || (filterType === 'my' && isOwner(feature));
    
    return matchesSearch && matchesType;
  });

  // Count of my features
  const myFeaturesCount = features.filter((feature: Feature) => isOwner(feature)).length;

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

  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterMenuClose = () => {
    setFilterAnchorEl(null);
  };

  const handleFilterChange = (type: FilterType) => {
    setFilterType(type);
    handleFilterMenuClose();
  };

  const getFilterButtonText = () => {
    switch (filterType) {
      case 'all':
        return t('features.filter.all');
      case 'my':
        return t('features.filter.myRequests');
      default:
        return t('features.filter.all');
    }
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
                alignItems="center"
                flexWrap="nowrap"
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
                    width: { xs: '100%', sm: '280px', md: '320px' },
                    '& .MuiOutlinedInput-root': {
                      height: '36px',
                      fontSize: '0.875rem'
                    }
                  }}
                />

                {/* Filter Button with Badge */}
                <Badge
                  color="primary"
                  variant="dot"
                  invisible={filterType === 'all'}
                  sx={{ '& .MuiBadge-badge': { right: 2, top: 3 } }}
                >
                  <Button
                    variant="outlined"
                    size="small"
                    color="inherit"
                    onClick={handleFilterClick}
                    startIcon={filterType === 'all' ? <IconUsers size={18} /> : <IconUser size={18} />}
                    aria-haspopup="true"
                    aria-expanded={Boolean(filterAnchorEl) ? 'true' : undefined}
                    aria-controls="filter-menu"
                    sx={{
                      minHeight: '36px',
                      minWidth: '36px',
                      maxWidth: { xs: '200px', sm: '240px', md: 'none' },
                      textTransform: 'none',
                      color: theme.palette.text.secondary,
                      borderColor: theme.palette.divider,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      '& .MuiButton-startIcon': {
                        mr: 1
                      },
                      '&:hover': {
                        borderColor: theme.palette.divider,
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)'
                      }
                    }}
                  >
                    {getFilterButtonText()}
                  </Button>
                </Badge>

                {/* Filter Menu */}
                <Menu
                  id="filter-menu"
                  anchorEl={filterAnchorEl}
                  open={Boolean(filterAnchorEl)}
                  onClose={handleFilterMenuClose}
                  MenuListProps={{
                    'aria-labelledby': 'filter-button',
                  }}
                  PaperProps={{
                    elevation: 2,
                    sx: { width: 280, maxWidth: '100%', mt: 1.5 }
                  }}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                  <MenuItem 
                    onClick={() => handleFilterChange('all')}
                    selected={filterType === 'all'}
                    sx={{ py: 1.5 }}
                  >
                    <ListItemIcon>
                      <IconUsers size={18} />
                    </ListItemIcon>
                    <ListItemText>{t('features.filter.all')}</ListItemText>
                  </MenuItem>

                  <MenuItem 
                    onClick={() => handleFilterChange('my')}
                    selected={filterType === 'my'}
                    sx={{ py: 1.5 }}
                  >
                    <ListItemIcon>
                      <IconUser size={18} />
                    </ListItemIcon>
                    <ListItemText>
                      {t('features.filter.myRequests')}
                      {myFeaturesCount > 0 && (
                        <Typography 
                          component="span" 
                          sx={{ 
                            ml: 1, 
                            fontSize: '0.75rem', 
                            color: theme.palette.primary.main,
                            fontWeight: 600, 
                            p: 0.5,
                            borderRadius: '10px',
                            backgroundColor: theme.palette.primary.light,
                            opacity: 0.8
                          }}
                        >
                          {myFeaturesCount}
                        </Typography>
                      )}
                    </ListItemText>
                  </MenuItem>
                </Menu>

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
                    fontSize: { xs: '0.813rem', sm: '0.875rem' },
                    whiteSpace: 'nowrap',
                    flexShrink: 0
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