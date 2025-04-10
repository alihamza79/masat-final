import React, { useState, useRef, useEffect } from 'react';
import { Box, TextField, styled } from '@mui/material';

interface OTPInputProps {
  length: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const StyledTextField = styled(TextField)(({ theme }) => ({
  width: '3rem',
  height: '3rem',
  margin: '0 0.5rem',
  borderRadius: theme.shape.borderRadius,
  '& .MuiOutlinedInput-root': {
    height: '100%',
    borderRadius: theme.shape.borderRadius,
  },
  '& .MuiInputBase-input': {
    textAlign: 'center',
    fontSize: '1.5rem',
    padding: 0,
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  [theme.breakpoints.down('sm')]: {
    width: '2.5rem',
    height: '2.5rem',
    margin: '0 0.25rem',
    '& .MuiInputBase-input': {
      fontSize: '1.25rem',
    },
  },
}));

const OTPInput: React.FC<OTPInputProps> = ({ length, value, onChange, disabled = false }) => {
  const [otp, setOtp] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Initialize refs array
  useEffect(() => {
    inputRefs.current = Array(length).fill(null).map((_, i) => inputRefs.current[i] || null);
  }, [length]);

  // Update OTP state when value prop changes
  useEffect(() => {
    if (value) {
      const otpArray = value.split('').slice(0, length);
      setOtp([...otpArray, ...Array(length - otpArray.length).fill('')]);
    } else {
      setOtp(Array(length).fill(''));
    }
  }, [value, length]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const newValue = e.target.value;
    
    // Only allow one digit
    if (!/^\d*$/.test(newValue)) return;
    
    // Update OTP array
    const newOtp = [...otp];
    newOtp[index] = newValue.slice(-1);
    setOtp(newOtp);
    
    // Update parent value
    onChange(newOtp.join(''));
    
    // Move focus to next input if current is filled
    if (newValue && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    // Move focus to previous input on backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    
    // Allow arrow key navigation
    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    }
    
    if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };
  
  // Handle paste event (e.g., pasting the whole OTP)
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text/plain').trim();
    
    // Only allow digits
    if (!/^\d*$/.test(pasteData)) return;
    
    const digitsArray = pasteData.split('').slice(0, length);
    const newOtp = [...Array(length).fill('')];
    
    digitsArray.forEach((digit, i) => {
      newOtp[i] = digit;
    });
    
    setOtp(newOtp);
    onChange(newOtp.join(''));
    
    // Focus the next empty input or the last input if all filled
    const nextEmptyIndex = newOtp.findIndex(v => !v);
    if (nextEmptyIndex !== -1) {
      inputRefs.current[nextEmptyIndex]?.focus();
    } else if (digitsArray.length > 0) {
      inputRefs.current[length - 1]?.focus();
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        my: 2,
        width: '100%',
      }}
    >
      {Array.from({ length }, (_, i) => (
        <StyledTextField
          key={i}
          inputRef={(el) => (inputRefs.current[i] = el)}
          value={otp[i] || ''}
          onChange={(e) => handleChange(e as React.ChangeEvent<HTMLInputElement>, i)}
          onKeyDown={(e) => handleKeyDown(e as React.KeyboardEvent<HTMLInputElement>, i)}
          onPaste={handlePaste}
          variant="outlined"
          disabled={disabled}
          inputProps={{
            maxLength: 1,
            inputMode: 'numeric',
            pattern: '[0-9]*',
            autoComplete: 'one-time-code',
          }}
        />
      ))}
    </Box>
  );
};

export default OTPInput; 