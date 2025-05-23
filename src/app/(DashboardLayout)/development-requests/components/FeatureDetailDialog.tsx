import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Divider,
  useTheme,
  Grid,
  IconButton,
  CircularProgress,
  Tooltip
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Feature } from '@/lib/hooks/useFeatures';
import { IconBulb, IconCode, IconEdit, IconBell, IconBellOff } from '@tabler/icons-react';
import useFeatureOwnership from '@/lib/hooks/useFeatureOwnership';
import useFeatureSubscription from '@/lib/hooks/useFeatureSubscription';

interface FeatureDetailDialogProps {
  open: boolean;
  onClose: () => void;
  feature: Feature | null;
  onEdit?: (feature: Feature) => void;
}

const FeatureDetailDialog: React.FC<FeatureDetailDialogProps> = ({
  open,
  onClose,
  feature,
  onEdit
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { isOwner } = useFeatureOwnership();
  
  // Use feature subscription hook if feature is available
  const { 
    isSubscribed, 
    isLoading: isLoadingSubscription, 
    toggleSubscription,
    isSubscribing,
    isUnsubscribing
  } = useFeatureSubscription(feature?._id || '');
  
  const isSubscriptionLoading = isLoadingSubscription || isSubscribing || isUnsubscribing;
  
  if (!feature) {
    return null;
  }
  
  // Format date for display
  const formatDate = (dateString: string | Date | undefined) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Render status with icon
  const renderStatusChip = (status: string) => {
    switch (status) {
      case 'Proposed':
        return (
          <Chip
            icon={<IconBulb size={16} />}
            label={t('features.status.proposed')}
            size="small"
            sx={{
              bgcolor: 'rgba(33, 150, 243, 0.1)',
              color: 'primary.main',
              '.MuiChip-icon': {
                color: 'primary.main',
                marginLeft: '4px'
              },
              borderRadius: '4px',
              fontWeight: 500
            }}
          />
        );
      case 'Development':
        return (
          <Chip
            icon={<IconCode size={16} />}
            label={t('features.status.development')}
            size="small"
            sx={{
              bgcolor: 'rgba(76, 175, 80, 0.1)',
              color: 'success.main',
              '.MuiChip-icon': {
                color: 'success.main',
                marginLeft: '4px'
              },
              borderRadius: '4px',
              fontWeight: 500
            }}
          />
        );
      default:
        return <Chip label={status} size="small" sx={{ borderRadius: '4px', fontWeight: 500 }} />;
    }
  };

  const handleSubscriptionToggle = async () => {
    if (isSubscriptionLoading) return;
    
    try {
      await toggleSubscription();
    } catch (error) {
      console.error('Failed to toggle subscription:', error);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 1,
          maxWidth: '500px'
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 2 }}>
          <Typography variant="h6" component="div">
            {feature.subject}
          </Typography>
          {renderStatusChip(feature.status)}
        </Box>
        
        {/* Subscribe button - only show if not owner */}
        {!isOwner(feature) && (
          <Tooltip title={isSubscribed ? t('features.subscription.unsubscribe') : t('features.subscription.subscribe')}>
            <Button
              onClick={handleSubscriptionToggle}
              disabled={isSubscriptionLoading}
              size="small"
              color="primary"
              variant={isSubscribed ? 'contained' : 'outlined'}
              startIcon={
                isSubscriptionLoading ? (
                  <CircularProgress size={20} />
                ) : (
                  <IconBell size={20} />
                )
              }
              sx={{ ml: 1, minWidth: 0, px: 2, whiteSpace: 'nowrap', fontWeight: 600 }}
            >
              {isSubscribed ? t('common.unsubscribe', 'Unsubscribe') : t('common.subscribe', 'Subscribe')}
            </Button>
          </Tooltip>
        )}
      </DialogTitle>
      <Divider />
      <DialogContent>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {feature.body}
            </Typography>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined">
          {t('common.close')}
        </Button>
        {/* Only show edit button if user is the creator and onEdit prop is provided */}
        {onEdit && isOwner(feature) && (
          <Button 
            onClick={() => onEdit(feature)} 
            variant="contained" 
            color="primary"
            startIcon={<IconEdit size={18} />}
          >
            {t('features.actions.edit')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default FeatureDetailDialog; 