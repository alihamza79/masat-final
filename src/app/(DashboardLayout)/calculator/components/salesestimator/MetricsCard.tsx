import React from 'react';
import { Card, Typography, Stack, Grid, useTheme } from '@mui/material';
import { MetricCardProps } from './types';

interface MetricsGridProps {
  metrics: MetricCardProps[];
}

const MetricsCard: React.FC<MetricsGridProps> = ({ metrics }) => {
  const theme = useTheme();

  return (
    <Grid container spacing={{ xs: 2, sm: 2, md: 2 }} mb={3}>
      {metrics.map((metric) => (
        <Grid item xs={12} sm={6} md={2.4} key={metric.label}>
          <Card 
            sx={{ 
              p: { xs: 1.5, sm: 2 }, 
              bgcolor: theme.palette.mode === 'dark' 
                ? 'rgba(0, 0, 0, 0.1)' 
                : 'grey.50',
              backdropFilter: 'blur(4px)',
              border: '1px solid',
              borderColor: theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'divider',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}
          >
            <Typography 
              variant="subtitle2" 
              sx={{ 
                color: 'text.secondary',
                fontSize: { xs: '11px', sm: '12px' },
                mb: { xs: 0.5, sm: 1 }
              }}
            >
              {metric.label}
            </Typography>
            <Stack 
              direction="row" 
              alignItems="center" 
              spacing={1}
              sx={{
                flexWrap: { xs: 'wrap', sm: 'nowrap' }
              }}
            >
              <Typography 
                variant="h6" 
                sx={{ 
                  color: 'text.primary',
                  fontSize: { xs: '14px', sm: '16px' },
                  fontWeight: 600
                }}
              >
                lei {metric.value.toFixed(2)}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'text.secondary',
                  fontSize: { xs: '10px', sm: '11px' }
                }}
              >
                ({metric.percent})
              </Typography>
            </Stack>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default MetricsCard; 