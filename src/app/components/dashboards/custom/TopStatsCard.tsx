import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { TablerIconsProps } from '@tabler/icons-react';

interface TopStatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactElement<TablerIconsProps>;
  colorScheme: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'secondary';
}

const TopStatsCard: React.FC<TopStatsCardProps> = ({
  title,
  value,
  icon,
  colorScheme = 'primary'
}) => {
  const theme = useTheme();
  
  // Get the appropriate icon color based on colorScheme
  let iconColor: string;
  switch (colorScheme) {
    case 'primary':
      iconColor = '#6870fa';  // Blue
      break;
    case 'success':
      iconColor = '#00c292';  // Green
      break;
    case 'warning':
      iconColor = '#ff9f40';  // Orange/Yellow
      break;
    case 'info':
      iconColor = '#4fc3f7';  // Light blue
      break;
    case 'error':
      iconColor = '#f56e50';  // Red/Orange
      break;
    case 'secondary':
      iconColor = '#7987ff';  // Purple/Blue
      break;
    default:
      iconColor = theme.palette.primary.main; // Fallback to primary color
  }
  
  return (
    <Box 
      sx={{ 
        height: '100%',
        p: 2,
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.palette[colorScheme]?.light || theme.palette.primary.light,
        boxShadow: 'none',
        '&:hover': {
          boxShadow: theme.shadows[1],
          transition: 'box-shadow 0.3s ease-in-out'
        }
      }}
    >
      {/* Icon */}
      <Box sx={{ mb: 1 }}>
        {React.cloneElement(icon, { 
          size: 36,
          color: iconColor,
          stroke: 1.5
        })}
      </Box>
      
      {/* Value */}
      <Typography
        color={iconColor}
        variant="h5"
        fontWeight={600}
        sx={{ 
          lineHeight: 1.2,
          mb: 0.5
        }}
      >
        {value}
      </Typography>
      
      {/* Title */}
      <Typography
        color={iconColor}
        variant="subtitle2"
        fontWeight={500}
        sx={{ opacity: 0.9 }}
      >
        {title}
      </Typography>
    </Box>
  );
};

export default TopStatsCard; 