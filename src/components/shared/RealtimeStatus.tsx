'use client';

import React from 'react';
import { Box, Chip, Tooltip, IconButton } from '@mui/material';
import { 
  IconWifi, 
  IconWifiOff, 
  IconRefresh,
  IconCircleCheck,
  IconAlertCircle 
} from '@tabler/icons-react';
import { useRealtimeContext } from '@/providers/RealtimeProvider';

interface RealtimeStatusProps {
  showLabel?: boolean;
  size?: 'small' | 'medium';
  variant?: 'chip' | 'icon';
}

const RealtimeStatus: React.FC<RealtimeStatusProps> = ({ 
  showLabel = true, 
  size = 'small',
  variant = 'chip'
}) => {
  const { 
    isConnected, 
    connectionError, 
    reconnectAttempts, 
    forceReconnect 
  } = useRealtimeContext();

  const getStatusColor = () => {
    if (isConnected) return 'success';
    if (connectionError) return 'error';
    return 'warning';
  };

  const getStatusText = () => {
    if (isConnected) return 'Real-time Connected';
    if (connectionError) return `Connection Error${reconnectAttempts > 0 ? ` (${reconnectAttempts} attempts)` : ''}`;
    return 'Connecting...';
  };

  const getStatusIcon = () => {
    const iconSize = size === 'small' ? 16 : 20;
    if (isConnected) return <IconCircleCheck size={iconSize} />;
    if (connectionError) return <IconAlertCircle size={iconSize} />;
    return <IconWifiOff size={iconSize} />;
  };

  const handleReconnect = (e: React.MouseEvent) => {
    e.stopPropagation();
    forceReconnect();
  };

  if (variant === 'icon') {
    return (
      <Tooltip title={getStatusText()}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {getStatusIcon()}
          {(connectionError || reconnectAttempts > 0) && (
            <IconButton 
              size="small" 
              onClick={handleReconnect}
              sx={{ p: 0.5 }}
            >
              <IconRefresh size={14} />
            </IconButton>
          )}
        </Box>
      </Tooltip>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Chip
        icon={getStatusIcon()}
        label={showLabel ? getStatusText() : undefined}
        color={getStatusColor()}
        size={size}
        variant="outlined"
        sx={{
          fontSize: '0.75rem',
          height: size === 'small' ? 24 : 32,
          '& .MuiChip-icon': {
            fontSize: size === 'small' ? '0.875rem' : '1rem'
          }
        }}
      />
      {(connectionError || reconnectAttempts > 0) && (
        <Tooltip title="Retry connection">
          <IconButton 
            size="small" 
            onClick={handleReconnect}
            color="primary"
          >
            <IconRefresh size={16} />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};

export default RealtimeStatus; 