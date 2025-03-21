import React, { useEffect } from 'react';
import { Box, Collapse, Stack, Typography } from '@mui/material';
import { CategoryData } from '../../context/CalculatorContext';
import NumberInput from '../NumberInput';
import SectionHeader from '../SectionHeader';
import { useProductCostStore, ProductCostStore } from '../../store/productCostStore';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const valueWidth = '100px';
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
    // Always update using onUpdateCategory directly
    // Our modified Calculator component will handle the sync logic
    onUpdateCategory(category, { productCost: value });
  };

  const handleShippingCostChange = (value: number) => {
    // Always update using onUpdateCategory directly
    // Our modified Calculator component will handle the sync logic
    onUpdateCategory(category, { shippingCost: value });
  };

  const handleCustomsDutyChange = (value: number) => {
    // Always update using onUpdateCategory directly
    // Our modified Calculator component will handle the sync logic
    onUpdateCategory(category, { customsDuty: value });
  };

  // Determine if this is the first calculator
  const isFirstCalculator = category === 'FBM-NonGenius';

  return (
    <Box>
      <SectionHeader
        category={category}
        section="productCost"
        title={t('calculator.sections.productCost.title')}
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
                {t('calculator.tradeProfile.purchaseVAT')}
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
                  {t('calculator.sections.productCost.productCost')}
                </Typography>
                <Box sx={{ 
                  width: valueWidth
                }}>
                  <NumberInput
                    label={t('calculator.sections.productCost.productCost')}
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
                  {t('calculator.sections.productCost.shippingCost')}
                </Typography>
                <Box sx={{ 
                  width: valueWidth
                }}>
                  <NumberInput
                    label={t('calculator.sections.productCost.shippingCost')}
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
                      {t('calculator.sections.productCost.customsDuty')}
                    </Typography>
                    <Box sx={{ 
                      width: valueWidth
                    }}>
                      <NumberInput
                        label={t('calculator.sections.productCost.customsDuty')}
                        value={data.customsDuty}
                        onChange={handleCustomsDutyChange}
                        suffix="%"
                        showLabel={false}
                      />
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
                      {t('calculator.sections.productCost.customsDuty')}
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
                      {t('calculator.sections.taxes.vatToBePaid')}
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
                      {t('calculator.sections.taxes.vatToBePaid')}
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