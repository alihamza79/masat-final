import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import CustomSlider from './CustomSlider';
import SalesEstimatorInput from './SalesEstimatorInput';
import { CalculatorType, Distributions } from '../../hooks/useSalesEstimatorCalculations';
import { VisibleCards } from '../../hooks/useCalculatorReset';

interface DistributionControlsProps {
  totalPieces: number;
  sliderValue: number[];
  distributions: Distributions;
  handleSliderChange: (newValue: number[]) => void;
  handlePiecesChange: (type: CalculatorType, value: number) => void;
  handleTotalPiecesChange: (value: number) => void;
  visibleCards: VisibleCards;
}

const DistributionControls: React.FC<DistributionControlsProps> = ({
  totalPieces,
  sliderValue,
  distributions,
  handleSliderChange,
  handlePiecesChange,
  handleTotalPiecesChange,
  visibleCards
}) => {
  const { t } = useTranslation();
  const sliderRef = React.useRef<HTMLSpanElement>(null);

  // Get array of visible calculator types
  const visibleTypes = (Object.entries(visibleCards) as [CalculatorType, boolean][])
    .filter(([_, isVisible]) => isVisible)
    .map(([type]) => type as CalculatorType);
    
  // Helper function to get the correct percentage for display based on calculator type
  const getDisplayPercentage = (type: CalculatorType): number => {
    // For a single calculator, it's always 100%
    if (visibleTypes.length === 1) {
      return 100;
    }
    
    // For exactly two calculators
    if (visibleTypes.length === 2) {
      // Sort visible types to maintain consistent order
      const sortedTypes = [...visibleTypes].sort();
      
      if (sortedTypes[0] === 'FBM-NonGenius' && sortedTypes[1] === 'FBM-Genius') {
        // FBM-NonGenius and FBM-Genius are visible
        if (type === 'FBM-NonGenius') {
          return sliderValue[0];
        } else {
          return 100 - sliderValue[0];
        }
      } else if (sortedTypes[0] === 'FBM-NonGenius' && sortedTypes[1] === 'FBE') {
        // FBM-NonGenius and FBE are visible
        if (type === 'FBM-NonGenius') {
          return sliderValue[0];
        } else {
          return 100 - sliderValue[0];
        }
      } else if (sortedTypes[0] === 'FBM-Genius' && sortedTypes[1] === 'FBE') {
        // FBM-Genius and FBE are visible
        if (type === 'FBM-Genius') {
          return sliderValue[1]; // Using sliderValue[1] for this combination
        } else {
          return 100 - sliderValue[1];
        }
      }
    }
    
    // Default to distribution percentage
    return distributions[type].percent;
  };

  return (
    <Box mb={{ xs: 3, sm: 4 }}>
      <Stack 
        direction={{ xs: 'column', sm: 'row' }}
        spacing={{ xs: 3, sm: 3, md: 4 }}
        alignItems={{ xs: 'stretch', sm: 'center' }}
      >
        {/* Sales Input - Always visible */}
        <Box
          sx={{ 
            width: { xs: '100%', sm: '200px', md: '240px' },
            flex: { sm: '0 0 200px', md: '0 0 240px' }
          }}
        >
          <Stack spacing={1}>
            <Typography 
              sx={{ 
                fontSize: { xs: '12px', sm: '13px' }, 
                color: 'text.secondary',
                fontWeight: 500,
                height: '20px',
                lineHeight: '20px'
              }}
            >
              {t('calculator.salesEstimator.numberOfSales')}
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'space-between',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              height: '35px',
              position: 'relative'
            }}>
              <SalesEstimatorInput
                label={t('calculator.salesEstimator.numberOfSales')}
                value={totalPieces}
                onChange={handleTotalPiecesChange}
                showLabel={false}
              />
              <Typography 
                sx={{ 
                  fontSize: '13px',
                  color: 'text.secondary',
                  userSelect: 'none',
                  pl: 0.5,
                  position: 'absolute',
                  right: { xs: 8, sm: 12 }
                }}
              >
                {t('calculator.salesEstimator.pcs')}
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* For single calculator - Display a minimalistic indicator */}
        {visibleTypes.length === 1 && (
          <Typography 
            sx={{ 
              fontSize: { xs: '13px', sm: '14px' },
              fontWeight: 500,
              color: 'text.primary',
              display: 'flex',
              alignItems: 'center',
              mt: { xs: 0, sm: -1 }
            }}
          >
            <Box 
              component="span" 
              sx={{ 
                display: 'inline-block',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                mr: 1.5,
                backgroundColor: visibleTypes[0] === 'FBM-NonGenius' 
                  ? '#FF9800' 
                  : visibleTypes[0] === 'FBM-Genius' 
                    ? '#5D87FF' 
                    : '#2CD9C5'
              }}
            />
            {t(`calculator.cards.${visibleTypes[0]}`)} (100%)
          </Typography>
        )}

        {/* Distribution Slider - Only show if more than one calculator is visible */}
        {visibleTypes.length > 1 && (
          <Box sx={{ flex: 1 }}>
            <Stack spacing={1}>
              <Stack 
                direction="row" 
                justifyContent={visibleTypes.length === 2 ? "space-between" : "space-between"}
                sx={{ 
                  height: '20px',
                  '& > *': {
                    width: visibleTypes.length === 2 ? "auto" : { xs: '80px', sm: '100px', md: '120px' },
                    textAlign: 'center',
                    fontSize: { xs: '11px', sm: '12px', md: '13px' },
                    color: 'text.secondary',
                    fontWeight: 500,
                    lineHeight: '20px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }
                }}
              >
                {/* Only show headers for visible calculators */}
                {visibleTypes.length === 2 ? (
                  // When exactly two calculators are visible, show them at the left and right of the slider
                  <>
                    <Typography>{t(`calculator.cards.${visibleTypes[0]}`)}</Typography>
                    <Typography>{t(`calculator.cards.${visibleTypes[1]}`)}</Typography>
                  </>
                ) : (
                  // When all three are visible, show them with default spacing
                  <>
                    {visibleCards['FBM-NonGenius'] && <Typography>{t('calculator.cards.FBM-NonGenius')}</Typography>}
                    {visibleCards['FBM-Genius'] && <Typography>{t('calculator.cards.FBM-Genius')}</Typography>}
                    {visibleCards['FBE'] && <Typography>{t('calculator.cards.FBE')}</Typography>}
                  </>
                )}
              </Stack>
              <Box sx={{ height: '35px', display: 'flex', alignItems: 'center' }}>
                <CustomSlider
                  ref={sliderRef}
                  value={sliderValue}
                  onChange={(event, newValue) => {
                    if (Array.isArray(newValue)) {
                      handleSliderChange(newValue);
                    } else if (visibleTypes.length === 2) {
                      // When there are only two visible calculators, we get a single number
                      // We need to convert it to the right format based on which calculators are visible
                      const sortedTypes = [...visibleTypes].sort();
                      if (sortedTypes[0] === 'FBM-NonGenius' && (sortedTypes[1] === 'FBM-Genius' || sortedTypes[1] === 'FBE')) {
                        // First calculator is NonGenius (combined with either Genius or FBE)
                        handleSliderChange([newValue, 100]);
                      } else if (sortedTypes[0] === 'FBM-Genius' && sortedTypes[1] === 'FBE') {
                        // Genius and FBE are visible
                        handleSliderChange([0, newValue]);
                      }
                    }
                  }}
                  valueLabelDisplay="on"
                  valueLabelFormat={(value) => `${value}%`}
                  visibleCards={visibleCards}
                />
              </Box>
              <Stack 
                direction="row"
                spacing={{ xs: 1, sm: 2 }}
                alignItems="center"
                justifyContent="space-between"
                sx={{ 
                  mt: { xs: 1, sm: 0.5 }
                }}
              >
                {/* Only show inputs for visible calculators */}
                {visibleTypes.map((type) => (
                  <Box
                    key={type}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      height: '35px',
                      position: 'relative',
                      width: { xs: '32%', sm: '100px', md: '120px' },
                      minWidth: '90px'
                    }}
                  >
                    <SalesEstimatorInput
                      label={`${type} pieces`}
                      value={distributions[type].pieces}
                      onChange={(value) => handlePiecesChange(type, value)}
                      showLabel={false}
                    />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        position: 'absolute',
                        right: { xs: 4, sm: 8 },
                        fontSize: { xs: '9px', sm: '11px' },
                        whiteSpace: 'nowrap'
                      }}
                    >
                      ({getDisplayPercentage(type).toFixed(2)}%)
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Stack>
          </Box>
        )}
      </Stack>
    </Box>
  );
};

export default DistributionControls; 