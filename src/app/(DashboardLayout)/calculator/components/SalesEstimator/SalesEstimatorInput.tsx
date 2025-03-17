import React from 'react';
import { TextField, Stack, Box } from '@mui/material';

interface SalesEstimatorInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  showLabel?: boolean;
  suffix?: string;
}

const SalesEstimatorInput: React.FC<SalesEstimatorInputProps> = ({
  label,
  value,
  onChange,
  showLabel = false,
  suffix,
  ...props
}) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const [localValue, setLocalValue] = React.useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    onChange(parsedValue);
  };

  // Handle focus
  const handleFocus = () => {
    setIsFocused(true);
    if (value === 0) {
      setLocalValue('');
    } else {
      setLocalValue(value.toString());
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
      const formattedValue = parsedValue.toFixed(2);
      setLocalValue(formattedValue);
      onChange(parseFloat(formattedValue));
    }
  };

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
};

export default SalesEstimatorInput; 