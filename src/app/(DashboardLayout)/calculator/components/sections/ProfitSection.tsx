import React, { useEffect } from 'react';
import { Box, Collapse, Stack, Typography } from '@mui/material';
import { CategoryData } from '../../context/CalculatorContext';
import SectionHeader from '../SectionHeader';
import { useTaxStore, TaxStore } from '../../store/taxStore';
import { useSalesStore } from '../../store/salesStore';
import { useCommissionStore } from '../../store/commissionStore';
import { useFulfillmentStore } from '../../store/fulfillmentStore';
import { useExpenditureStore, ExpenditureStore } from '../../store/expenditureStore';
import { useProductCostStore, ProductCostStore } from '../../store/productCostStore';
import { useProfitStore } from '../../store/profitStore';

interface ProfitSectionProps {
  category: string;
  data: CategoryData;
  expandedSections: Record<string, boolean>;
  formatCurrency: (value: number, includeCurrency?: boolean) => string;
  formatPercentage: (value: number) => string;
  vatRate: number;
  onToggle: (category: string, section: string) => void;
  calculations: {
    netProfit: number;
    marginProfit: number;
    revenue: number;
    revenueWithVAT: number;
    commission: number;
    commissionWithVAT: number;
    tax: number;
    vat: number;
  };
  profileType: 'profile' | 'vat';
  purchaseType: string;
}

const ProfitSection: React.FC<ProfitSectionProps> = ({
  category,
  data,
  expandedSections,
  formatCurrency,
  formatPercentage,
  calculations,
  onToggle,
  profileType,
  purchaseType,
  vatRate,
}) => {
  const valueWidth = '80px';
  const taxValues = useTaxStore((state: TaxStore) => state.taxValues[category]);
  const salesHeaderValue = useSalesStore((state) => state.salesHeaderValues[category]);
  const commissionHeaderValue = useCommissionStore((state) => state.commissionHeaderValues[category]);
  const fulfillmentHeaderValue = useFulfillmentStore((state) => state.fulfillmentHeaderValues[category]);
  const expenditureHeaderValue = useExpenditureStore((state: ExpenditureStore) => state.expenditureHeaderValues[category]);
  const productCostHeaderValue = useProductCostStore((state: ProductCostStore) => state.productCostHeaderValues[category]);
  const setNetProfitValue = useProfitStore((state) => state.setNetProfitValue);
  const setProfitMarginValue = useProfitStore((state) => state.setProfitMarginValue);

  // Calculate total taxes from the separate values
  const totalTaxes = -(taxValues.incomeTax + ((profileType === 'vat' || purchaseType === 'europe') ? taxValues.vatToBePaid : 0));
  

  // Add all header values including taxes from the store
  const netProfit = salesHeaderValue + commissionHeaderValue + fulfillmentHeaderValue + 
                   expenditureHeaderValue + productCostHeaderValue + totalTaxes;

  // Calculate margin profit based on the sales value, show 0 if NaN or Infinity
  const marginProfit = salesHeaderValue === 0 ? 0 : (netProfit / salesHeaderValue) * 100;

  // Calculate ROI by dividing net profit by absolute product cost, show 0 if NaN or Infinity
  const roi = productCostHeaderValue === 0 ? 0 : (netProfit / Math.abs(productCostHeaderValue)) * 100;

  // Format values to handle NaN and Infinity
  const formattedNetProfit = isNaN(netProfit) || !isFinite(netProfit) ? 0 : netProfit;
  const formattedMarginProfit = isNaN(marginProfit) || !isFinite(marginProfit) ? 0 : marginProfit;
  const formattedROI = isNaN(roi) || !isFinite(roi) ? 0 : roi;

  // Store the net profit and margin profit values in the Zustand store
  useEffect(() => {
    setNetProfitValue(category, formattedNetProfit);
    setProfitMarginValue(category, formattedMarginProfit);
  }, [category, formattedNetProfit, formattedMarginProfit, setNetProfitValue, setProfitMarginValue]);

  return (
    <Box>
      <SectionHeader
        category={category}
        section="profit"
        title="Profit"
        value={formatCurrency(formattedNetProfit, true)}
        expandedSections={expandedSections}
        onToggle={() => onToggle(category, 'profit')}
        isExpanded={expandedSections.profit}
      />
      <Collapse in={expandedSections.profit}>
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
                  Net Profit
                </Typography>
                <Typography 
                  sx={{
                    width: valueWidth,
                    textAlign: 'center',
                    fontSize: '13px',
                    color: formattedNetProfit === 0 ? 'text.secondary' : formattedNetProfit >= 0 ? 'success.main' : 'error.main'
                  }}
                >
                  {formatCurrency(formattedNetProfit, false)}
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
                  Margin Profit
                </Typography>
                <Typography 
                  sx={{
                    width: valueWidth,
                    textAlign: 'center',
                    fontSize: '13px',
                    color: formattedMarginProfit === 0 ? 'text.secondary' : formattedMarginProfit >= 0 ? 'success.main' : 'error.main'
                  }}
                >
                  {formatPercentage(formattedMarginProfit)}
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
                  ROI
                </Typography>
                <Typography 
                  sx={{
                    width: valueWidth,
                    textAlign: 'center',
                    fontSize: '13px',
                    color: formattedROI === 0 ? 'text.secondary' : formattedROI >= 0 ? 'success.main' : 'error.main'
                  }}
                >
                  {formatPercentage(formattedROI)}
                </Typography>
              </Stack>
            </Stack>
          </Stack>
        </Box>
      </Collapse>
    </Box>
  );
};

export default ProfitSection; 