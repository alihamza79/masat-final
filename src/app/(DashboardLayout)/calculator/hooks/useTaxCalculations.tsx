import { useCalculator } from '../context/CalculatorContext';
import { CategoryData } from '../context/CalculatorContext';

export const useTaxCalculations = () => {
  const { state } = useCalculator();

  /**
   * Calculate VAT to be paid for a specific category
   * @param category The category to calculate VAT for
   * @param data The category data
   * @param vatRate The VAT rate to use
   * @returns The VAT amount to be paid
   */
  const calculateVATToBePaid = (category: string, data: CategoryData, vatRate: number) => {
    // Fixed VAT rate of 19% for all sections except sales
    const FIXED_VAT_RATE = 0.19;
    const saleVatRate = vatRate/100;

    // 1. Sales Section - VAT Collection (uses variable VAT rate)
    const vatSales = (data.salePrice * saleVatRate) + (data.shippingPrice * saleVatRate);

    // 2. eMAG Commission Section - Using the commission amount directly with fixed VAT rate
    const commissionAmount = (data.salePrice + data.shippingPrice) * (data.commission / 100);
    const vatEmag = commissionAmount * FIXED_VAT_RATE;

    // 3. Fulfillment Section with fixed VAT rate
    const shippingCost = category === 'FBM-Genius' ? 5 : category === 'FBE' ? 0 : data.fulfillmentShippingCost;
    const vatFulfillment = (shippingCost + data.fulfillmentCost) * FIXED_VAT_RATE;

    // 4. Expenditures Section with fixed VAT rate
    const vatExpenditures = (data.otherExpenses || 0) * FIXED_VAT_RATE;

    // 5. Product Cost Section with fixed VAT rate
    let vatProductCost = 0;
    if (state.purchaseType === 'china') {
      // For China, use fixed VAT rate for customs calculation
      const customsDuties = (data.productCost * data.customsDuty) / 100;
      vatProductCost = (data.productCost + data.shippingCost + customsDuties) * FIXED_VAT_RATE;
    } else {
      // For Romania/Europe, use fixed VAT rate
      vatProductCost = (data.productCost + data.shippingCost) * FIXED_VAT_RATE;
    }

    // 6. Final VAT to be paid calculation
    const vatToBePaid = vatSales - vatEmag - vatFulfillment - vatExpenditures - vatProductCost;

    // Round to 2 decimal places
    return Number(vatToBePaid.toFixed(2));
  };

  /**
   * Calculate income tax for a specific category
   * @param category The category to calculate income tax for
   * @param data The category data
   * @param categoryCalculations The category calculations
   * @returns The income tax amount
   */
  const calculateIncomeTax = (
    category: string, 
    data: CategoryData, 
    categoryCalculations: Record<string, any>
  ) => {
    if (categoryCalculations[category].taxRate === 16) {
      // For 16% tax rate, calculate based on all components
      const totalValue = (
        (state.profileType === 'vat' ? categoryCalculations[category].revenueWithVAT : categoryCalculations[category].revenue) + 
        -(categoryCalculations[category].commissionWithVAT) + 
        -((category === 'FBE' ? 0 : category === 'FBM-Genius' ? 5 * (1 + 0.19) : data.fulfillmentShippingCost * (1 + 0.19)) + data.fulfillmentCost * (1 + 0.19)) +
        -(data.otherExpenses * (1 + 0.19)) +
        (state.purchaseType === 'china' 
          ? -(data.productCost + data.shippingCost + (data.productCost * data.customsDuty / 100) + ((data.productCost + data.shippingCost + (data.productCost * data.customsDuty / 100)) * 0.19))
          : -(data.productCost + data.shippingCost))
      );
      return Number((Number(totalValue.toFixed(2)) * 0.16).toFixed(2));
    } else {
      // For 1% or 3% tax rate, calculate based on revenue
      return (state.profileType === 'vat' ? categoryCalculations[category].revenueWithVAT : categoryCalculations[category].revenue) * categoryCalculations[category].taxRate / 100;
    }
  };

  return {
    calculateVATToBePaid,
    calculateIncomeTax
  };
};

export default useTaxCalculations; 