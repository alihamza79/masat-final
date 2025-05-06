import React from 'react';
import { Box, Card, CardContent, Stack, Typography, useTheme, alpha } from '@mui/material';
import { IconArrowDownRight, IconArrowUpRight, TablerIconsProps } from '@tabler/icons-react';

interface DashboardStatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactElement<TablerIconsProps>;
  percentChange?: number;
  colorIndex?: number;
}

const DashboardStatCard: React.FC<DashboardStatCardProps> = ({
  title,
  value,
  icon,
  percentChange = 0,
  colorIndex = 0
}) => {
  const theme = useTheme();
  
  // Color variations
  const colors = [
    { main: theme.palette.primary.main, light: alpha(theme.palette.primary.main, 0.1) },
    { main: theme.palette.success.main, light: alpha(theme.palette.success.main, 0.1) },
    { main: theme.palette.warning.main, light: alpha(theme.palette.warning.main, 0.1) },
    { main: theme.palette.error.main, light: alpha(theme.palette.error.main, 0.1) },
    { main: theme.palette.secondary.main, light: alpha(theme.palette.secondary.main, 0.1) },
    { main: theme.palette.info.main, light: alpha(theme.palette.info.main, 0.1) },
  ];
  
  const color = colors[colorIndex % colors.length];
  
  return (
    <Card 
      variant="outlined"
      sx={{ 
        borderColor: theme.palette.divider,
        height: '100%',
        boxShadow: 'none',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack 
          direction="row" 
          spacing={2} 
          justifyContent="space-between" 
          alignItems="flex-start"
        >
          <Box>
            <Typography 
              variant="subtitle2" 
              color="textSecondary" 
              fontWeight={400}
              gutterBottom
            >
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={600}>
              {value}
            </Typography>
            
            {percentChange !== undefined && (
              <Box 
                sx={{
                  mt: 1,
                  color: percentChange >= 0 ? 'success.main' : 'error.main',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5
                }}
              >
                {percentChange >= 0 ? (
                  <IconArrowUpRight size={16} stroke={1.5} />
                ) : (
                  <IconArrowDownRight size={16} stroke={1.5} />
                )}
                <Typography 
                  variant="caption" 
                  fontWeight={500}
                  color="inherit"
                >
                  {Math.abs(percentChange)}%
                </Typography>
              </Box>
            )}
          </Box>
          
          <Box 
            sx={{
              bgcolor: color.light,
              height: 65,
              width: 65,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              '& svg': {
                color: color.main,
                stroke: color.main,
                strokeWidth: 1.5
              }
            }}
          >
            {React.cloneElement(icon, { size: 32 })}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default DashboardStatCard; 