import React, { useState, useEffect } from 'react';
import { Box, Collapse, Stack, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Alert } from '@mui/material';
import { CategoryData, useCalculator } from '../../context/CalculatorContext';
import NumberInput from '../NumberInput';
import SectionHeader from '../SectionHeader';
import { useFulfillmentStore } from '../../store/fulfillmentStore';

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
  length: number;
  height: number;
  width: number;
  weight: number;
  days: number;
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
  const { state } = useCalculator();
  const setFulfillmentHeaderValue = useFulfillmentStore((state) => state.setFulfillmentHeaderValue);
  const valueWidth = '80px';
  const [openDimensionsModal, setOpenDimensionsModal] = useState(false);
  const [dimensions, setDimensions] = useState<DimensionsData>({
    length: 30,
    height: 20,
    width: 10,
    weight: 1,
    days: 30
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleDimensionChange = (field: keyof DimensionsData, value: string) => {
    setDimensions(prev => ({
      ...prev,
      [field]: Number(value)
    }));
    // Clear error when user changes values
    if (error) setError(null);
  };

  const handleShippingCostChange = (value: number) => {
    // Only update the current calculator's fulfillment shipping cost
    onUpdateCategory(category, { fulfillmentShippingCost: value });
  };

  const handleFulfillmentCostChange = (value: number) => {
    // Only sync between FBM-NonGenius and FBM-Genius
    if (category === 'FBM-NonGenius' || category === 'FBM-Genius') {
      onUpdateCategory('FBM-NonGenius', { fulfillmentCost: value });
      onUpdateCategory('FBM-Genius', { fulfillmentCost: value });
    } else {
      onUpdateCategory(category, { fulfillmentCost: value });
    }
  };

  const handleSubmitDimensions = async () => {
    if (category === 'FBE') {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/client/withFBE/weightCalculation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dimensions),
        });

        const result = await response.json();

        if (result.status) {
          // Round to 2 decimal places
          const fulfillmentCost = Number(result.totalFulFilmentPrice).toFixed(2);
          onUpdateCategory(category, { fulfillmentCost: Number(fulfillmentCost) });
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
      setOpenDimensionsModal(true);
      setError(null);
    }
  };

  return (
    <Box>
      <SectionHeader
        category={category}
        section="fulfillment"
        title="Fulfillment"
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
                  Cost of shipping to customer
                </Typography>
                <Box sx={{ 
                  width: valueWidth
                }}>
                  <NumberInput
                    label="Cost of shipping to customer"
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
                  Cost of shipping to customer
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
                With VAT
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
                  Fulfillment cost
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
                      label="Fulfillment cost"
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
                  With VAT
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
        <DialogTitle>Enter Product Dimensions</DialogTitle>
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
                  Length
                </Typography>
                <TextField
                  fullWidth
                  value={dimensions.length}
                  onChange={(e) => handleDimensionChange('length', e.target.value)}
                  InputProps={{
                    endAdornment: <Typography variant="caption">CM</Typography>
                  }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="textSecondary" mb={0.5}>
                  Height
                </Typography>
                <TextField
                  fullWidth
                  value={dimensions.height}
                  onChange={(e) => handleDimensionChange('height', e.target.value)}
                  InputProps={{
                    endAdornment: <Typography variant="caption">CM</Typography>
                  }}
                />
              </Box>
            </Stack>
            <Stack direction="row" spacing={2}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="textSecondary" mb={0.5}>
                  Width
                </Typography>
                <TextField
                  fullWidth
                  value={dimensions.width}
                  onChange={(e) => handleDimensionChange('width', e.target.value)}
                  InputProps={{
                    endAdornment: <Typography variant="caption">CM</Typography>
                  }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="textSecondary" mb={0.5}>
                  Weight
                </Typography>
                <TextField
                  fullWidth
                  value={dimensions.weight}
                  onChange={(e) => handleDimensionChange('weight', e.target.value)}
                  InputProps={{
                    endAdornment: <Typography variant="caption">Kg</Typography>
                  }}
                  error={!!error && error.includes("weight")}
                />
              </Box>
            </Stack>
            <Box>
              <Typography variant="caption" color="textSecondary" mb={0.5}>
                Average number of days in emag warehouse
              </Typography>
              <TextField
                fullWidth
                value={dimensions.days}
                onChange={(e) => handleDimensionChange('days', e.target.value)}
                InputProps={{
                  endAdornment: <Typography variant="caption">Days</Typography>
                }}
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDimensionsModal(false)} disabled={isLoading}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSubmitDimensions} 
            disabled={isLoading}
          >
            {isLoading ? 'Calculating...' : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FulfillmentSection; 