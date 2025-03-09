import React, { useEffect } from 'react';
import { Box, Collapse, Stack, Typography } from '@mui/material';
import { CategoryData } from '../../context/CalculatorContext';
import NumberInput from '../NumberInput';
import SectionHeader from '../SectionHeader';
import { useCommissionStore } from '../../store/commissionStore';
import { useTranslation } from 'react-i18next';

interface CommissionSectionProps {
  category: string;
  data: CategoryData;
  expandedSections: Record<string, boolean>;
  formatCurrency: (value: number, includeCurrency?: boolean) => string;
  vatRate: number;
  onToggle: (category: string, section: string) => void;
  onUpdateCategory: (category: string, data: Partial<CategoryData>) => void;
}

const CommissionSection: React.FC<CommissionSectionProps> = ({
  category,
  data,
  expandedSections,
  formatCurrency,
  vatRate,
  onToggle,
  onUpdateCategory
}) => {
  const { t } = useTranslation();
  const setCommissionHeaderValue = useCommissionStore((state) => state.setCommissionHeaderValue);
  const totalPrice = data.salePrice + data.shippingPrice;
  const commissionAmount = totalPrice * (data.commission / 100);
  const commissionWithVAT = commissionAmount * (1 + vatRate / 100);
  const headerValue = -commissionWithVAT;

  // Store the header value in the Zustand store
  useEffect(() => {
    setCommissionHeaderValue(category, headerValue);
  }, [category, headerValue, setCommissionHeaderValue]);

  const valueWidth = '80px';

  return (
    <Box>
      <SectionHeader
        category={category}
        section="commission"
        title={t('calculator.sections.commission.title')}
        value={formatCurrency(-commissionWithVAT, true)}
        expandedSections={expandedSections}
        onToggle={() => onToggle(category, 'commission')}
        isExpanded={expandedSections.commission}
      />
      <Collapse in={expandedSections.commission}>
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
                  {t('calculator.sections.commission.commissionAmount')}
                </Typography>
                <Typography
                  sx={{
                    width: valueWidth,
                    textAlign: 'center',
                    fontSize: '13px'
                  }}
                >
                  {formatCurrency(commissionAmount, false)}
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
                  {formatCurrency(commissionWithVAT, false)}
                </Typography>
              </Stack>
            </Stack>
          </Stack>
        </Box>
      </Collapse>
    </Box>
  );
};

export default CommissionSection; 