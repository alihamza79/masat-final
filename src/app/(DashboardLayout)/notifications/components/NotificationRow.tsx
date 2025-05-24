import {
  TableRow,
  TableCell,
  Typography,
  Box,
  IconButton,
  useTheme
} from '@mui/material';
import { IconEye, IconTrash } from '@tabler/icons-react';
import { format, parseISO } from 'date-fns';
import { Notification } from '@/lib/hooks/useNotifications';
import NotificationIcon from './NotificationIcon';

interface NotificationRowProps {
  notification: Notification;
  onView: (notification: Notification) => void;
  onDelete: (notification: Notification) => void;
  onClick: (notification: Notification) => void;
}

const NotificationRow = ({ 
  notification, 
  onView, 
  onDelete, 
  onClick 
}: NotificationRowProps) => {
  const theme = useTheme();

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy • h:mm a');
    } catch (error) {
      return 'Unknown date';
    }
  };

  const handleViewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onView(notification);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(notification);
  };

  const handleRowClick = () => {
    onClick(notification);
  };

  return (
    <TableRow
      hover
      sx={{ 
        '&:last-child td, &:last-child th': { border: 0 },
        cursor: 'pointer',
        backgroundColor: notification.read ? 'transparent' : 'action.hover',
        // Add left border if unread
        borderLeft: notification.read ? 'none' : `3px solid ${theme.palette.primary.main}`,
      }}
      onClick={handleRowClick}
    >
      <TableCell>
        <Box display="flex" justifyContent="center">
          <NotificationIcon type={notification.type} />
        </Box>
      </TableCell>
      <TableCell>
        <Typography
          variant="body2"
          fontWeight={notification.read ? 400 : 600}
          color="textPrimary"
        >
          {notification.title}
        </Typography>
        <Typography
          variant="caption"
          color="textSecondary"
          sx={{ mt: 0.5, display: 'block' }}
        >
          {notification.message}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="caption" color="textSecondary">
          {formatDate(notification.createdAt)}
        </Typography>
      </TableCell>
      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
        <Box display="flex" alignItems="center" justifyContent="flex-end" gap={1}>
          {/* View button */}
          <IconButton
            onClick={handleViewClick}
            size="small"
            color="default"
            sx={{ 
              width: 32, 
              height: 32, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}
          >
            <IconEye size={18} />
          </IconButton>
          
          {/* Delete button */}
          <IconButton 
            onClick={handleDeleteClick}
            size="small"
            color="error"
            sx={{ 
              width: 32, 
              height: 32, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}
          >
            <IconTrash size={18} />
          </IconButton>
        </Box>
      </TableCell>
    </TableRow>
  );
};

export default NotificationRow; 