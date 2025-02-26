import React, { useEffect } from 'react';
import { Box, Collapse, Stack, Typography } from '@mui/material';
import { CategoryData } from '../../context/CalculatorContext';
import NumberInput from '../NumberInput';
import SectionHeader from '../SectionHeader';
import { useSalesStore } from '../../store/salesStore';

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
  const setSalesHeaderValue = useSalesStore((state) => state.setSalesHeaderValue);
  const totalPrice = data.salePrice + data.shippingPrice;
  const vatToBeCollected = totalPrice * vatRate / 100;
  const headerValue = profileType === 'vat' ? calculations.revenueWithVAT : calculations.revenue;

  // Store the header value in the Zustand store
  useEffect(() => {
    setSalesHeaderValue(category, headerValue);
  }, [category, headerValue, setSalesHeaderValue]);

  const valueWidth = '80px';

  // Helper to determine if VAT fields should be shown
  const shouldShowVATFields = profileType === 'vat' && vatRate > 0;

  return (
    <Box>
      <SectionHeader
        category={category}
        section="sales"
        title="Sales"
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
                  Sale price
                </Typography>
                <Box sx={{ 
                  width: valueWidth
                }}>
                  <NumberInput
                    label="Sale price"
                    value={data.salePrice}
                    onChange={(value) => onUpdateCategory(category, { salePrice: value })}
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
                    {formatCurrency(data.salePrice * (1 + vatRate / 100), false)}
                  </Typography>
                </Stack>
              )}
            </Box>

            {/* Shipping Price Group */}
            <Box>
              <Stack spacing={1}>
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
                    Price of shipping to customer
                  </Typography>
                  {category === 'FBM-NonGenius' ? (
                    <Box sx={{ 
                      width: valueWidth
                    }}>
                      <NumberInput
                        label="Shipping price"
                        value={data.shippingPrice}
                        onChange={(value) => onUpdateCategory(category, { shippingPrice: value })}
                        showLabel={false}
                      />
                    </Box>
                  ) : (
                    <Typography
                      sx={{
                        width: valueWidth,
                        textAlign: 'center',
                        fontSize: '13px'
                      }}
                    >
                      {formatCurrency(0, false)}
                    </Typography>
                  )}
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
                      {formatCurrency(category === 'FBM-NonGenius' ? data.shippingPrice * (1 + vatRate / 100) : 0, false)}
                    </Typography>
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
                Total selling price
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