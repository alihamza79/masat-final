import React, { useRef, useEffect } from 'react';
import { Slider, styled } from '@mui/material';

// Custom styled Slider
const StyledSlider = styled(Slider)(({ theme }) => ({
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

interface CustomSliderProps {
  value: number[];
  onChange: (event: Event, newValue: number | number[]) => void;
  valueLabelDisplay?: 'on' | 'auto' | 'off';
  valueLabelFormat?: (value: number) => string;
}

const CustomSlider = React.forwardRef<HTMLSpanElement, CustomSliderProps>(
  ({ value, onChange, valueLabelDisplay = 'on', valueLabelFormat }, ref) => {
    const sliderRef = useRef<HTMLSpanElement | null>(null);
    
    // Set up a callback ref that updates both refs
    const combinedRef = React.useCallback((node: HTMLSpanElement | null) => {
      // Forward the ref to the parent component if provided
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLSpanElement | null>).current = node;
      }
      
      // Set our internal ref
      sliderRef.current = node;
    }, [ref]);

    // Update slider colors when value changes
    useEffect(() => {
      updateSliderColors();
    }, [value]);

    const updateSliderColors = () => {
      if (!sliderRef.current) return;
      
      const rail = sliderRef.current.querySelector('.MuiSlider-rail') as HTMLElement;
      if (rail) {
        rail.style.background = `linear-gradient(to right, 
          #FF9800 0%, 
          #FF9800 ${value[0]}%, 
          #5D87FF ${value[0]}%, 
          #5D87FF ${value[1]}%, 
          #2CD9C5 ${value[1]}%, 
          #2CD9C5 100%)`;
      }
    };

    return (
      <StyledSlider
        ref={combinedRef}
        value={value}
        onChange={onChange}
        valueLabelDisplay={valueLabelDisplay}
        valueLabelFormat={valueLabelFormat}
      />
    );
  }
);

CustomSlider.displayName = 'CustomSlider';

export default CustomSlider; 