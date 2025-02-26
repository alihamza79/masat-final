import React, { useEffect } from 'react';
import { Box, Collapse, Stack, Typography } from '@mui/material';
import { CategoryData } from '../../context/CalculatorContext';
import NumberInput from '../NumberInput';
import SectionHeader from '../SectionHeader';
import { useProductCostStore, ProductCostStore } from '../../store/productCostStore';

interface ProductCostSectionProps {
  category: string;
  data: CategoryData;
  expandedSections: Record<string, boolean>;
  formatCurrency: (value: number, includeCurrency?: boolean) => string;
  vatRate: number;
  onToggle: (category: string, section: string) => void;
  onUpdateCategory: (category: string, data: Partial<CategoryData>) => void;
  purchaseType: string;
  vatRateOfPurchase: string;
  state: any;
}

const ProductCostSection: React.FC<ProductCostSectionProps> = ({
  category,
  data,
  expandedSections,
  formatCurrency,
  vatRate,
  onToggle,
  onUpdateCategory,
  purchaseType,
  vatRateOfPurchase,
  state,
}) => {
  const valueWidth = '80px';
  const setProductCostHeaderValue = useProductCostStore((state: ProductCostStore) => state.setProductCostHeaderValue);
  const isFromChina = purchaseType === 'china';
  const purchaseVatRate = isFromChina ? vatRate : Number(vatRateOfPurchase);

  // Calculate values for Romania/Europe
  const purchasePriceWithVAT = data.productCost * (1 + purchaseVatRate / 100);
  const shippingWithVAT = data.shippingCost * (1 + purchaseVatRate / 100);

  // Calculate values for China
  const customsDuties = isFromChina ? (data.productCost * data.customsDuty) / 100 : 0;
  const vatAtCustoms = isFromChina 
    ? (data.productCost + data.shippingCost + customsDuties) * (vatRate / 100)
    : 0;

  // Calculate total cost based on purchase type
  const totalCost = isFromChina
    ? data.productCost + data.shippingCost + customsDuties + vatAtCustoms // China formula
    : data.productCost + data.shippingCost; // Romania/Europe formula

  // Store the header value in the Zustand store
  const headerValue = -totalCost;
  useEffect(() => {
    setProductCostHeaderValue(category, headerValue);
  }, [category, headerValue, setProductCostHeaderValue]);

  const handleProductCostChange = (value: number) => {
    if (state.syncValues) {
      // Update product cost for all categories
      Object.keys(state.categories).forEach((cat) => {
        onUpdateCategory(cat, { productCost: value });
      });
    } else {
      onUpdateCategory(category, { productCost: value });
    }
  };

  const handleShippingCostChange = (value: number) => {
    if (state.syncValues) {
      // Update shipping cost for all categories
      Object.keys(state.categories).forEach((cat) => {
        onUpdateCategory(cat, { shippingCost: value });
      });
    } else {
      onUpdateCategory(category, { shippingCost: value });
    }
  };

  const handleCustomsDutyChange = (value: number) => {
    if (state.syncValues) {
      // Update customs duty for all categories
      Object.keys(state.categories).forEach((cat) => {
        onUpdateCategory(cat, { customsDuty: value });
      });
    } else {
      onUpdateCategory(category, { customsDuty: value });
    }
  };

  // Determine if this is the first calculator
  const isFirstCalculator = category === 'FBM-NonGenius';

  return (
    <Box>
      <SectionHeader
        category={category}
        section="productCost"
        title="Product Cost"
        value={formatCurrency(-totalCost, true)}
        expandedSections={expandedSections}
        onToggle={() => onToggle(category, 'productCost')}
        isExpanded={expandedSections.productCost}
      />
      <Collapse in={expandedSections.productCost}>
        <Box sx={{ 
          px: { xs: 1, sm: 1.5, md: 2 },
          py: { xs: 0.5, sm: 1 }
        }}>
          <Stack spacing={1.5}>
            {/* VAT rate of purchase */}
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
                VAT rate of purchase
              </Typography>
              <Typography
                sx={{
                  width: valueWidth,
                  textAlign: 'center',
                  fontSize: '13px',
                  color: 'text.secondary'
                }}
              >
                {isFromChina ? 'Customs calculation' : `${vatRateOfPurchase}%`}
              </Typography>
            </Stack>

            {/* Purchase price and VAT */}
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
                  Purchase price
                </Typography>
                <Box sx={{ 
                  width: valueWidth
                }}>
                  <NumberInput
                    label="Purchase price"
                    value={data.productCost}
                    onChange={handleProductCostChange}
                    showLabel={false}
                  />
                </Box>
              </Stack>
              {!(purchaseType === 'romania' && vatRateOfPurchase === '0') && purchaseType !== 'china' && (
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
                    {formatCurrency(purchasePriceWithVAT, false)}
                  </Typography>
                </Stack>
              )}
            </Stack>

            {/* Shipping cost and VAT */}
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
                  Shipping cost
                </Typography>
                <Box sx={{ 
                  width: valueWidth
                }}>
                  <NumberInput
                    label="Shipping cost"
                    value={data.shippingCost}
                    onChange={handleShippingCostChange}
                    showLabel={false}
                  />
                </Box>
              </Stack>
              {!(purchaseType === 'romania' && vatRateOfPurchase === '0') && purchaseType !== 'china' && (
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
                    {formatCurrency(shippingWithVAT, false)}
                  </Typography>
                </Stack>
              )}
            </Stack>

            {/* China-specific fields */}
            {isFromChina && (
              <>
                {/* Customs duties rate and amount */}
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
                      Customs duties rate
                    </Typography>
                    <Box sx={{ 
                      width: valueWidth
                    }}>
                      {isFirstCalculator ? (
                        <NumberInput
                          label="Customs duties rate"
                          value={data.customsDuty}
                          onChange={handleCustomsDutyChange}
                          suffix="%"
                          showLabel={false}
                        />
                      ) : (
                        <Typography
                          sx={{
                            width: '100%',
                            textAlign: 'center',
                            fontSize: '13px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1
                          }}
                        >
                          {data.customsDuty}%
                        </Typography>
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
                      Customs duties
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
                      {formatCurrency(customsDuties, false)}
                    </Typography>
                  </Stack>
                </Stack>

                {/* Customs VAT rate and amount */}
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
                        fontWeight: 400,
                        fontSize: '13px',
                        width: '140px',
                        flex: '0 0 140px'
                      }}
                    >
                      Customs VAT rate
                    </Typography>
                    <Typography
                      sx={{
                        width: valueWidth,
                        textAlign: 'center',
                        fontSize: '13px'
                      }}
                    >
                      {vatRate}%
                    </Typography>
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
                        fontWeight: 500,
                        fontSize: '13px',
                        width: '140px',
                        flex: '0 0 140px'
                      }}
                    >
                      VAT to be paid at customs
                    </Typography>
                    <Typography
                      sx={{
                        width: valueWidth,
                        textAlign: 'center',
                        fontSize: '13px'
                      }}
                    >
                      {formatCurrency(vatAtCustoms, false)}
                    </Typography>
                  </Stack>
                </Stack>
              </>
            )}
          </Stack>
        </Box>
      </Collapse>
    </Box>
  );
};

export default ProductCostSection; 