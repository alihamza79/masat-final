import React from 'react';
import { Box, Card, Typography, Stack, useTheme, Skeleton, useMediaQuery } from '@mui/material';
import { TablerIconsProps } from '@tabler/icons-react';

// Add skeleton component
export const SimplifiedStatsCardSkeleton = () => {
  const theme = useTheme();
  
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
        backgroundColor: theme.palette.background.paper,
        boxShadow: theme.shadows[2],
        transition: 'box-shadow 0.3s ease-in-out'
      }}
    >
      {/* Icon placeholder */}
      <Skeleton variant="circular" width={36} height={36} sx={{ mb: 1 }} />
      
      {/* Value placeholder */}
      <Skeleton variant="text" width="60%" height={32} sx={{ mb: 0.5 }} />
      
      {/* Title placeholder */}
      <Skeleton variant="text" width="80%" height={24} />
    </Box>
  );
};

interface SimplifiedStatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactElement<TablerIconsProps>;
  color?: string;
}

const SimplifiedStatsCard: React.FC<SimplifiedStatsCardProps> = ({
  title,
  value,
  icon,
  color
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const iconColor = color || theme.palette.primary.main;

  return (
    <Card sx={{ 
      p: isMobile ? 1.5 : 2.5, 
      flex: 1, 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center', 
      borderRadius: 2,
    }}>
      <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
        <Box sx={{ color: iconColor, display: 'flex', alignItems: 'center' }}>
          {React.cloneElement(icon, { size: 28, color: iconColor })}
        </Box>
        <Typography 
          variant="subtitle1" 
          fontWeight={700}
          sx={{ flex: 1, fontSize: '0.75rem' }}
        >
          {title}
        </Typography>
      </Stack>
      <Typography 
        variant="h6"
        fontWeight={600}
        sx={{ 
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontSize: '1.15rem',
          maxWidth: '100%'
        }}
      >
        {value}
      </Typography>
    </Card>
  );
};

export default SimplifiedStatsCard; 