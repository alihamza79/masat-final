export type CalculatorType = 'FBM-NonGenius' | 'FBM-Genius' | 'FBE';

export type Distribution = {
  pieces: number;
  percent: number;
};

export type Distributions = Record<CalculatorType, Distribution>;

export interface ExpenseHeaderValue {
  commission: number;
  fulfillment: number;
  expenditures: number;
  productCost: number;
  taxes: number;
  vatToBePaid: number;
}

export type ExpenseHeaderValues = Record<CalculatorType, ExpenseHeaderValue>;

export interface MetricCardProps {
  label: string;
  value: number;
  percent: string;
}

export interface ChartData {
  totalRevenue: number;
  totalExpense: number;
  totalTaxes: number;
  totalVatToBePaid: number;
  totalNetProfit: number;
  netProfitPercentage: number;
  taxPercentage: number;
  vatPercentage: number;
} 