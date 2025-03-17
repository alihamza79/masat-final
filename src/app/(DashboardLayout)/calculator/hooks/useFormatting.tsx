import { useTranslation } from 'react-i18next';

export const useFormatting = () => {
  const { t } = useTranslation();

  /**
   * Format a number as currency
   * @param value The number to format
   * @param includeCurrency Whether to include the currency symbol
   * @returns Formatted currency string
   */
  const formatCurrency = (value: number, includeCurrency: boolean = true) => 
    `${value.toFixed(2)}${includeCurrency ? ' RON' : ''}`;

  /**
   * Format a number as percentage
   * @param value The number to format
   * @returns Formatted percentage string
   */
  const formatPercentage = (value: number) =>
    `${value.toFixed(2)}%`;

  return {
    formatCurrency,
    formatPercentage
  };
};

export default useFormatting; 