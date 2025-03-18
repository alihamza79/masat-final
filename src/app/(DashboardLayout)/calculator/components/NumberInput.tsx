import React from 'react';
import {
  TextField,
  InputAdornment,
  Tooltip,
  Stack,
  Typography,
  TextFieldProps,
  Box,
  SxProps,
  Theme
} from '@mui/material';
import { IconInfoCircle } from '@tabler/icons-react';

interface NumberInputProps extends Omit<TextFieldProps, 'onChange'> {
  label: string;
  value: number | string;
  onChange: (value: number) => void;
  tooltip?: string;
  suffix?: string;
  min?: number;
  max?: number;
  decimals?: number;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  showLabel?: boolean;
  textAlign?: 'left' | 'center' | 'right';
  sx?: SxProps<Theme>;
  disabled?: boolean;
}

const NumberInput = React.memo(({
  label,
  value,
  onChange,
  tooltip,
  suffix,
  min = 0,
  max,
  decimals = 2,
  required = false,
  error = false,
  helperText,
  showLabel = true,
  textAlign = 'center',
  sx,
  disabled = false,
  ...props
}: NumberInputProps) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const [localValue, setLocalValue] = React.useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Allow empty string while typing
    if (newValue === '') {
      setLocalValue('');
      return;
    }

    // Remove any non-numeric characters except decimal point and minus
    const numericValue = newValue.replace(/[^\d.-]/g, '');
    
    // Ensure only one decimal point
    const parts = numericValue.split('.');
    if (parts.length > 2) return;
    
    // Limit decimal places to 2
    if (parts[1] && parts[1].length > 2) return;
    
    const parsedValue = parseFloat(numericValue);

    // Basic validation
    if (isNaN(parsedValue)) return;
    if (min !== undefined && parsedValue < min) return;
    if (max !== undefined && parsedValue > max) return;

    // Update local value while typing
    setLocalValue(numericValue);
    // Only round values when we have more than 2 decimal places
    if (parts[1] && parts[1].length === 2) {
      onChange(parsedValue);
    } else {
      onChange(parsedValue);
    }
  };

  // Handle focus
  const handleFocus = () => {
    setIsFocused(true);
    if (value === 0) {
      setLocalValue('');
    } else {
      // Format value to exactly 2 decimal places if it's a VAT field
      if (label.toLowerCase().includes('vat')) {
        setLocalValue(typeof value === 'number' ? value.toFixed(2) : value.toString());
      } else {
        setLocalValue(value.toString());
      }
    }
  };

  // Handle blur
  const handleBlur = () => {
    setIsFocused(false);
    if (localValue === '' || parseFloat(localValue) === 0) {
      setLocalValue('0');
      onChange(0);
    } else {
      const parsedValue = parseFloat(localValue);
      // Always round to 2 decimal places on blur
      const formattedValue = parsedValue.toFixed(2);
      setLocalValue(formattedValue);
      onChange(parseFloat(formattedValue));
    }
  };

  // Display value logic
  const displayValue = isFocused 
    ? localValue 
    : typeof value === 'number'
      ? (label.toLowerCase().includes('vat') || label.toLowerCase().includes('with vat') ? value.toFixed(2) : (value === 0 ? '0' : value.toFixed(2)))
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
      {showLabel && (
        <Stack 
          direction="row" 
          spacing={0.5} 
          alignItems="center"
          sx={{
            minWidth: '180px',
            flex: '0 0 180px'
          }}
        >
          <Typography
            variant="body2"
            color="textSecondary"
            sx={{ 
              fontWeight: 500,
              fontSize: '13px',
              lineHeight: '35px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {label}
            {required && <span style={{ color: 'error.main' }}> *</span>}
          </Typography>
          {tooltip && (
            <Tooltip title={tooltip}>
              <IconInfoCircle size={14} style={{ flexShrink: 0 }} />
            </Tooltip>
          )}
        </Stack>
      )}
      {showLabel && <Box sx={{ flex: 1 }} />}
      <Stack 
        direction="row" 
        alignItems="center" 
        spacing={0}
        sx={{
          width: showLabel ? '100px' : '100%',
          flex: showLabel ? '0 0 100px' : 1,
          height: '35px',
          bgcolor: disabled ? 'transparent' : 'background.paper',
          border: disabled ? 'none' : '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          px: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...(sx as any)
        }}
      >
        <TextField
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          size="small"
          inputProps={{
            style: {
              textAlign,
              padding: 0,
              width: suffix ? '55px' : '65px',
              height: '35px'
            }
          }}
          sx={{ 
            '& .MuiOutlinedInput-root': {
              height: '35px',
              fontSize: '13px',
              border: 'none',
              '& fieldset': {
                border: 'none'
              },
              '& input': {
                textAlign: textAlign,
                color: 'text.primary'
              }
            },
            '& .Mui-disabled': {
              color: 'text.primary',
              WebkitTextFillColor: 'currentcolor'
            }
          }}
          disabled={disabled}
        />
        {suffix && (
          <Typography 
            sx={{ 
              fontSize: '13px',
              color: 'text.secondary',
              userSelect: 'none',
              pl: 0.5,
              lineHeight: '35px',
              width: '15px'
            }}
          >
            {suffix}
          </Typography>
        )}
      </Stack>
    </Stack>
  );
});

NumberInput.displayName = 'NumberInput';

export default NumberInput; 