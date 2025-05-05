import React from 'react';
import { Box, Card, Typography, Stack, useTheme } from '@mui/material';
import { TablerIconsProps } from '@tabler/icons-react';

interface SimplifiedStatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactElement<TablerIconsProps>;
}

const SimplifiedStatsCard: React.FC<SimplifiedStatsCardProps> = ({
  title,
  value,
  icon
}) => {
  const theme = useTheme();
  
  return (
    <Card sx={{ 
      p: 2.5, 
      flex: 1, 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center', 
      borderRadius: 2,
      height: '100%',
      border: `1px solid ${theme.palette.divider}`,
      boxShadow: 'none',
      position: 'relative'
    }}>
      <Box 
        sx={{ 
          position: 'absolute',
          top: 10,
          right: 10,
          color: theme.palette.text.secondary,
          opacity: 0.7
        }}
      >
        {React.cloneElement(icon, { size: 24 })}
      </Box>
      
      <Stack spacing={1}>
        <Typography 
          variant="subtitle1" 
          fontWeight={700} 
          mb={0.5}
        >
          {title}
        </Typography>
        <Typography 
          variant="h3" 
          fontWeight={600}
        >
          {value}
        </Typography>
      </Stack>
    </Card>
  );
};

export default SimplifiedStatsCard; 