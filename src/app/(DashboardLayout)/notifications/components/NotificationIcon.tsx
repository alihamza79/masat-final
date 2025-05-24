import { useTheme } from '@mui/material';
import { 
  IconBulb, 
  IconInfoCircle, 
  IconAlertTriangle 
} from '@tabler/icons-react';

interface NotificationIconProps {
  type: string;
  size?: number;
}

const NotificationIcon = ({ type, size = 20 }: NotificationIconProps) => {
  const theme = useTheme();

  switch (type) {
    case 'feature_update':
      return <IconBulb size={size} color={theme.palette.primary.main} />;
    case 'feature_status_change':
      return <IconBulb size={size} color={theme.palette.primary.main} />;
    case 'system':
      return <IconInfoCircle size={size} color={theme.palette.warning.main} />;
    default:
      return <IconAlertTriangle size={size} color={theme.palette.text.secondary} />;
  }
};

export default NotificationIcon; 