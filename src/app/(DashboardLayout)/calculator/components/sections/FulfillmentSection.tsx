import React, { useState, useEffect } from 'react';
import { Box, Collapse, Stack, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Alert } from '@mui/material';
import { CategoryData, useCalculator } from '../../context/CalculatorContext';
import NumberInput from '../NumberInput';
import SectionHeader from '../SectionHeader';
import { useFulfillmentStore } from '../../store/fulfillmentStore';
import { useTranslation } from 'react-i18next';

interface FulfillmentSectionProps {
  category: string;
  data: CategoryData;
  expandedSections: Record<string, boolean>;
  formatCurrency: (value: number, includeCurrency?: boolean) => string;
  vatRate: number;
  onToggle: (category: string, section: string) => void;
  onUpdateCategory: (category: string, data: Partial<CategoryData>) => void;
}

interface DimensionsData {
  length: number | string;
  height: number | string;
  width: number | string;
  weight: number | string;
  days: number | string;
}

const FulfillmentSection: React.FC<FulfillmentSectionProps> = ({
  category,
  data,
  expandedSections,
  formatCurrency,
  vatRate,
  onToggle,
  onUpdateCategory,
}) => {
  const { t } = useTranslation();
  const { state } = useCalculator();
  const setFulfillmentHeaderValue = useFulfillmentStore((state) => state.setFulfillmentHeaderValue);
  const valueWidth = '100px';
  const [openDimensionsModal, setOpenDimensionsModal] = useState(false);
  const [dimensions, setDimensions] = useState<DimensionsData>({
    length: 0,
    height: 0,
    width: 0,
    weight: 0,
    days: 0
  });
  
  // Store the last successful dimensions used to calculate fulfillment cost
  const [lastCalculatedDimensions, setLastCalculatedDimensions] = useState<DimensionsData>({
    length: 0,
    height: 0,
    width: 0,
    weight: 0,
    days: 0
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Track focused fields to clear zeros on focus
  const [focusedFields, setFocusedFields] = useState({
    length: false,
    height: false,
    width: false,
    weight: false,
    days: false
  });

  // For FBM-Genius, show 5 only if FBM-NonGenius fulfillmentShippingCost is greater than 0, otherwise 0
  const geniusShippingCost = state.categories['FBM-NonGenius'].fulfillmentShippingCost > 0 ? 5 : 0;

  // Calculate the header value
  const headerValue = -((category === 'FBE' 
    ? 0 
    : category === 'FBM-Genius' 
      ? geniusShippingCost 
      : data.fulfillmentShippingCost) * (1 + vatRate / 100) + 
    data.fulfillmentCost * (1 + vatRate / 100));

  // Store the header value in the Zustand store
  useEffect(() => {
    setFulfillmentHeaderValue(category, headerValue);
  }, [category, headerValue, setFulfillmentHeaderValue]);

  // Initialize dimensions from context if available
  useEffect(() => {
    if (category === 'FBE' && data.dimensions) {
      setLastCalculatedDimensions({
        length: data.dimensions.length,
        height: data.dimensions.height,
        width: data.dimensions.width,
        weight: data.dimensions.weight,
        days: data.dimensions.days
      });
    }
  }, [category, data.dimensions]);

  const handleDimensionChange = (field: keyof DimensionsData, value: string) => {
    setDimensions(prev => ({
      ...prev,
      [field]: value === '' ? '' : Number(value)
    }));
    // Clear error when user changes values
    if (error) setError(null);
  };
  
  const handleDimensionFocus = (field: keyof DimensionsData) => {
    // If the value is 0, clear it
    if (dimensions[field] === 0) {
      setDimensions(prev => ({
        ...prev,
        [field]: ''
      }));
    }
    
    // Mark this field as focused
    setFocusedFields(prev => ({
      ...prev,
      [field]: true
    }));
  };
  
  const handleDimensionBlur = (field: keyof DimensionsData) => {
    // If the field is empty, set it back to 0
    if (dimensions[field] === '') {
      setDimensions(prev => ({
        ...prev,
        [field]: 0
      }));
    }
    
    // Mark field as unfocused
    setFocusedFields(prev => ({
      ...prev,
      [field]: false
    }));
  };

  const handleShippingCostChange = (value: number) => {
    // Only update the current calculator's fulfillment shipping cost
    onUpdateCategory(category, { fulfillmentShippingCost: value });
  };

  const handleFulfillmentCostChange = (value: number) => {
    // Each calculator type should maintain its own fulfillment cost
    // but for FBM variants, we sync between them
    if (category === 'FBM-NonGenius' || category === 'FBM-Genius') {
      // Sync between FBM variants only
      onUpdateCategory('FBM-NonGenius', { fulfillmentCost: value });
      onUpdateCategory('FBM-Genius', { fulfillmentCost: value });
    } else {
      // FBE gets its own value
      onUpdateCategory(category, { fulfillmentCost: value });
    }
  };

  const handleSubmitDimensions = async () => {
    if (category === 'FBE') {
      setIsLoading(true);
      setError(null);
      try {
        // Convert any empty string values to zero before submitting
        const submissionData = {
          length: typeof dimensions.length === 'string' && dimensions.length === '' ? 0 : Number(dimensions.length),
          height: typeof dimensions.height === 'string' && dimensions.height === '' ? 0 : Number(dimensions.height),
          width: typeof dimensions.width === 'string' && dimensions.width === '' ? 0 : Number(dimensions.width),
          weight: typeof dimensions.weight === 'string' && dimensions.weight === '' ? 0 : Number(dimensions.weight),
          days: typeof dimensions.days === 'string' && dimensions.days === '' ? 0 : Number(dimensions.days)
        };
        
        const response = await fetch('/api/client/withFBE/weightCalculation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submissionData),
        });

        const result = await response.json();

        if (result.status) {
          // Round to 2 decimal places
          const fulfillmentCost = Number(result.totalFulFilmentPrice).toFixed(2);
          
          // Store dimensions along with fulfillment cost
          onUpdateCategory(category, { 
            fulfillmentCost: Number(fulfillmentCost),
            dimensions: {
              length: submissionData.length,
              height: submissionData.height,
              width: submissionData.width,
              weight: submissionData.weight,
              days: submissionData.days
            }
          });
          
          // Store the last successful dimensions when calculation succeeds
          setLastCalculatedDimensions({
            length: submissionData.length,
            height: submissionData.height,
            width: submissionData.width,
            weight: submissionData.weight,
            days: submissionData.days
          });
          
          setOpenDimensionsModal(false);
        } else {
          // Display the error message from the API
          setError(result.message);
        }
      } catch (error) {
        console.error('Error calculating fulfillment cost:', error);
        setError('An unexpected error occurred. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleFulfillmentClick = () => {
    if (category === 'FBE') {
      // Use dimensions from context if available, otherwise use last calculated dimensions
      if (data.fulfillmentCost > 0) {
        if (data.dimensions) {
          setDimensions({
            length: data.dimensions.length,
            height: data.dimensions.height,
            width: data.dimensions.width,
            weight: data.dimensions.weight,
            days: data.dimensions.days
          });
        } else {
          setDimensions({...lastCalculatedDimensions});
        }
      } else {
        // If no fulfillment cost yet, use default zeros
        setDimensions({
          length: 0,
          height: 0,
          width: 0,
          weight: 0,
          days: 0
        });
      }
      
      // Reset focused fields
      setFocusedFields({
        length: false,
        height: false,
        width: false,
        weight: false,
        days: false
      });
      
      setOpenDimensionsModal(true);
      setError(null);
    }
  };

  return (
    <Box>
      <SectionHeader
        category={category}
        section="fulfillment"
        title={t('calculator.sections.fulfillment.title')}
        value={formatCurrency(-(
          (category === 'FBE' ? 0 : category === 'FBM-Genius' ? geniusShippingCost : data.fulfillmentShippingCost) * (1 + vatRate / 100) + 
          data.fulfillmentCost * (1 + vatRate / 100)
        ), true)}
        expandedSections={expandedSections}
        onToggle={() => onToggle(category, 'fulfillment')}
        isExpanded={expandedSections.fulfillment}
      />
      <Collapse in={expandedSections.fulfillment}>
        <Box sx={{ 
          px: { xs: 1, sm: 1.5, md: 2 },
          py: { xs: 0.5, sm: 1 }
        }}>
          <Stack spacing={1.5}>
            {/* Cost of shipping to customer */}
            {category === 'FBM-NonGenius' ? (
              <Stack 
                direction="row" 
                alignItems="center" 
                justifyContent="space-between"
                sx={{ position: 'relative' }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ 
                    fontWeight: 500,
                    fontSize: '13px',
                    width: '140px',
                    flex: '0 0 140px'
                  }}
                >
                  {t('calculator.sections.fulfillment.shippingCost')}
                </Typography>
                <Box sx={{ 
                  width: valueWidth
                }}>
                  <NumberInput
                    label={t('calculator.sections.fulfillment.shippingCost')}
                    value={data.fulfillmentShippingCost}
                    onChange={handleShippingCostChange}
                    showLabel={false}
                  />
                </Box>
              </Stack>
            ) : (
              <Stack 
                direction="row" 
                alignItems="center" 
                justifyContent="space-between"
                sx={{ position: 'relative' }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ 
                    fontWeight: 500,
                    fontSize: '13px',
                    width: '140px',
                    flex: '0 0 140px'
                  }}
                >
                  {t('calculator.sections.fulfillment.shippingCost')}
                </Typography>
                <Typography
                  sx={{
                    width: valueWidth,
                    textAlign: 'center',
                    fontSize: '13px',
                  }}
                >
                  {formatCurrency(category === 'FBE' ? 0 : category === 'FBM-Genius' ? geniusShippingCost : data.fulfillmentShippingCost, false)}
                </Typography>
              </Stack>
            )}
            <Stack 
              direction="row" 
              alignItems="center" 
              justifyContent="space-between"
              sx={{ position: 'relative' }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ 
                  fontWeight: 400,
                  fontSize: '11px',
                  opacity: 0.75,
                  width: '140px',
                  flex: '0 0 140px'
                }}
              >
                {t('calculator.sections.sales.withVAT')}
              </Typography>
              <Typography
                sx={{
                  width: valueWidth,
                  textAlign: 'center',
                  fontSize: '11px',
                  color: 'text.secondary',
                  opacity: 0.75
                }}
              >
                {formatCurrency((category === 'FBE' ? 0 : category === 'FBM-Genius' ? geniusShippingCost : data.fulfillmentShippingCost) * (1 + vatRate / 100), false)}
              </Typography>
            </Stack>

            {/* Fulfillment cost */}
            <Stack spacing={1}>
              <Stack 
                direction="row" 
                alignItems="center" 
                justifyContent="space-between"
                sx={{ position: 'relative' }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ 
                    fontWeight: 500,
                    fontSize: '13px',
                    width: '140px',
                    flex: '0 0 140px'
                  }}
                >
                  {t('calculator.sections.fulfillment.fulfillmentCost')}
                </Typography>
                <Box sx={{ 
                  width: valueWidth
                }}>
                  {category === 'FBE' ? (
                    <Box
                      onClick={handleFulfillmentClick}
                      sx={{
                        cursor: 'pointer',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        p: 1,
                        textAlign: 'center',
                        fontSize: '13px',
                        bgcolor: 'background.paper'
                      }}
                    >
                      {formatCurrency(data.fulfillmentCost, false)}
                    </Box>
                  ) : (
                    <NumberInput
                      label={t('calculator.sections.fulfillment.fulfillmentCost')}
                      value={data.fulfillmentCost}
                      onChange={handleFulfillmentCostChange}
                      showLabel={false}
                    />
                  )}
                </Box>
              </Stack>
              <Stack 
                direction="row" 
                alignItems="center" 
                justifyContent="space-between"
                sx={{ position: 'relative' }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ 
                    fontWeight: 400,
                    fontSize: '11px',
                    opacity: 0.75,
                    width: '140px',
                    flex: '0 0 140px'
                  }}
                >
                  {t('calculator.sections.sales.withVAT')}
                </Typography>
                <Typography
                  sx={{
                    width: valueWidth,
                    textAlign: 'center',
                    fontSize: '11px',
                    color: 'text.secondary',
                    opacity: 0.75
                  }}
                >
                  {formatCurrency(data.fulfillmentCost * (1 + vatRate / 100), false)}
                </Typography>
              </Stack>
            </Stack>
          </Stack>
        </Box>
      </Collapse>

      {/* Dimensions Modal */}
      <Dialog 
        open={openDimensionsModal} 
        onClose={() => setOpenDimensionsModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('calculator.sections.fulfillment.dimensions.title')}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert 
              severity="error" 
              sx={{ mt: 2, mb: 2 }}
            >
              {error}
            </Alert>
          )}
          <Stack spacing={2} sx={{ mt: 2 }}>
            <Stack direction="row" spacing={2}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="textSecondary" mb={0.5}>
                  {t('calculator.sections.fulfillment.dimensions.length')}
                </Typography>
                <TextField
                  fullWidth
                  value={dimensions.length}
                  onChange={(e) => handleDimensionChange('length', e.target.value)}
                  onFocus={() => handleDimensionFocus('length')}
                  onBlur={() => handleDimensionBlur('length')}
                  InputProps={{
                    endAdornment: <Typography variant="caption">{t('calculator.sections.fulfillment.dimensions.cm')}</Typography>
                  }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="textSecondary" mb={0.5}>
                  {t('calculator.sections.fulfillment.dimensions.height')}
                </Typography>
                <TextField
                  fullWidth
                  value={dimensions.height}
                  onChange={(e) => handleDimensionChange('height', e.target.value)}
                  onFocus={() => handleDimensionFocus('height')}
                  onBlur={() => handleDimensionBlur('height')}
                  InputProps={{
                    endAdornment: <Typography variant="caption">{t('calculator.sections.fulfillment.dimensions.cm')}</Typography>
                  }}
                />
              </Box>
            </Stack>
            <Stack direction="row" spacing={2}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="textSecondary" mb={0.5}>
                  {t('calculator.sections.fulfillment.dimensions.width')}
                </Typography>
                <TextField
                  fullWidth
                  value={dimensions.width}
                  onChange={(e) => handleDimensionChange('width', e.target.value)}
                  onFocus={() => handleDimensionFocus('width')}
                  onBlur={() => handleDimensionBlur('width')}
                  InputProps={{
                    endAdornment: <Typography variant="caption">{t('calculator.sections.fulfillment.dimensions.cm')}</Typography>
                  }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="textSecondary" mb={0.5}>
                  {t('calculator.sections.fulfillment.dimensions.weight')}
                </Typography>
                <TextField
                  fullWidth
                  value={dimensions.weight}
                  onChange={(e) => handleDimensionChange('weight', e.target.value)}
                  onFocus={() => handleDimensionFocus('weight')}
                  onBlur={() => handleDimensionBlur('weight')}
                  InputProps={{
                    endAdornment: <Typography variant="caption">{t('calculator.sections.fulfillment.dimensions.kg')}</Typography>
                  }}
                  error={!!error && error.includes("weight")}
                />
              </Box>
            </Stack>
            <Box>
              <Typography variant="caption" color="textSecondary" mb={0.5}>
                {t('calculator.sections.fulfillment.dimensions.days')}
              </Typography>
              <TextField
                fullWidth
                value={dimensions.days}
                onChange={(e) => handleDimensionChange('days', e.target.value)}
                onFocus={() => handleDimensionFocus('days')}
                onBlur={() => handleDimensionBlur('days')}
                InputProps={{
                  endAdornment: <Typography variant="caption">{t('calculator.sections.fulfillment.dimensions.days_unit')}</Typography>
                }}
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDimensionsModal(false)} disabled={isLoading}>
            {t('calculator.sections.fulfillment.dimensions.cancel')}
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSubmitDimensions} 
            disabled={isLoading}
          >
            {isLoading ? t('calculator.sections.fulfillment.dimensions.calculating') : t('calculator.sections.fulfillment.dimensions.submit')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FulfillmentSection; 