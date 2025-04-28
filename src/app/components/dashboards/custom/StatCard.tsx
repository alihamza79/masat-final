import React from 'react';
import { Box, Card, CardContent, Stack, Typography, useTheme, alpha } from '@mui/material';
import { IconArrowDownRight, IconArrowUpRight, TablerIconsProps } from '@tabler/icons-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactElement<TablerIconsProps>;
  percentChange?: number;
  colorIndex?: number;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  percentChange = 0,
  colorIndex = 0
}) => {
  const theme = useTheme();
  
  // Color variations
  const colors = [
    { main: theme.palette.primary.main, light: alpha(theme.palette.primary.main, 0.12) },
    { main: theme.palette.success.main, light: alpha(theme.palette.success.main, 0.12) },
    { main: theme.palette.warning.main, light: alpha(theme.palette.warning.main, 0.12) },
    { main: theme.palette.error.main, light: alpha(theme.palette.error.main, 0.12) },
    { main: theme.palette.secondary.main, light: alpha(theme.palette.secondary.main, 0.12) },
  ];
  
  const color = colors[colorIndex % colors.length];
  
  return (
    <Card 
      variant={theme.palette.mode === 'light' ? 'outlined' : undefined}
      sx={{ 
        boxShadow: theme.palette.mode === 'dark' ? theme.shadows[8] : theme.shadows[1],
        borderColor: theme.palette.divider,
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[3]
        }
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
              <Stack 
                direction="row" 
                spacing={0.5} 
                alignItems="center" 
                mt={1}
              >
                <Box 
                  sx={{
                    color: percentChange >= 0 ? 'success.main' : 'error.main',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {percentChange >= 0 ? (
                    <IconArrowUpRight size={18} stroke={1.5} />
                  ) : (
                    <IconArrowDownRight size={18} stroke={1.5} />
                  )}
                </Box>
                <Typography 
                  variant="caption" 
                  color={percentChange >= 0 ? 'success.main' : 'error.main'}
                  fontWeight={500}
                >
                  {Math.abs(percentChange)}%
                </Typography>
              </Stack>
            )}
          </Box>
          
          <Box 
            sx={{
              bgcolor: color.light,
              color: color.main,
              height: 60,
              width: 60,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 2px 10px 0 ${alpha(color.main, 0.15)}`,
              '& svg': {
                stroke: color.main,
                strokeWidth: 1.5
              }
            }}
          >
            {React.cloneElement(icon, { size: 30 })}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default StatCard; 