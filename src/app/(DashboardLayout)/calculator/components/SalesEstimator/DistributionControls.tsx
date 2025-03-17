import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import CustomSlider from './CustomSlider';
import SalesEstimatorInput from './SalesEstimatorInput';
import { CalculatorType, Distributions } from '../../hooks/useSalesEstimatorCalculations';

interface DistributionControlsProps {
  totalPieces: number;
  sliderValue: number[];
  distributions: Distributions;
  handleSliderChange: (newValue: number[]) => void;
  handlePiecesChange: (type: CalculatorType, value: number) => void;
  handleTotalPiecesChange: (value: number) => void;
}

const DistributionControls: React.FC<DistributionControlsProps> = ({
  totalPieces,
  sliderValue,
  distributions,
  handleSliderChange,
  handlePiecesChange,
  handleTotalPiecesChange
}) => {
  const { t } = useTranslation();
  const sliderRef = React.useRef<HTMLSpanElement>(null);

  return (
    <Box mb={{ xs: 3, sm: 4 }}>
      <Stack 
        direction={{ xs: 'column', sm: 'row' }}
        spacing={{ xs: 3, sm: 3, md: 4 }}
        alignItems={{ xs: 'stretch', sm: 'flex-start' }}
      >
        {/* Sales Input */}
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
                PCS
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* Distribution Slider */}
        <Box sx={{ flex: 1 }}>
          <Stack spacing={1}>
            <Stack 
              direction="row" 
              justifyContent="space-between"
              sx={{ 
                height: '20px',
                '& > *': {
                  width: { xs: '80px', sm: '100px', md: '120px' },
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
              <Typography>{t('calculator.cards.FBM-NonGenius')}</Typography>
              <Typography>{t('calculator.cards.FBM-Genius')}</Typography>
              <Typography>{t('calculator.cards.FBE')}</Typography>
            </Stack>
            <Box sx={{ height: '35px', display: 'flex', alignItems: 'center' }}>
              <CustomSlider
                ref={sliderRef}
                value={sliderValue}
                onChange={(event, newValue) => {
                  if (Array.isArray(newValue)) {
                    handleSliderChange(newValue);
                  }
                }}
                valueLabelDisplay="on"
                valueLabelFormat={(value) => `${value}%`}
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
              {(['FBM-NonGenius', 'FBM-Genius', 'FBE'] as CalculatorType[]).map((type) => (
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
                    ({distributions[type].percent.toFixed(2)}%)
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
};

export default DistributionControls; 