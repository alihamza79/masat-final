import React, { useRef, useEffect } from 'react';
import { Slider, styled } from '@mui/material';
import { VisibleCards, CardKey } from '../../hooks/useCalculatorReset';

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

// Color mapping for calculator types
const COLOR_MAP = {
  'FBM-NonGenius': '#FF9800', // Orange
  'FBM-Genius': '#5D87FF',    // Blue
  'FBE': '#2CD9C5'            // Teal
};

// Type for calculator color map keys
type ColorMapKey = keyof typeof COLOR_MAP;

interface CustomSliderProps {
  value: number[];
  onChange: (event: Event, newValue: number | number[]) => void;
  valueLabelDisplay?: 'on' | 'auto' | 'off';
  valueLabelFormat?: (value: number) => string;
  visibleCards?: VisibleCards;
}

const CustomSlider = React.forwardRef<HTMLSpanElement, CustomSliderProps>(
  ({ value, onChange, valueLabelDisplay = 'on', valueLabelFormat, visibleCards }, ref) => {
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

    // Get array of visible calculator types
    const getVisibleTypes = () => {
      if (!visibleCards) return ['FBM-NonGenius', 'FBM-Genius', 'FBE'] as ColorMapKey[];
      
      return (Object.entries(visibleCards) as [ColorMapKey, boolean][])
        .filter(([_, isVisible]) => isVisible)
        .map(([type]) => type);
    };

    const visibleTypes = getVisibleTypes();
    const isTwoVisibleCalculators = visibleTypes.length === 2;

    // Get sorted visible types to maintain consistent order
    const sortedVisibleTypes = [...visibleTypes].sort();

    // For two calculators, determine the appropriate value to display
    const getCurrentValue = () => {
      if (!isTwoVisibleCalculators) return value;
      
      // For two calculators, we need to determine which value to use
      if (sortedVisibleTypes[0] === 'FBM-NonGenius') {
        // For NonGenius + anything, use value[0]
        return value[0];
      } else if (sortedVisibleTypes[0] === 'FBM-Genius' && sortedVisibleTypes[1] === 'FBE') {
        // For Genius + FBE, use value[1]
        return value[1];
      }
      
      // Fallback
      return value[0];
    };

    // Get the current value to display on the slider
    const currentValue = isTwoVisibleCalculators ? getCurrentValue() : value;

    const handleChange = (event: Event, newValue: number | number[]) => {
      if (isTwoVisibleCalculators) {
        // Convert single value to the appropriate format for the parent component
        let updatedValue: number[];
        
        if (sortedVisibleTypes[0] === 'FBM-NonGenius') {
          // If FBM-NonGenius is visible (first position), use first value
          updatedValue = [newValue as number, 100];
        } else if (sortedVisibleTypes[0] === 'FBM-Genius' && sortedVisibleTypes[1] === 'FBE') {
          // If FBM-Genius and FBE are visible, use second value
          updatedValue = [0, newValue as number];
        } else {
          // Fallback for any other combination
          updatedValue = [newValue as number, 100];
        }
        
        onChange(event, updatedValue);
      } else {
        // For three calculators, pass through the original values
        onChange(event, newValue);
      }
    };

    // Update slider colors when value or visibleCards changes
    useEffect(() => {
      if (isTwoVisibleCalculators) {
        createTwoColorSlider();
      } else if (visibleTypes.length === 3) {
        createThreeColorSlider();
      } else if (visibleTypes.length === 1) {
        createSingleColorSlider();
      }
    }, [value, visibleCards, visibleTypes.length, isTwoVisibleCalculators]);

    // Create a slider with only one color
    const createSingleColorSlider = () => {
      if (!sliderRef.current) return;
      
      const container = sliderRef.current;
      const rail = container.querySelector('.MuiSlider-rail') as HTMLElement;
      
      if (!rail) return;
      
      // Clean up any custom elements we might have created
      removeCustomElements();
      
      // Set the color based on the visible calculator type
      const color = COLOR_MAP[visibleTypes[0] as ColorMapKey];
      rail.style.background = color;
    };

    // Create a slider with three colors
    const createThreeColorSlider = () => {
      if (!sliderRef.current) return;
      
      const container = sliderRef.current;
      const rail = container.querySelector('.MuiSlider-rail') as HTMLElement;
      
      if (!rail) return;
      
      // Clean up any custom elements we might have created
      removeCustomElements();
      
      // Create a three-color gradient for all three calculator types
      rail.style.background = `linear-gradient(to right, 
        ${COLOR_MAP['FBM-NonGenius']} 0%, 
        ${COLOR_MAP['FBM-NonGenius']} ${value[0]}%, 
        ${COLOR_MAP['FBM-Genius']} ${value[0]}%, 
        ${COLOR_MAP['FBM-Genius']} ${value[1]}%, 
        ${COLOR_MAP['FBE']} ${value[1]}%, 
        ${COLOR_MAP['FBE']} 100%)`;
    };
    
    // Create a slider with two colors for any two calculator types
    const createTwoColorSlider = () => {
      if (!sliderRef.current || visibleTypes.length !== 2) return;
      
      const container = sliderRef.current;
      const rail = container.querySelector('.MuiSlider-rail') as HTMLElement;
      const track = container.querySelector('.MuiSlider-track') as HTMLElement;
      
      if (!rail || !track) return;
      
      // Get the two visible calculator types in sorted order
      const [firstType, secondType] = sortedVisibleTypes as [ColorMapKey, ColorMapKey];
      
      // Determine the slider point based on which calculators are visible
      let sliderPoint: number;
      
      if (firstType === 'FBM-NonGenius') {
        // If NonGenius is visible as first type, use value[0]
        sliderPoint = value[0];
      } else if (firstType === 'FBM-Genius' && secondType === 'FBE') {
        // For Genius and FBE, use value[1] but map it correctly
        // Convert from 0-100 based on value[1] 
        sliderPoint = value[1];
      } else {
        // Fallback
        sliderPoint = value[0];
      }
      
      // Get the colors for the two visible calculator types
      const firstColor = COLOR_MAP[firstType];
      const secondColor = COLOR_MAP[secondType];
      
      // Remove any previous custom elements
      removeCustomElements();
      
      // Create left section
      const leftSection = document.createElement('div');
      leftSection.className = 'left-section custom-slider-section';
      container.appendChild(leftSection);
      
      // Create right section
      const rightSection = document.createElement('div');
      rightSection.className = 'right-section custom-slider-section';
      container.appendChild(rightSection);
      
      // Style both sections
      const baseStyles = {
        position: 'absolute',
        top: '50%',
        height: '8px',
        transform: 'translateY(-50%)',
        zIndex: 1
      };
      
      // Style the left section with the first color
      Object.assign(leftSection.style, baseStyles, {
        left: '0',
        width: `${sliderPoint}%`,
        backgroundColor: firstColor,
        borderRadius: '4px 0 0 4px'
      });
      
      // Style the right section with the second color
      Object.assign(rightSection.style, baseStyles, {
        left: `${sliderPoint}%`,
        width: `${100 - sliderPoint}%`,
        backgroundColor: secondColor,
        borderRadius: '0 4px 4px 0'
      });
      
      // Make the original slider elements transparent
      rail.style.background = 'transparent';
      track.style.background = 'transparent';
      
      // Create a divider line between the sections
      const divider = document.createElement('div');
      divider.className = 'slider-divider custom-slider-section';
      container.appendChild(divider);
      
      // Style the divider
      Object.assign(divider.style, {
        position: 'absolute',
        left: `${sliderPoint}%`,
        top: '50%',
        transform: 'translate(-50%, -50%)',
        height: '12px',
        width: '2px',
        backgroundColor: '#fff',
        zIndex: '2',
        pointerEvents: 'none',
        boxShadow: '0 0 2px rgba(0,0,0,0.2)'
      });
    };
    
    // Helper function to remove custom elements
    const removeCustomElements = () => {
      if (!sliderRef.current) return;
      
      // Get all custom elements we've added
      const customElements = sliderRef.current.querySelectorAll('.custom-slider-section');
      
      // Remove each element
      customElements.forEach(element => {
        element.parentNode?.removeChild(element);
      });
      
      // Reset rail and track styles if they exist
      const rail = sliderRef.current.querySelector('.MuiSlider-rail') as HTMLElement;
      const track = sliderRef.current.querySelector('.MuiSlider-track') as HTMLElement;
      
      if (rail) rail.style.removeProperty('background');
      if (track) track.style.removeProperty('background');
    };

    return (
      <StyledSlider
        ref={combinedRef}
        value={isTwoVisibleCalculators ? currentValue : value}
        onChange={handleChange}
        valueLabelDisplay={valueLabelDisplay}
        valueLabelFormat={valueLabelFormat}
        min={0}
        max={100}
        step={0.1}
        aria-label="Distribution slider"
        marks={false}
        track={isTwoVisibleCalculators ? false : "normal"}
      />
    );
  }
);

CustomSlider.displayName = 'CustomSlider';

export default CustomSlider; 