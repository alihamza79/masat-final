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
  Tooltip,
  Stack
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Feature } from '@/lib/hooks/useFeatures';
import { IconBulb, IconCode, IconEdit, IconBell, IconBellOff, IconThumbUp } from '@tabler/icons-react';
import useFeatureOwnership from '@/lib/hooks/useFeatureOwnership';
import useFeatureSubscription from '@/lib/hooks/useFeatureSubscription';
import useFeatureVoting from '@/lib/hooks/useFeatureVoting';

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
  
  // Use feature voting hook
  const {
    hasVoted,
    isLoading: isLoadingVote,
    toggleVote,
    isVoting,
    isRemovingVote
  } = useFeatureVoting(feature?._id || '');
  
  const isSubscriptionLoading = isLoadingSubscription || isSubscribing || isUnsubscribing;
  const isVoteLoading = isLoadingVote || isVoting || isRemovingVote;
  
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

  const handleVoteToggle = async () => {
    if (isVoteLoading) return;
    
    try {
      await toggleVote();
    } catch (error) {
      console.error('Failed to toggle vote:', error);
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
          maxWidth: '550px'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        {/* Feature Title - Now on its own line with full width */}
        <Typography variant="h4" component="div" sx={{ wordBreak: "break-word", mb: 2 }}>
          {feature.subject}
        </Typography>
        
        {/* Info and Action Bar - Moved below title */}
        <Stack 
          direction="row" 
          spacing={2} 
          alignItems="center" 
          justifyContent="space-between" 
          sx={{ mt: 1 }}
        >
          {/* Left side - Status and Vote count */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            {renderStatusChip(feature.status)}
            
            <Chip
              icon={<IconThumbUp size={16} />}
              label={feature.voteCount || 0}
              size="small"
              sx={{
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                fontWeight: 600,
                fontSize: '0.75rem',
                '.MuiChip-icon': {
                  color: theme.palette.primary.main,
                }
              }}
            />
          </Stack>
          
          {/* Right Side - Action Buttons */}
          <Stack direction="row" spacing={1}>
            {/* Only show vote and subscribe buttons if not owner */}
            {!isOwner(feature) && (
              <>
                {/* Vote button */}
                <Tooltip title={hasVoted ? t('features.vote.removeVote') : t('features.vote.addVote')}>
                  <Button
                    onClick={handleVoteToggle}
                    disabled={isVoteLoading}
                    size="small"
                    color="primary"
                    variant={hasVoted ? 'contained' : 'outlined'}
                    startIcon={
                      isVoteLoading ? (
                        <CircularProgress size={16} />
                      ) : (
                        <IconThumbUp size={16} />
                      )
                    }
                    sx={{ minWidth: 0, px: 1, whiteSpace: 'nowrap' }}
                  >
                    {hasVoted ? t('features.vote.voted') : t('features.vote.vote')}
                  </Button>
                </Tooltip>
                
                {/* Subscribe button */}
                <Tooltip title={isSubscribed ? t('features.subscription.unsubscribe') : t('features.subscription.subscribe')}>
                  <Button
                    onClick={handleSubscriptionToggle}
                    disabled={isSubscriptionLoading}
                    size="small"
                    color="primary"
                    variant={isSubscribed ? 'contained' : 'outlined'}
                    startIcon={
                      isSubscriptionLoading ? (
                        <CircularProgress size={16} />
                      ) : (
                        <IconBell size={16} />
                      )
                    }
                    sx={{ minWidth: 0, px: 1, whiteSpace: 'nowrap' }}
                  >
                    {isSubscribed ? t('common.unsubscribe', 'Unsubscribe') : t('common.subscribe', 'Subscribe')}
                  </Button>
                </Tooltip>
              </>
            )}
          </Stack>
        </Stack>
      </DialogTitle>
      
      <Divider />
      
      {/* Feature creation info removed */}
      
      <DialogContent sx={{ pt: 3 }}>
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
          {feature.body}
        </Typography>
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