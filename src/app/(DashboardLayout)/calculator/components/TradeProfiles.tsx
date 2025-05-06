'use client';
import CustomSelect from '@/app/components/forms/theme-elements/CustomSelect';
import CustomTextField from '@/app/components/forms/theme-elements/CustomTextField';
import { useUserProfile } from '@/hooks/useUserProfile';
import {
  Box,
  CircularProgress,
  InputAdornment,
  MenuItem,
  SelectChangeEvent,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography
} from '@mui/material';
import { IconInfoCircle } from '@tabler/icons-react';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useCalculator } from '../context/CalculatorContext';
import { useCommissionLoading } from '../context/CommissionLoadingContext';

const TradeProfiles = () => {
  const { t } = useTranslation();
  const { state, dispatch } = useCalculator();
  const { isLoading: commissionLoading } = useCommissionLoading();
  const { userData, companyData } = useUserProfile();

  // State for form values
  const [profileType, setProfileType] = React.useState(state.profileType);
  const [vatRateFromSale, setVatRateFromSale] = React.useState(state.vatRate.toString());
  const [emagCommission, setEmagCommission] = React.useState(state.emagCommission);
  const [taxRate, setTaxRate] = React.useState(state.taxRate.toString());
  const [purchaseType, setPurchaseType] = React.useState(state.purchaseType);
  const [vatRateOfPurchase, setVatRateOfPurchase] = React.useState(state.vatRateOfPurchase);
  const [isEmagProductSelected, setIsEmagProductSelected] = React.useState(false);
  const [commissionSource, setCommissionSource] = React.useState<'default' | 'emag' | 'manual'>('default');

  // Initialize tax rate and VAT profile from user settings
  useEffect(() => {
    if (companyData) {
      // Update tax rate if company has taxRate set
      if (companyData.taxRate !== undefined) {
        const companyTaxRate = companyData.taxRate.toString();
        setTaxRate(companyTaxRate);
        dispatch({ type: 'SET_TAX_RATE', payload: Number(companyTaxRate) });
      }

      // Update profile type based on company's VAT payer status
      if (companyData.isVatPayer !== undefined) {
        const newProfileType = companyData.isVatPayer ? 'vat' : 'profile';
        setProfileType(newProfileType);
        dispatch({ type: 'SET_PROFILE_TYPE', payload: newProfileType });
      }
    }
  }, [companyData, dispatch]);

  // Sync local state with context state
  useEffect(() => {
    setProfileType(state.profileType);
    setVatRateFromSale(state.vatRate.toString());
    setEmagCommission(state.emagCommission);
    setTaxRate(state.taxRate.toString());
    setPurchaseType(state.purchaseType);
    setVatRateOfPurchase(state.vatRateOfPurchase);
    
    // Use the commission source directly from the state to determine if the field should be disabled
    setIsEmagProductSelected(state.commissionSource === 'emag');
  }, [state.profileType, state.vatRate, state.emagCommission, state.taxRate, state.purchaseType, state.vatRateOfPurchase, state.commissionSource]);

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
      // When the user manually changes the commission, mark it as manual source
      dispatch({ type: 'SET_EMAG_COMMISSION', payload: value });
      dispatch({ type: 'SET_COMMISSION_SOURCE', payload: 'manual' });
      
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
      setProfileType(value as 'profile' | 'vat');
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
        {t('calculator.tradeProfile.title')}
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
                {t('calculator.tradeProfile.profileType')}
              </Typography>
              <Tooltip title={t('calculator.tradeProfile.profileTypeTooltip')}>
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
                {t('calculator.tradeProfile.sellerProfile')}
              </ToggleButton>
              <ToggleButton value="vat">
                {t('calculator.tradeProfile.vatProfile')}
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
                {t('calculator.tradeProfile.commission')}
              </Typography>
              <Tooltip title={isEmagProductSelected 
                ? t('calculator.tradeProfile.commissionLockedTooltip') || "Commission rate is locked because it's calculated based on the selected eMAG product"
                : t('calculator.tradeProfile.commissionTooltip')
              }>
                <IconInfoCircle size={14} />
              </Tooltip>
            </Stack>
            <CustomTextField
              value={emagCommission}
              onChange={handleCommissionChange}
              fullWidth
              type="number"
              disabled={isEmagProductSelected}
              inputProps={{
                min: 0,
                max: 100,
                step: "0.1",
                style: { 
                  textAlign: 'left', 
                  paddingLeft: '10px',
                  backgroundColor: isEmagProductSelected ? 'rgba(0, 0, 0, 0.04)' : 'transparent'
                }
              }}
              sx={{
                ...textFieldStyles,
                '& .Mui-disabled': {
                  color: 'text.primary', 
                  WebkitTextFillColor: 'unset',
                  opacity: 0.8,
                  cursor: 'not-allowed'
                },
                ...(isEmagProductSelected && {
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderStyle: 'dashed',
                      borderColor: 'primary.main'
                    }
                  }
                })
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end" sx={{ mr: 0.5 }}>
                    {commissionLoading ? (
                      <CircularProgress size={16} thickness={5} color="inherit" />
                    ) : (
                      <Typography variant="caption" color="textSecondary">%</Typography>
                    )}
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
                {t('calculator.tradeProfile.vatRateFromSale')}
              </Typography>
              <Tooltip title={t('calculator.tradeProfile.vatRateFromSaleTooltip')}>
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
                {t('calculator.tradeProfile.taxRate')}
              </Typography>
              <Tooltip title={t('calculator.tradeProfile.taxRateTooltip')}>
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
                {t('calculator.tradeProfile.purchaseType')}
              </Typography>
              <Tooltip title={t('calculator.tradeProfile.purchaseTypeTooltip')}>
                <IconInfoCircle size={14} />
              </Tooltip>
            </Stack>
            <CustomSelect
              value={purchaseType}
              onChange={handlePurchaseTypeChange}
              fullWidth
              sx={selectStyles}
            >
              <MenuItem value="romania">{t('calculator.tradeProfile.fromRomania')}</MenuItem>
              <MenuItem value="china">{t('calculator.tradeProfile.fromChina')}</MenuItem>
              <MenuItem value="europe">{t('calculator.tradeProfile.fromEurope')}</MenuItem>
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
                {t('calculator.tradeProfile.purchaseVAT')}
              </Typography>
              <Tooltip title={t('calculator.tradeProfile.purchaseVATTooltip')}>
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
                <MenuItem value="customs">{t('calculator.tradeProfile.customCalculation')}</MenuItem>
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