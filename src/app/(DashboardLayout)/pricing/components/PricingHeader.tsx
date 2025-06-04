'use client';

import React from 'react';
import {
  Grid,
  Typography,
  Box,
  Switch,
  useTheme
} from '@mui/material';
import { IconPercentage } from '@tabler/icons-react';

interface PricingHeaderProps {
  showYearly: boolean;
  onToggle: () => void;
}

const PricingHeader: React.FC<PricingHeaderProps> = ({ showYearly, onToggle }) => {
  const theme = useTheme();

  return (
    <Grid container spacing={3} justifyContent="center" mt={0}>
      <Grid item xs={12} sm={10} lg={8} textAlign="center">
        <Typography variant="h2">
          Flexible Plans Tailored to Fit Your Business Needs
        </Typography>
        <Box display="flex" alignItems="center" mt={5} justifyContent="center">
          <Typography variant="subtitle1" sx={{ mt: 2 }}>Monthly</Typography>
          <Box position="relative" mx={1}>
            <Box 
              sx={{
                position: 'absolute',
                top: -20,
                left: '50%',
                transform: 'translateX(-50%)',
                bgcolor: theme.palette.error.main,
                color: 'white',
                px: 1,
                py: 0.5,
                borderRadius: '10px',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                mb: 2,
              }}
            >
              <IconPercentage size={14} />
              UP TO 20% OFF with Yearly
            </Box>
            <Switch 
              checked={showYearly} 
              onChange={onToggle} 
              sx={{ mt: 2 }} 
            />
          </Box>
          <Typography variant="subtitle1" sx={{ mt: 2 }}>Yearly</Typography>
        </Box>
      </Grid>
    </Grid>
  );
};

export default PricingHeader; 