import React, { useEffect } from 'react';
import { Box, Collapse, Stack, Typography } from '@mui/material';
import { CategoryData } from '../../context/CalculatorContext';
import NumberInput from '../NumberInput';
import SectionHeader from '../SectionHeader';
import { useExpenditureStore, ExpenditureStore } from '../../store/expenditureStore';

interface ExpendituresSectionProps {
  category: string;
  data: CategoryData;
  expandedSections: Record<string, boolean>;
  formatCurrency: (value: number, includeCurrency?: boolean) => string;
  vatRate: number;
  onToggle: (category: string, section: string) => void;
  onUpdateCategory: (category: string, data: Partial<CategoryData>) => void;
}

const ExpendituresSection: React.FC<ExpendituresSectionProps> = ({
  category,
  data,
  expandedSections,
  formatCurrency,
  vatRate,
  onToggle,
  onUpdateCategory,
}) => {
  const valueWidth = '80px';
  const setExpenditureHeaderValue = useExpenditureStore((state: ExpenditureStore) => state.setExpenditureHeaderValue);
  const otherExpensesWithVAT = (data.otherExpenses || 0) * (1 + vatRate / 100);

  // Store the header value in the Zustand store
  const headerValue = -otherExpensesWithVAT;
  useEffect(() => {
    setExpenditureHeaderValue(category, headerValue);
  }, [category, headerValue, setExpenditureHeaderValue]);

  return (
    <Box>
      <SectionHeader
        category={category}
        section="expenditures"
        title="Expenditures"
        value={formatCurrency(-otherExpensesWithVAT, true)}
        expandedSections={expandedSections}
        onToggle={() => onToggle(category, 'expenditures')}
        isExpanded={expandedSections.expenditures}
      />
      <Collapse in={expandedSections.expenditures}>
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
                  Other expenses
                </Typography>
                <Box sx={{ 
                  width: valueWidth
                }}>
                  <NumberInput
                    label="Other expenses"
                    value={data.otherExpenses || 0}
                    onChange={(value) => onUpdateCategory(category, { otherExpenses: value })}
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
                  {formatCurrency(otherExpensesWithVAT, false)}
                </Typography>
              </Stack>
            </Stack>
          </Stack>
        </Box>
      </Collapse>
    </Box>
  );
};

export default ExpendituresSection; 