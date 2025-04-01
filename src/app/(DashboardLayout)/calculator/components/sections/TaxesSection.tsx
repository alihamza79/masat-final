import React, { useEffect } from 'react';
import { Box, Collapse, Stack, Typography } from '@mui/material';
import { CategoryData } from '../../context/CalculatorContext';
import SectionHeader from '../SectionHeader';
import { useTaxStore, TaxStore } from '../../store/taxStore';
import { useTranslation } from 'react-i18next';

interface TaxesSectionProps {
  category: string;
  data: CategoryData;
  expandedSections: Record<string, boolean>;
  formatCurrency: (value: number, includeCurrency?: boolean) => string;
  vatRate: number;
  onToggle: (category: string, section: string) => void;
  calculations: {
    tax: number;
    vat: number;
    taxRate: number;
    revenue: number;
    revenueWithVAT: number;
    commission: number;
    commissionWithVAT: number;
  };
  profileType: 'profile' | 'vat';
  purchaseType: string;
  salesHeaderValue: number;
  commissionHeaderValue: number;
  fulfillmentHeaderValue: number;
  expendituresHeaderValue: number;
  productCostHeaderValue: number;
  vatRateOfPurchase: string;
}

const TaxesSection: React.FC<TaxesSectionProps> = ({
  category,
  data,
  expandedSections,
  formatCurrency,
  vatRate,
  onToggle,
  calculations,
  profileType,
  purchaseType,
  salesHeaderValue,
  commissionHeaderValue,
  fulfillmentHeaderValue,
  expendituresHeaderValue,
  productCostHeaderValue,
  vatRateOfPurchase
}) => {
  const setTaxValues = useTaxStore((state: TaxStore) => state.setTaxValues);
  const valueWidth = '100px';
  const { t } = useTranslation();

  // Calculate income tax based on tax rate
  const calculateIncomeTax = () => {
    if (calculations.taxRate === 16) {
      // For 16% tax rate, use the sum of all components
      // Round each value to 2 decimal places before summing
      const totalValue = Number(salesHeaderValue.toFixed(2)) + 
                        Number(commissionHeaderValue.toFixed(2)) + 
                        Number(fulfillmentHeaderValue.toFixed(2)) + 
                        Number(expendituresHeaderValue.toFixed(2)) + 
                        Number(productCostHeaderValue.toFixed(2));
      
      // Round the final result to 2 decimal places
      return Number((totalValue * 0.16).toFixed(2));
    } else {
      // For 1% or 3% tax rate, use the original calculation
      const headerValue = profileType === 'vat' ? calculations.revenueWithVAT : calculations.revenue;
      return Number((headerValue * calculations.taxRate / 100).toFixed(2));
    }
  };

  const incomeTax = calculateIncomeTax();

  // Calculate VAT components
  const calculateVATToBePaid = () => {
    // Return 0 if there are no input values
    if (data.salePrice === 0 && data.shippingPrice === 0 && data.productCost === 0 && 
        data.fulfillmentCost === 0 && (data.otherExpenses || 0) === 0) {
      return 0;
    }

    // Use VAT rate from trade profile for purchases
    const purchaseVatRate = vatRateOfPurchase === 'customs' ? 0 : Number(vatRateOfPurchase) / 100;
    let saleVatRate = vatRate/100;
    const VAT_RATE = 0.19;
    if(profileType==='profile'){
      saleVatRate=0;
    }
    // 1. Sales Section - VAT Collection
    const vatSales = (data.salePrice * saleVatRate) + (data.shippingPrice * saleVatRate);

    // 2. eMAG Commission Section - Using the commission amount directly
    const commissionAmount = (data.salePrice + data.shippingPrice) * (data.commission / 100);
    const vatEmag = commissionAmount * VAT_RATE;

    // 3. Fulfillment Section
    const shippingCost = category === 'FBM-Genius' ? 5 : category === 'FBE' ? 0 : data.fulfillmentShippingCost;
    const vatFulfillment = (shippingCost * VAT_RATE) + (data.fulfillmentCost * VAT_RATE);

    // 4. Expenditures Section
    const vatExpenditures = (data.otherExpenses || 0) * VAT_RATE;

    // 5. Product Cost Section
    let vatProductCost = 0;
    if (purchaseType === 'china') {
      // For China, use VAT paid at customs
      const customsDuties = data.productCost * (data.customsDuty / 100);
      vatProductCost = (data.productCost + data.shippingCost + customsDuties) * VAT_RATE;
    } else {
      // For Romania/Europe, use the VAT rate from trade profile
      const purchasePriceWithVAT = data.productCost * (1 + purchaseVatRate);
      const shippingCostWithVAT = data.shippingCost * (1 + purchaseVatRate);
      vatProductCost = (purchasePriceWithVAT * purchaseVatRate) + (shippingCostWithVAT * purchaseVatRate);
    }

    

    // 6. Final VAT to be paid calculation
    const vatToBePaid = vatSales - vatEmag - vatFulfillment - vatExpenditures - vatProductCost;


    // Round to 2 decimal places
    return Number(vatToBePaid.toFixed(2));
  };

  const vatToBePaid = calculateVATToBePaid();

  // Store both values in Zustand store
  useEffect(() => {
    setTaxValues(category, {
      incomeTax: incomeTax,
      vatToBePaid: vatToBePaid
    });
  }, [category, incomeTax, vatToBePaid, setTaxValues]);

  const shouldShowVAT = profileType === 'vat' || purchaseType === 'europe';
  const totalTaxes = -(incomeTax + (shouldShowVAT ? vatToBePaid : 0));

  return (
    <Box>
      <SectionHeader
        category={category}
        section="taxes"
        title={t('calculator.sections.taxes.title')}
        value={formatCurrency(totalTaxes, true)}
        expandedSections={expandedSections}
        onToggle={() => onToggle(category, 'taxes')}
        isExpanded={expandedSections.taxes}
      />
      <Collapse in={expandedSections.taxes}>
        <Box sx={{ 
          px: { xs: 1, sm: 1.5, md: 2 },
          py: { xs: 0.5, sm: 1 }
        }}>
          <Stack spacing={1.5}>
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
                  {t('calculator.sections.taxes.incomeTax')} {calculations.taxRate}%
                </Typography>
                <Typography
                  sx={{
                    width: valueWidth,
                    textAlign: 'center',
                    fontSize: '13px'
                  }}
                >
                  {formatCurrency(incomeTax, false)}
                </Typography>
              </Stack>
              {shouldShowVAT && (
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
                    VAT to be paid
                  </Typography>
                  <Typography
                    sx={{
                      width: valueWidth,
                      textAlign: 'center',
                      fontSize: '13px'
                    }}
                  >
                    {formatCurrency(vatToBePaid, false)}
                  </Typography>
                </Stack>
              )}
            </Stack>
          </Stack>
        </Box>
      </Collapse>
    </Box>
  );
};

export default TaxesSection; 