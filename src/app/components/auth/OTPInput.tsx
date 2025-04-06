import React, { useState, useRef, useEffect } from 'react';
import { Box, TextField, styled, Theme, SxProps, useTheme } from '@mui/material';

interface OTPInputProps {
  length: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const StyledTextField = styled(TextField)(({ theme }) => ({
  width: '45px',
  '& .MuiOutlinedInput-root': {
    height: '50px',
    '& input': {
      padding: '10px 0',
      textAlign: 'center',
      fontSize: '1.2rem',
      fontWeight: 600,
    },
    '&.Mui-focused': {
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: theme.palette.primary.main,
        borderWidth: 2,
      },
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.mode === 'dark' 
        ? theme.palette.grey[700] 
        : theme.palette.grey[400],
    },
  },
  [theme.breakpoints.down('sm')]: {
    width: '40px',
    '& .MuiOutlinedInput-root': {
      height: '45px',
      '& input': {
        fontSize: '1rem',
      },
    },
  },
}));

// Define a type for the filled style
type FilledStyleType = {
  '& .MuiOutlinedInput-notchedOutline'?: {
    borderColor: string;
  };
};

const OTPInput: React.FC<OTPInputProps> = ({ 
  length = 6, 
  value, 
  onChange, 
  disabled = false 
}) => {
  const theme = useTheme();
  const [inputValues, setInputValues] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Initialize input refs
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  // Sync inputValues with external value prop
  useEffect(() => {
    if (value) {
      const valueArray = value.split('').slice(0, length);
      setInputValues([...valueArray, ...Array(length - valueArray.length).fill('')]);
    } else {
      setInputValues(Array(length).fill(''));
    }
  }, [value, length]);

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Only accept single digit numeric input
    if (!/^\d*$/.test(newValue) || newValue.length > 1) {
      return;
    }

    // Create new array with the updated value
    const newInputValues = [...inputValues];
    newInputValues[index] = newValue;
    setInputValues(newInputValues);

    // Emit combined value up to parent
    const combinedValue = newInputValues.join('');
    onChange(combinedValue);

    // Auto focus next input if a digit was entered
    if (newValue && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!inputValues[index] && index > 0) {
        // Move focus to previous input if current is empty and backspace is pressed
        const newInputValues = [...inputValues];
        newInputValues[index - 1] = '';
        setInputValues(newInputValues);
        
        // Update the combined value
        onChange(newInputValues.join(''));
        
        // Move focus back
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle paste event
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').trim();
    
    // Filter only numeric characters
    const numericValue = pastedData.replace(/[^\d]/g, '').substring(0, length);
    
    if (numericValue) {
      const newInputValues = [...Array(length).fill('')];
      
      // Fill with pasted values
      numericValue.split('').forEach((char, idx) => {
        if (idx < length) {
          newInputValues[idx] = char;
        }
      });
      
      setInputValues(newInputValues);
      onChange(newInputValues.join(''));

      // Focus last filled input or the next empty one
      const focusIndex = Math.min(numericValue.length, length - 1);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  // Check if code is complete
  const isCodeComplete = value.length === length;

  // Get filled style based on whether code is complete
  const filledStyle: FilledStyleType = isCodeComplete ? {
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.success.main,
    }
  } : {};

  return (
    <Box 
      sx={{
        display: 'flex',
        justifyContent: 'center',
        gap: { xs: 1, sm: 2 },
        my: 2
      }}
      onPaste={handlePaste}
    >
      {Array.from({ length }, (_, index) => (
        <StyledTextField
          key={index}
          inputRef={(el) => (inputRefs.current[index] = el)}
          value={inputValues[index]}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(index, e)}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => handleKeyDown(index, e)}
          disabled={disabled}
          variant="outlined"
          autoComplete="off"
          inputProps={{
            maxLength: 1,
            inputMode: 'numeric',
            pattern: '[0-9]*',
            style: { textAlign: 'center' }
          }}
          sx={filledStyle}
        />
      ))}
    </Box>
  );
};

export default OTPInput; 