import { CategoryData } from './context/CalculatorContext';

export interface BaseSectionProps {
  category: string;
  data: CategoryData;
  expandedSections: Record<string, boolean>;
  formatCurrency: (value: number) => string;
  formatPercentage: (value: number) => string;
  onUpdateCategory: (category: string, data: Partial<CategoryData>) => void;
  vatRate: number;
  onToggle: () => void;
}

export interface SectionCalculations {
  revenue: number;
  vat: number;
  commission: number;
  totalCosts: number;
  grossProfit: number;
  tax: number;
  netProfit: number;
  marginProfit: number;
} 