export interface BaseSectionProps {
  category: string;
  data: {
    salePrice: number;
    shippingPrice: number;
    shippingCost: number;
    fulfillmentCost: number;
    productCost: number;
    customsDuty: number;
    otherExpenses?: number;
  };
  expandedSections: Record<string, boolean>;
  formatCurrency: (value: number) => string;
  formatPercentage: (value: number) => string;
  onUpdateCategory: (category: string, data: Partial<BaseSectionProps['data']>) => void;
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
  taxRate: number;
} 