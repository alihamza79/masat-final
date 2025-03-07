'use client';
import React from 'react';
import {
  Box,
  Stack,
  Typography,
  MenuItem,
  InputAdornment,
  IconButton,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  SelectChangeEvent,
} from '@mui/material';
import CustomSelect from '@/app/components/forms/theme-elements/CustomSelect';
import CustomTextField from '@/app/components/forms/theme-elements/CustomTextField';
import { IconShoppingCart, IconInfoCircle } from '@tabler/icons-react';
import { useCalculator } from '../context/CalculatorContext';

const TradeProfiles = () => {
  const { state, dispatch } = useCalculator();

  // State for form values
  const [profileType, setProfileType] = React.useState('profile');
  const [vatRateFromSale, setVatRateFromSale] = React.useState('19');
  const [emagCommission, setEmagCommission] = React.useState('20');
  const [taxRate, setTaxRate] = React.useState('3');
  const [purchaseType, setPurchaseType] = React.useState('romania');
  const [vatRateOfPurchase, setVatRateOfPurchase] = React.useState('19');

  // Handle changes and update calculator
  const handleVatRateChange = (e: SelectChangeEvent<unknown>) => {
    const value = e.target.value as string;
    setVatRateFromSale(value);
    dispatch({ type: 'SET_VAT_RATE', payload: Number(value) });
  };

  const handleTaxRateChange = (e: SelectChangeEvent<unknown>) => {
    const value = e.target.value as string;
    setTaxRate(value);
    dispatch({ type: 'SET_TAX_RATE', payload: Number(value) });
  };

  const handleCommissionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and validate range
    if (value === '' || (Number(value) >= 0 && Number(value) <= 100)) {
      setEmagCommission(value);
      // Update commission for all categories if value is not empty
      if (value !== '') {
        Object.keys(state.categories).forEach((category) => {
          dispatch({
            type: 'UPDATE_CATEGORY',
            payload: {
              category: category as keyof typeof state.categories,
              data: { commission: Number(value) },
            },
          });
        });
      }
    }
  };

  const handleProfileTypeChange = (e: React.MouseEvent<HTMLElement>, value: string | null) => {
    if (value) {
      setProfileType(value);
      dispatch({ type: 'SET_PROFILE_TYPE', payload: value as 'profile' | 'vat' });
    }
  };

  const handlePurchaseTypeChange = (e: SelectChangeEvent<unknown>) => {
    const value = e.target.value as string;
    setPurchaseType(value);
    dispatch({ type: 'SET_PURCHASE_TYPE', payload: value });
    if (value === 'china') {
      setVatRateOfPurchase('customs');
      dispatch({ type: 'SET_VAT_RATE_OF_PURCHASE', payload: 'customs' });
    } else {
      setVatRateOfPurchase('19');
      dispatch({ type: 'SET_VAT_RATE_OF_PURCHASE', payload: '19' });
    }
  };

  const handleVatRateOfPurchaseChange = (e: SelectChangeEvent<unknown>) => {
    const value = e.target.value as string;
    setVatRateOfPurchase(value);
    dispatch({ type: 'SET_VAT_RATE_OF_PURCHASE', payload: value });
  };

  // Common styles for consistent height
  const selectStyles = {
    '& .MuiSelect-select': { 
      py: 1,
      height: '18px',
      lineHeight: '18px'
    },
    '& .MuiOutlinedInput-root': {
      height: '36px'
    }
  };

  const textFieldStyles = {
    '& .MuiOutlinedInput-root': { 
      height: '36px',
      '& input': { 
        py: 0,
        height: '18px',
        lineHeight: '18px'
      }
    }
  };

  const toggleButtonStyles = {
    '& .MuiToggleButtonGroup-grouped': {
      margin: 0,
      border: '1px solid',
      borderColor: 'divider',
      '&:not(:first-of-type)': {
        borderLeft: '1px solid',
        borderLeftColor: 'divider',
        marginLeft: 0,
      },
      '&:first-of-type': {
        borderTopLeftRadius: '6px',
        borderBottomLeftRadius: '6px',
      },
      '&:last-of-type': {
        borderTopRightRadius: '6px',
        borderBottomRightRadius: '6px',
      },
      fontSize: '13px',
      '&.Mui-selected': {
        backgroundColor: 'primary.main',
        color: 'white',
        '&:hover': {
          backgroundColor: 'primary.dark',
        },
      },
      '&:hover': {
        backgroundColor: 'primary.lighter',
      },
      px: 2,
      py: 0.75,
    },
  };

  return (
    <Box>
      {/* Header Row */}
      <Typography 
        variant="h5" 
        sx={{ 
          fontSize: '24px',
          fontWeight: 600,
          color: 'text.primary',
          mb: 3
        }}
      >
        Trade Profile
      </Typography>

      {/* Controls Row */}
      <Stack 
        spacing={3}
        mb={3}
      >
        {/* Top Row - Profile Toggle and Commission */}
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={3}
          alignItems={{ xs: 'stretch', sm: 'flex-end' }}
        >
          {/* Profile Type Toggle */}
          <Box sx={{ width: { xs: '100%', sm: 'auto' } }}>
            <Stack direction="row" spacing={0.5} alignItems="center" mb={0.5}>
              <Typography 
                variant="caption" 
                color="textSecondary"
                sx={{ fontSize: { xs: '11px', sm: '12px' } }}
              >
                Profile Type
              </Typography>
              <Tooltip title="Select your business profile type">
                <IconInfoCircle size={14} />
              </Tooltip>
            </Stack>
            <ToggleButtonGroup
              value={profileType}
              exclusive
              onChange={handleProfileTypeChange}
              sx={{
                width: { xs: '100%', sm: 'auto' },
                ...toggleButtonStyles,
                height: '36px',
                '& .MuiToggleButtonGroup-grouped': {
                  flex: { xs: 1, sm: 'initial' },
                  ...toggleButtonStyles['& .MuiToggleButtonGroup-grouped']
                }
              }}
            >
              <ToggleButton value="profile">
                Seller Profile
              </ToggleButton>
              <ToggleButton value="vat">
                VAT Profile
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Commission Input */}
          <Box sx={{ width: { xs: '100%', sm: '200px' } }}>
            <Stack direction="row" spacing={0.5} alignItems="center" mb={0.5}>
              <Typography 
                variant="caption" 
                color="textSecondary"
                sx={{ fontSize: { xs: '11px', sm: '12px' } }}
              >
                Commission + VAT
              </Typography>
              <Tooltip title="eMAG commission including VAT">
                <IconInfoCircle size={14} />
              </Tooltip>
            </Stack>
            <CustomTextField
              value={emagCommission}
              onChange={handleCommissionChange}
              fullWidth
              type="number"
              inputProps={{
                min: 0,
                max: 100,
                step: "0.1",
                style: { textAlign: 'left', paddingLeft: '10px' }
              }}
              sx={textFieldStyles}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end" sx={{ mr: 0.5 }}>
                    <Typography variant="caption" color="textSecondary">%</Typography>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </Stack>

        {/* Settings Grid - Paired fields for mobile */}
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, 1fr)',
            sm: 'repeat(2, 1fr)',
            lg: 'repeat(4, 1fr)'
          },
          gap: { xs: 2, sm: 1.5 }
        }}>
          {/* VAT Rate From Sale */}
          <Box>
            <Stack direction="row" spacing={0.5} alignItems="center" mb={0.5}>
              <Typography 
                variant="caption" 
                color="textSecondary"
                sx={{ fontSize: { xs: '11px', sm: '12px' } }}
              >
                VAT Rate From Sale
              </Typography>
              <Tooltip title="VAT rate applied to your sales">
                <IconInfoCircle size={14} />
              </Tooltip>
            </Stack>
            <CustomSelect
              value={vatRateFromSale}
              onChange={handleVatRateChange}
              fullWidth
              sx={selectStyles}
            >
              <MenuItem value="19">19%</MenuItem>
              <MenuItem value="5">5%</MenuItem>
              <MenuItem value="0">0%</MenuItem>
            </CustomSelect>
          </Box>

          {/* Tax Rate */}
          <Box>
            <Stack direction="row" spacing={0.5} alignItems="center" mb={0.5}>
              <Typography 
                variant="caption" 
                color="textSecondary"
                sx={{ fontSize: { xs: '11px', sm: '12px' } }}
              >
                Tax Rate
              </Typography>
              <Tooltip title="Business tax rate category">
                <IconInfoCircle size={14} />
              </Tooltip>
            </Stack>
            <CustomSelect
              value={taxRate}
              onChange={handleTaxRateChange}
              fullWidth
              sx={selectStyles}
            >
              <MenuItem value="1">1%</MenuItem>
              <MenuItem value="3">3%</MenuItem>
              <MenuItem value="16">16%</MenuItem>
            </CustomSelect>
          </Box>

          {/* Purchase Type */}
          <Box>
            <Stack direction="row" spacing={0.5} alignItems="center" mb={0.5}>
              <Typography 
                variant="caption" 
                color="textSecondary"
                sx={{ fontSize: { xs: '11px', sm: '12px' } }}
              >
                Purchase Type
              </Typography>
              <Tooltip title="Source of your purchases">
                <IconInfoCircle size={14} />
              </Tooltip>
            </Stack>
            <CustomSelect
              value={purchaseType}
              onChange={handlePurchaseTypeChange}
              fullWidth
              sx={selectStyles}
            >
              <MenuItem value="romania">From Romania</MenuItem>
              <MenuItem value="china">From China</MenuItem>
              <MenuItem value="europe">From Europe</MenuItem>
            </CustomSelect>
          </Box>

          {/* Purchase VAT */}
          <Box>
            <Stack direction="row" spacing={0.5} alignItems="center" mb={0.5}>
              <Typography 
                variant="caption" 
                color="textSecondary"
                sx={{ fontSize: { xs: '11px', sm: '12px' } }}
              >
                Purchase VAT
              </Typography>
              <Tooltip title="VAT rate for your purchases">
                <IconInfoCircle size={14} />
              </Tooltip>
            </Stack>
            <CustomSelect
              value={vatRateOfPurchase}
              onChange={handleVatRateOfPurchaseChange}
              fullWidth
              sx={selectStyles}
              disabled={purchaseType === 'china'}
            >
              {purchaseType === 'china' ? (
                <MenuItem value="customs">Custom Calculation</MenuItem>
              ) : (
                [
                  <MenuItem key="19" value="19">19%</MenuItem>,
                  <MenuItem key="0" value="0">0%</MenuItem>
                ]
              )}
            </CustomSelect>
          </Box>
        </Box>
      </Stack>
    </Box>
  );
};

export default TradeProfiles; 