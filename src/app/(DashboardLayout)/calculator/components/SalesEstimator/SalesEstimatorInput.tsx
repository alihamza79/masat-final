import React, { useState, useCallback, useEffect, useRef } from 'react';
import { TextField, Stack, Box } from '@mui/material';

interface SalesEstimatorInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  showLabel?: boolean;
  suffix?: string;
}

const SalesEstimatorInput: React.FC<SalesEstimatorInputProps> = React.memo(({
  label,
  value,
  onChange,
  showLabel = false,
  suffix,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [localValue, setLocalValue] = useState('');
  const previousValueRef = useRef(value);
  const changeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInternalChangeRef = useRef(false);

  // Update local value when prop value changes, but only if we're not mid-edit
  useEffect(() => {
    // If this is our own internal change, skip to avoid loops
    if (isInternalChangeRef.current) {
      return;
    }
    
    // Only update if not focused and the value has meaningfully changed
    const prevValue = previousValueRef.current;
    const valueHasChanged = Math.abs(value - prevValue) > 0.001; // Add small epsilon for float comparison
    
    if (!isFocused && valueHasChanged) {
      previousValueRef.current = value;
      
      // Format the displayed value
      if (value === 0) {
        setLocalValue('0');
      } else {
        setLocalValue(Math.round(value).toString());
      }
    }
  }, [value, isFocused]);

  // Clean up any pending timeouts on unmount
  useEffect(() => {
    return () => {
      if (changeTimeoutRef.current) {
        clearTimeout(changeTimeoutRef.current);
      }
    };
  }, []);

  // Debounced onChange to prevent rapid updates
  const debouncedOnChange = useCallback((newValue: number) => {
    // Clear any existing timeout
    if (changeTimeoutRef.current) {
      clearTimeout(changeTimeoutRef.current);
    }
    
    // Set flag to indicate this is our own change
    isInternalChangeRef.current = true;
    
    // Call onChange after a short delay
    changeTimeoutRef.current = setTimeout(() => {
      onChange(newValue);
      
      // Reset the flag after a short delay to prevent immediate feedback loops
      setTimeout(() => {
        isInternalChangeRef.current = false;
      }, 50);
    }, 50);
  }, [onChange]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Allow empty string while typing
    if (newValue === '') {
      setLocalValue('');
      return;
    }

    // Remove any non-numeric characters
    const numericValue = newValue.replace(/[^\d]/g, '');
    
    const parsedValue = parseInt(numericValue, 10);

    // Basic validation
    if (isNaN(parsedValue)) return;
    if (parsedValue < 0) return;

    // Update local value while typing
    setLocalValue(numericValue);
    
    // Only trigger onChange if value actually changed to avoid loops
    if (parsedValue !== value) {
      debouncedOnChange(parsedValue);
    }
  }, [value, debouncedOnChange]);

  // Handle focus
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    if (value === 0) {
      setLocalValue('');
    } else {
      setLocalValue(value.toString());
    }
  }, [value]);

  // Handle blur
  const handleBlur = useCallback(() => {
    setIsFocused(false);
    
    // On blur always update with the final value
    if (localValue === '' || parseFloat(localValue) === 0) {
      setLocalValue('0');
      
      // Only call onChange if the value has actually changed
      if (value !== 0) {
        debouncedOnChange(0);
      }
    } else {
      const parsedValue = parseFloat(localValue);
      // Only set new value if different from current to avoid unnecessary updates
      if (Math.abs(parsedValue - value) > 0.001) { // Use epsilon for float comparison
        const formattedValue = parsedValue.toFixed(2);
        setLocalValue(formattedValue);
        debouncedOnChange(parseFloat(formattedValue));
      }
    }
  }, [localValue, debouncedOnChange, value]);

  // Display value logic
  const displayValue = isFocused 
    ? localValue 
    : typeof value === 'number' 
      ? (value === 0 ? '0' : Math.round(value).toString()) 
      : value;

  return (
    <Stack 
      direction="row" 
      alignItems="center" 
      spacing={1} 
      sx={{
        width: '100%',
        height: '35px'
      }}
    >
      <Box sx={{ 
        width: '100%',
        height: '35px',
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        display: 'flex',
        alignItems: 'center',
        px: 1
      }}>
        <TextField
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          variant="standard"
          InputProps={{
            disableUnderline: true,
            style: {
              fontSize: '13px',
              height: '35px',
              padding: 0,
              textAlign: 'left'
            }
          }}
          sx={{
            width: suffix ? 'calc(100% - 15px)' : '100%',
            '& input': {
              textAlign: 'left',
              paddingLeft: '8px'
            }
          }}
        />
        {suffix && (
          <Box 
            component="span" 
            sx={{ 
              fontSize: '13px',
              color: 'text.secondary',
              userSelect: 'none',
              pl: 0.5,
              width: '15px'
            }}
          >
            {suffix}
          </Box>
        )}
      </Box>
    </Stack>
  );
});

SalesEstimatorInput.displayName = 'SalesEstimatorInput';

export default SalesEstimatorInput; 