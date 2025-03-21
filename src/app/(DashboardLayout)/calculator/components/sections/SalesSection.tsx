import React, { useEffect } from 'react';
import { Box, Collapse, Stack, Typography } from '@mui/material';
import { CategoryData } from '../../context/CalculatorContext';
import NumberInput from '../NumberInput';
import SectionHeader from '../SectionHeader';
import { useSalesStore } from '../../store/salesStore';
import { useTranslation } from 'react-i18next';

interface SalesSectionProps {
  category: string;
  data: CategoryData;
  expandedSections: Record<string, boolean>;
  formatCurrency: (value: number, includeCurrency?: boolean) => string;
  vatRate: number;
  onToggle: (category: string, section: string) => void;
  onUpdateCategory: (category: string, data: Partial<CategoryData>) => void;
  profileType: 'profile' | 'vat';
  calculations: {
    revenue: number;
    revenueWithVAT: number;
    vat: number;
  };
}

const SalesSection: React.FC<SalesSectionProps> = ({
  category,
  data,
  expandedSections,
  formatCurrency,
  vatRate,
  onToggle,
  onUpdateCategory,
  profileType,
  calculations
}) => {
  const { t } = useTranslation();
  const setSalesHeaderValue = useSalesStore((state) => state.setSalesHeaderValue);
  const totalPrice = data.salePrice + data.shippingPrice;
  const vatToBeCollected = totalPrice * vatRate / 100;
  const headerValue = profileType === 'vat' ? calculations.revenueWithVAT : calculations.revenue;

  // Store the header value in the Zustand store
  useEffect(() => {
    setSalesHeaderValue(category, headerValue);
  }, [category, headerValue, setSalesHeaderValue]);

  const valueWidth = '100px';

  // Helper to determine if VAT fields should be shown
  const shouldShowVATFields = profileType === 'vat' && vatRate > 0;

  // Helper function to handle sale price changes
  const handleSalePriceChange = (value: number) => {
    // Always update each calculator independently to ensure values are saved separately
    onUpdateCategory(category, { salePrice: parseFloat(value.toFixed(2)) });
  };

  // Helper function to handle sale price with VAT changes
  const handleSalePriceWithVATChange = (value: number) => {
    // Round to 2 decimal places when converting from VAT to price
    const newPrice = parseFloat((value / (1 + vatRate / 100)).toFixed(2));
    onUpdateCategory(category, { salePrice: newPrice });
  };

  // Helper function to handle shipping price changes
  const handleShippingPriceChange = (value: number) => {
    if (category === 'FBM-NonGenius') {
      onUpdateCategory(category, { shippingPrice: parseFloat(value.toFixed(2)) });
    }
  };

  // Helper function to handle shipping price with VAT changes
  const handleShippingPriceWithVATChange = (value: number) => {
    if (category === 'FBM-NonGenius') {
      // Round to 2 decimal places when converting from VAT to price
      const newPrice = parseFloat((value / (1 + vatRate / 100)).toFixed(2));
      onUpdateCategory(category, { shippingPrice: newPrice });
    }
  };

  return (
    <Box>
      <SectionHeader
        category={category}
        section="sales"
        title={t('calculator.sections.sales.title')}
        value={formatCurrency(headerValue)}
        expandedSections={expandedSections}
        onToggle={() => onToggle(category, 'sales')}
        isExpanded={expandedSections.sales}
      />
      <Collapse in={expandedSections.sales}>
        <Box sx={{ 
          px: { xs: 1, sm: 1.5, md: 2 },
          py: { xs: 0.5, sm: 1 }
        }}>
          <Stack spacing={1.5}>
            {/* Sale Price Group */}
            <Box>
              <Stack 
                spacing={0.75}
              >
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
                    {t('calculator.sections.sales.salePrice')}
                  </Typography>
                  <Box sx={{ 
                    width: valueWidth
                  }}>
                    <NumberInput
                      label={t('calculator.sections.sales.salePrice')}
                      value={data.salePrice}
                      onChange={handleSalePriceChange}
                      showLabel={false}
                    />
                  </Box>
                </Stack>

                {/* With VAT */}
                {shouldShowVATFields && (
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
                        width: '140px',
                        flex: '0 0 140px'
                      }}
                    >
                      {t('calculator.sections.sales.withVAT')}
                    </Typography>
                    <Box sx={{ 
                      width: valueWidth
                    }}>
                      <NumberInput
                        label="With VAT"
                        value={data.salePrice * (1 + vatRate / 100)}
                        onChange={handleSalePriceWithVATChange}
                        showLabel={false}
                        textAlign="center"
                        sx={{ fontSize: '11px', borderStyle: 'dashed' }}
                      />
                    </Box>
                  </Stack>
                )}
              </Stack>
            </Box>

            {/* Shipping Price Group */}
            <Box>
              <Stack spacing={0.75}>
                {/* Main Shipping Price Input */}
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
                    {t('calculator.sections.sales.shippingPrice')}
                  </Typography>
                  <Box sx={{ 
                    width: valueWidth
                  }}>
                    <NumberInput
                      label={t('calculator.sections.sales.shippingPrice')}
                      value={category === 'FBM-NonGenius' ? data.shippingPrice : 0}
                      onChange={handleShippingPriceChange}
                      showLabel={false}
                      disabled={category !== 'FBM-NonGenius'}
                      sx={category !== 'FBM-NonGenius' ? { 
                        fontSize: '13px',
                        border: 'none',
                        bgcolor: 'transparent',
                        boxShadow: 'none',
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            border: 'none',
                          },
                          '& input': {
                            color: '#000 !important',
                          },
                        },
                        '& .MuiInputBase-input.Mui-disabled': {
                          color: '#000 !important',
                          WebkitTextFillColor: '#000 !important',
                          opacity: '1 !important',
                          '-webkit-text-fill-color': '#000 !important',
                        }
                      } : {}}
                    />
                  </Box>
                </Stack>

                {/* With VAT */}
                {shouldShowVATFields && (
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
                        width: '140px',
                        flex: '0 0 140px'
                      }}
                    >
                      {t('calculator.sections.sales.withVAT')}
                    </Typography>
                    <Box sx={{ 
                      width: valueWidth
                    }}>
                      <NumberInput
                        label="With VAT"
                        value={category === 'FBM-NonGenius' ? data.shippingPrice * (1 + vatRate / 100) : 0}
                        onChange={handleShippingPriceWithVATChange}
                        showLabel={false}
                        textAlign="center"
                        disabled={category !== 'FBM-NonGenius'}
                        sx={category === 'FBM-NonGenius' ? 
                          { fontSize: '11px', borderStyle: 'dashed' } : 
                          { 
                            fontSize: '11px', 
                            border: 'none', 
                            bgcolor: 'transparent', 
                            boxShadow: 'none',
                            '& .MuiOutlinedInput-root': {
                              '& fieldset': {
                                border: 'none',
                              },
                              '& input': {
                                color: '#000 !important',
                              },
                            },
                            '& .MuiInputBase-input.Mui-disabled': {
                              color: '#000 !important',
                              WebkitTextFillColor: '#000 !important',
                              opacity: '1 !important',
                              '-webkit-text-fill-color': '#000 !important',
                            }
                          }
                        }
                      />
                    </Box>
                  </Stack>
                )}
              </Stack>
            </Box>

            {/* Total Selling Price */}
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
                {t('calculator.sections.sales.totalSellingPrice')}
              </Typography>
              <Typography
                sx={{
                  width: valueWidth,
                  textAlign: 'center',
                  fontSize: '13px'
                }}
              >
                {formatCurrency(totalPrice, false)}
              </Typography>
            </Stack>

            {/* With VAT for Total */}
            {shouldShowVATFields && (
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
                    color: 'text.primary'
                  }}
                >
                  {formatCurrency(totalPrice * (1 + vatRate / 100), false)}
                </Typography>
              </Stack>
            )}

            {/* VAT to be collected */}
            {shouldShowVATFields && (
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
                  VAT to be collected
                </Typography>
                <Typography
                  sx={{
                    width: valueWidth,
                    textAlign: 'center',
                    fontSize: '13px'
                  }}
                >
                  {formatCurrency(vatToBeCollected, false)}
                </Typography>
              </Stack>
            )}
          </Stack>
        </Box>
      </Collapse>
    </Box>
  );
};

export default SalesSection; 