import React, { useState, useEffect, useRef } from 'react';
import {
  IconButton,
  Box,
  Badge,
  Menu,
  MenuItem,
  Avatar,
  Typography,
  Button,
  Chip,
  Divider,
  CircularProgress,
  ListItemText,
  Fade
} from '@mui/material';
import Scrollbar from '@/app/components/custom-scroll/Scrollbar';
import useNotifications, { Notification as NotificationType } from '@/lib/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { 
  IconBellRinging, 
  IconInfoCircle,
  IconAlertTriangle,
  IconCheck,
  IconBulb
} from '@tabler/icons-react';
import { Stack } from '@mui/system';

const Notifications = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const [anchorEl2, setAnchorEl2] = useState(null);
  const previousUnreadCount = useRef(0);
  const [showNewIndicator, setShowNewIndicator] = useState(false);
  
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    markOneAsRead, 
    markAllAsRead, 
    refetchNotifications 
  } = useNotifications(10);

  // Visual indicator for new notifications
  useEffect(() => {
    if (unreadCount > previousUnreadCount.current) {
      // Show a visual indicator when we get new notifications
      setShowNewIndicator(true);
      
      // Hide the indicator after 2 seconds
      const timeout = setTimeout(() => {
        setShowNewIndicator(false);
      }, 2000);
      
      return () => clearTimeout(timeout);
    }
    
    // Update the reference for future comparisons
    previousUnreadCount.current = unreadCount;
  }, [unreadCount]);

  // Handle menu open/close
  const handleClick2 = (event: any) => {
    setAnchorEl2(event.currentTarget);
    // Refresh notifications when opening the menu
    refetchNotifications();
    // Hide new indicator when menu is opened
    setShowNewIndicator(false);
  };

  const handleClose2 = () => {
    setAnchorEl2(null);
  };

  // Get icon based on notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'feature_update':
        return <IconBulb size={20} color="#1976D2" />;
      case 'feature_status_change':
        return <IconBulb size={20} color="#1976D2" />;
      case 'system':
        return <IconInfoCircle size={20} color="#ED6C02" />;
      default:
        return <IconAlertTriangle size={20} color="#757575" />;
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'Unknown time';
    }
  };

  // Handle notification click - mark as read and navigate if needed
  const handleNotificationClick = async (notification: NotificationType) => {
    // Mark the notification as read
    if (!notification.read) {
      await markOneAsRead(notification._id);
    }

    // Navigate if it's a feature update/status change notification
    if (
      (notification.type === 'feature_update' || notification.type === 'feature_status_change') &&
      notification.referenceId && 
      notification.referenceType === 'Feature'
    ) {
      // Close menu
      handleClose2();
      
      // Store feature ID in sessionStorage
      if (typeof window !== 'undefined') {
        // Store the ID and also set a timestamp to force reload of feature data
        sessionStorage.setItem('selectedFeatureId', notification.referenceId);
        sessionStorage.setItem('featureNotificationClicked', Date.now().toString());
        
        // Check if we're already on the development-requests page
        const currentPath = window.location.pathname;
        if (currentPath.includes('/development-requests')) {
          // We're already on the page, dispatch a custom event to notify the page
          const event = new CustomEvent('featureNotificationClicked', { 
            detail: { featureId: notification.referenceId } 
          });
          window.dispatchEvent(event);
        } else {
          // Navigate to the development requests page
          router.push('/development-requests');
        }
      } else {
        // Fallback if window is not available (should not happen)
        router.push('/development-requests');
      }
    }
  };

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Notification bell with badge */}
      <IconButton
        size="large"
        aria-label={unreadCount ? `${unreadCount} new notifications` : "notifications"}
        color="inherit"
        aria-controls="msgs-menu"
        aria-haspopup="true"
        sx={{
          color: anchorEl2 ? 'primary.main' : (showNewIndicator ? 'primary.main' : 'text.secondary'),
          animation: showNewIndicator ? 'pulse 1s infinite' : 'none',
          '@keyframes pulse': {
            '0%': { transform: 'scale(1)' },
            '50%': { transform: 'scale(1.1)' },
            '100%': { transform: 'scale(1)' }
          }
        }}
        onClick={handleClick2}
      >
        <Badge badgeContent={unreadCount} color="primary">
          <IconBellRinging size={21} stroke="1.5" />
        </Badge>
      </IconButton>
      
      <Menu
        id="msgs-menu"
        anchorEl={anchorEl2}
        keepMounted
        open={Boolean(anchorEl2)}
        onClose={handleClose2}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        sx={{
          '& .MuiMenu-paper': {
            width: '360px',
          },
        }}
      >
        <Stack direction="row" py={2} px={4} justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Notifications</Typography>
          {unreadCount > 0 && (
            <Chip label={`${unreadCount} new`} color="primary" size="small" />
          )}
        </Stack>
        
        <Divider />
        
        {isLoading ? (
          <Box p={4} display="flex" justifyContent="center">
            <CircularProgress size={28} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box p={4} textAlign="center">
            <Typography color="textSecondary">No notifications</Typography>
          </Box>
        ) : (
          <Scrollbar sx={{ height: { xs: '320px', sm: '385px' } }}>
            {notifications.map((notification: NotificationType) => (
              <MenuItem 
                key={notification._id} 
                sx={{ 
                  py: 2, 
                  px: 4,
                  backgroundColor: notification.read ? 'transparent' : 'action.hover',
                  borderLeft: notification.read ? 'none' : '3px solid',
                  borderLeftColor: 'primary.main',
                  whiteSpace: 'normal',
                  overflowWrap: 'break-word',
                  wordWrap: 'break-word'
                }}
                onClick={() => handleNotificationClick(notification)}
              >
                <Stack direction="row" spacing={2} width="100%">
                  <Avatar
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: 'background.default',
                      flexShrink: 0
                    }}
                  >
                    {getNotificationIcon(notification.type)}
                  </Avatar>
                  <Box width="100%" sx={{ minWidth: 0 }}>
                    <Typography
                      variant="subtitle2"
                      color="textPrimary"
                      fontWeight={notification.read ? 500 : 600}
                      sx={{ 
                        mb: 0.5,
                        wordBreak: 'break-word'
                      }}
                    >
                      {notification.title}
                    </Typography>
                    <Typography
                      color="textSecondary"
                      variant="body2"
                      sx={{ 
                        mb: 0.5,
                        wordBreak: 'break-word'
                      }}
                    >
                      {notification.message}
                    </Typography>
                    <Typography
                      color="textSecondary"
                      variant="caption"
                      fontStyle="italic"
                    >
                      {formatDate(notification.createdAt)}
                    </Typography>
                  </Box>
                </Stack>
              </MenuItem>
            ))}
          </Scrollbar>
        )}
        
        <Divider />
        
        <Box p={3} display="flex" flexDirection="column" gap={1}>
          {unreadCount > 0 && (
            <Button 
              variant="outlined" 
              color="primary" 
              fullWidth
              onClick={() => markAllAsRead()}
            >
              {t('features.notifications.markAllRead')}
            </Button>
          )}
          <Button 
            variant="contained" 
            color="primary" 
            fullWidth
            component={Link}
            href="/notifications"
            onClick={handleClose2}
          >
            {t('features.notifications.viewAll')}
          </Button>
        </Box>
      </Menu>
    </Box>
  );
};

export default Notifications;
