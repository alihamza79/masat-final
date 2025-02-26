import React from 'react';
import { Box, Stack, Typography, Slider, styled } from '@mui/material';
import { CalculatorType, Distributions } from './types';
import SalesEstimatorInput from '../SalesEstimatorInput';

// Custom styled Slider
const CustomSlider = styled(Slider)(({ theme }) => ({
  height: 8,
  padding: '13px 0',
  '& .MuiSlider-rail': {
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    height: 8,
    borderRadius: 4,
    opacity: 1
  },
  '& .MuiSlider-track': {
    height: 8,
    border: 'none',
    borderRadius: 4,
    '&:after': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'none',
      pointerEvents: 'none'
    }
  },
  '& .MuiSlider-thumb': {
    height: 20,
    width: 20,
    backgroundColor: '#fff',
    border: '2px solid #5D87FF',
    '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
      boxShadow: 'inherit',
    },
    '&:before': {
      display: 'none',
    },
    zIndex: 10,
    '& .MuiSlider-valueLabel': {
      display: 'none'
    },
    '&.Mui-active .MuiSlider-valueLabel': {
      display: 'block'
    }
  },
  '& .MuiSlider-valueLabel': {
    lineHeight: 1.2,
    fontSize: 12,
    background: 'unset',
    padding: 0,
    width: 32,
    height: 32,
    borderRadius: '6px',
    backgroundColor: '#5D87FF',
    transformOrigin: 'bottom left',
    transform: 'translate(50%, -100%)',
    '&:before': { display: 'none' },
    '& > *': {
      transform: 'none',
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
  },
}));

interface DistributionSliderProps {
  sliderValue: number[];
  distributions: Distributions;
  onSliderChange: (event: Event, newValue: number | number[]) => void;
  onPiecesChange: (type: CalculatorType, value: number) => void;
}

const DistributionSlider: React.FC<DistributionSliderProps> = ({
  sliderValue,
  distributions,
  onSliderChange,
  onPiecesChange
}) => {
  const sliderRef = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    const updateSliderColors = () => {
      if (!sliderRef.current) return;
      
      const rail = sliderRef.current.querySelector('.MuiSlider-rail') as HTMLElement;
      if (rail) {
        rail.style.background = `linear-gradient(to right, 
          #FF9800 0%, 
          #FF9800 ${sliderValue[0]}%, 
          #5D87FF ${sliderValue[0]}%, 
          #5D87FF ${sliderValue[1]}%, 
          #2CD9C5 ${sliderValue[1]}%, 
          #2CD9C5 100%)`;
      }
    };

    updateSliderColors();
  }, [sliderValue]);

  return (
    <Box sx={{ flex: 1 }}>
      <Stack spacing={1}>
        <Stack 
          direction="row" 
          justifyContent="space-between"
          sx={{ 
            height: '20px',
            '& > *': {
              width: { xs: '80px', sm: '100px', md: '120px' },
              textAlign: 'center',
              fontSize: { xs: '11px', sm: '12px', md: '13px' },
              color: 'text.secondary',
              fontWeight: 500,
              lineHeight: '20px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }
          }}
        >
          <Typography>FBM-NonGenius</Typography>
          <Typography>FBM-Genius</Typography>
          <Typography>FBE</Typography>
        </Stack>
        <Box sx={{ height: '35px', display: 'flex', alignItems: 'center' }}>
          <CustomSlider
            ref={sliderRef}
            value={sliderValue}
            onChange={onSliderChange}
            valueLabelDisplay="on"
            valueLabelFormat={(value) => `${value}%`}
          />
        </Box>
        <Stack 
          direction="row"
          spacing={{ xs: 1, sm: 2 }}
          alignItems="center"
          justifyContent="space-between"
          sx={{ 
            mt: { xs: 1, sm: 0.5 }
          }}
        >
          {(['FBM-NonGenius', 'FBM-Genius', 'FBE'] as CalculatorType[]).map((type) => (
            <Box
              key={type}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                height: '35px',
                position: 'relative',
                width: { xs: '32%', sm: '100px', md: '120px' },
                minWidth: '90px'
              }}
            >
              <SalesEstimatorInput
                label={`${type} pieces`}
                value={distributions[type].pieces}
                onChange={(value) => onPiecesChange(type, value)}
                showLabel={false}
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  position: 'absolute',
                  right: { xs: 4, sm: 8 },
                  fontSize: { xs: '9px', sm: '11px' },
                  whiteSpace: 'nowrap'
                }}
              >
                ({distributions[type].percent.toFixed(2)}%)
              </Typography>
            </Box>
          ))}
        </Stack>
      </Stack>
    </Box>
  );
};

export default DistributionSlider; 