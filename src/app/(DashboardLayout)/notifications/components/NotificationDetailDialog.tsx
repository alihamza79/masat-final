import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { Notification } from '@/lib/hooks/useNotifications';
import NotificationIcon from './NotificationIcon';

interface NotificationDetailDialogProps {
  open: boolean;
  notification: Notification | null;
  onClose: () => void;
}

const NotificationDetailDialog = ({ 
  open, 
  notification, 
  onClose 
}: NotificationDetailDialogProps) => {
  const { t } = useTranslation();
  const router = useRouter();

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy • h:mm a');
    } catch (error) {
      return 'Unknown date';
    }
  };

  const handleViewFeature = () => {
    if (typeof window !== 'undefined' && notification?.referenceId) {
      sessionStorage.setItem('selectedFeatureId', notification.referenceId);
      sessionStorage.setItem('featureNotificationClicked', Date.now().toString());
      router.push('/development-requests');
    }
  };

  if (!notification) return null;

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
        <Box display="flex" alignItems="center" gap={2}>
          <NotificationIcon type={notification.type} />
          <Typography variant="h6" component="div">
            {notification.title}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography 
          variant="caption" 
          color="textSecondary" 
          component="div" 
          sx={{ mb: 2 }}
        >
          {formatDate(notification.createdAt)}
        </Typography>
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
          {notification.message}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined">
          {t('common.close')}
        </Button>
        {/* Only show for feature notifications */}
        {(notification.type === 'feature_update' || notification.type === 'feature_status_change') && 
         notification.referenceId && (
          <Button 
            onClick={handleViewFeature}
            variant="contained" 
            color="primary"
          >
            {t('notifications.viewFeature')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default NotificationDetailDialog; 