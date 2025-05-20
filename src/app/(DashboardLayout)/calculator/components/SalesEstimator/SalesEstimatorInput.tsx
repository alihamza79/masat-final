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
  const isInternalChangeRef = useRef(false);
  const userEnteredValueRef = useRef<string | null>(null);

  // Update local value when prop value changes
  useEffect(() => {
    // If this is our own internal change, skip to avoid loops
    if (isInternalChangeRef.current) {
      return;
    }
    
    // Only update if not focused or if the value has meaningfully changed
    const prevValue = previousValueRef.current;
    const valueHasChanged = value !== prevValue; 
    
    if (!isFocused && valueHasChanged) {
      previousValueRef.current = value;
      
      // Format the displayed value
      if (value === 0) {
        setLocalValue('0');
      } else {
        setLocalValue(value.toString());
      }
      
      // Update user entered value to match
      userEnteredValueRef.current = value.toString();
    }
  }, [value, isFocused]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Allow empty string while typing
    if (newValue === '') {
      setLocalValue('');
      userEnteredValueRef.current = '';
      return;
    }

    // Remove any non-numeric characters
    const numericValue = newValue.replace(/[^\d]/g, '');
    
    const parsedValue = parseInt(numericValue, 10);

    // Basic validation
    if (isNaN(parsedValue)) return;
    if (parsedValue < 0) return;

    // Update local value while typing - EXACTLY as entered
    setLocalValue(numericValue);
    
    // Store the user entered value
    userEnteredValueRef.current = numericValue;
    
    // Set flag to indicate this is our own change
    isInternalChangeRef.current = true;
    
    // Immediately notify parent of change without delay
    onChange(parsedValue);
    
    // Reset flag immediately to allow quick consecutive updates
    isInternalChangeRef.current = false;
    
  }, [onChange]);

  // Handle focus
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    
    // When focused, always show the exact value
    if (userEnteredValueRef.current !== null) {
      setLocalValue(userEnteredValueRef.current);
    } else if (value === 0) {
      setLocalValue('');
    } else {
      setLocalValue(value.toString());
    }
  }, [value]);

  // Handle blur
  const handleBlur = useCallback(() => {
    setIsFocused(false);
    
    // On blur always update with the final value immediately
    if (localValue === '' || parseFloat(localValue) === 0) {
      setLocalValue('0');
      userEnteredValueRef.current = '0';
      
      // Call onChange directly
      if (value !== 0) {
        isInternalChangeRef.current = true;
        onChange(0);
        isInternalChangeRef.current = false;
      }
    } else {
      const parsedValue = parseInt(localValue, 10);
      
      // Ensure value is valid
      if (isNaN(parsedValue) || parsedValue < 0) {
        // Revert to previous valid value
        setLocalValue(value.toString());
        userEnteredValueRef.current = value.toString();
        return;
      }
      
      // Only set new value if different from current to avoid unnecessary updates
      if (parsedValue !== value) {
        setLocalValue(parsedValue.toString());
        userEnteredValueRef.current = parsedValue.toString();
        
        isInternalChangeRef.current = true;
        onChange(parsedValue);
        isInternalChangeRef.current = false;
      }
    }
  }, [localValue, onChange, value]);
  
  // Handle key press - add immediate update on Enter key
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      // If Enter is pressed, update immediately
      if (localValue === '' || parseFloat(localValue) === 0) {
        setLocalValue('0');
        userEnteredValueRef.current = '0';
        
        isInternalChangeRef.current = true;
        onChange(0);
        isInternalChangeRef.current = false;
      } else {
        const parsedValue = parseInt(localValue, 10);
        
        // Ensure value is valid
        if (isNaN(parsedValue) || parsedValue < 0) {
          // Revert to previous valid value
          setLocalValue(value.toString());
          userEnteredValueRef.current = value.toString();
          return;
        }
        
        if (parsedValue !== value) {
          setLocalValue(parsedValue.toString());
          userEnteredValueRef.current = parsedValue.toString();
          
          isInternalChangeRef.current = true;
          onChange(parsedValue);
          isInternalChangeRef.current = false;
        }
      }
      
      // Remove focus from input
      (e.target as HTMLElement).blur();
    }
  }, [localValue, onChange, value]);

  // Display value logic - never round the value, use exact values
  const displayValue = isFocused 
    ? localValue 
    : userEnteredValueRef.current !== null
      ? userEnteredValueRef.current
      : typeof value === 'number' 
        ? (value === 0 ? '0' : value.toString()) 
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
          onKeyPress={handleKeyPress}
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