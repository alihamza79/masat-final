'use client';
import { useIntegrationsStore } from '@/app/(DashboardLayout)/integrations/store/integrations';
import { useEmagData } from '@/lib/hooks/useEmagData';
import categoryCommissions from '@/utils/categoryCommissions.json';
import {
  Box,
  Paper,
  Stack,
  Typography
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CategoryData, useCalculations, useCalculator } from '../context/CalculatorContext';
import useCalculatorReset, { CardKey, VisibleCards } from '../hooks/useCalculatorReset';
import useFormatting from '../hooks/useFormatting';
import useSavedCalculations from '../hooks/useSavedCalculations';
import useSectionToggle from '../hooks/useSectionToggle';
import { useProfitStore } from '../store/profitStore';
import CalculatorControls from './layout/CalculatorControls';
import CalculatorHeader from './layout/CalculatorHeader';
import MobileSaveButton from './layout/MobileSaveButton';
import useProductMenuItems from './layout/ProductMenuItems';
import ProductSelector from './layout/ProductSelector';
import SalesEstimator from './SalesEstimator/index';
import SaveCalculationModal from './SaveCalculationModal';
import CommissionSection from './sections/CommissionSection';
import ExpendituresSection from './sections/ExpendituresSection';
import FulfillmentSection from './sections/FulfillmentSection';
import ProductCostSection from './sections/ProductCostSection';
import ProfitSection from './sections/ProfitSection';
import SalesSection from './sections/SalesSection';
import TaxesSection from './sections/TaxesSection';

const Calculator = () => {
  const { t } = useTranslation();
  const { integrationsData } = useEmagData();
  const { integrations } = useIntegrationsStore();
  const { getAllMenuItems, getProductNameByValue, staticProducts } = useProductMenuItems();
  
  // Move selectedProduct state declaration before the hooks that use it
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  
  const {
    savedCalculations,
    loadingSavedCalculations,
    savedCalculationsError,
    currentSavedCalculationId,
    currentSavedCalculationTitle,
    currentSavedCalculationDescription,
    openSaveModal,
    handleSaveSuccess,
    loadSavedCalculation,
    resetSavedCalculation,
    setOpenSaveModal,
    
  } = useSavedCalculations();

  const {
    visibleCards,
    resetCalculatorValues,
    handleNewCalculation,
    setVisibleCards
  } = useCalculatorReset(resetSavedCalculation, setSelectedProduct);

  const { formatCurrency, formatPercentage } = useFormatting();


  const {
    expandedSections,
    isExpanded,
    isAnySectionExpanded,
    handleSectionToggle,
    handleToggleAll
  } = useSectionToggle();


  const { state, dispatch } = useCalculator();
  const { categoryCalculations, totals } = useCalculations();

  const handleDistributionChange = (distributions: Record<string, { pieces: number; percent: number }>) => {
    // Update the total pieces and distribution in the state
    const totalPieces = Object.values(distributions).reduce((sum, { pieces }) => sum + pieces, 0);
    dispatch({ type: 'SET_TOTAL_PIECES', payload: totalPieces });

    // Update each category's pieces and percentage
    Object.entries(distributions).forEach(([category, { pieces, percent }]) => {
      dispatch({
        type: 'UPDATE_CATEGORY',
        payload: {
          category: category as keyof typeof state.categories,
          data: {
            pieces,
            percentage: percent
          }
        }
      });
    });
  };

  const [openProductModal, setOpenProductModal] = useState(false);
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(null);

  const handleUpdateCategory = (category: string, data: Partial<CategoryData>) => {
    // Just pass the update directly to the reducer
    // The reducer will handle syncing based on the syncValues state
    dispatch({
      type: 'UPDATE_CATEGORY',
      payload: {
        category: category as keyof typeof state.categories,
        data: data,
      },
    });
  };

  const theme = useTheme();



  const handleCardVisibilityToggle = (cardKey: CardKey) => {
    setVisibleCards((prev: VisibleCards) => {
      // Count how many cards are currently visible
      const visibleCount = Object.values(prev).filter(Boolean).length;
      
      // If trying to turn off the last visible card, prevent it
      if (visibleCount === 1 && prev[cardKey] === true) {
        return prev;
      }
      
      // Otherwise, proceed with the toggle
      return {
        ...prev,
        [cardKey]: !prev[cardKey]
      };
    });
  };

  // Calculate how many cards are visible to determine flex basis
  const visibleCardCount = Object.values(visibleCards).filter(Boolean).length;
  const cardFlexBasis = visibleCardCount === 1 ? '70%' : visibleCardCount === 2 ? '48%' : '32%';

 
  const { netProfitValues, profitMarginValues } = useProfitStore();

  // Handle product selection
  const handleSelectProduct = async (value: string) => {
    setSelectedProduct(value);
    setOpenProductModal(false);
    
    if (!value) {
      // If no product is selected, reset the calculator
      resetCalculatorValues(); // Ensure SalesEstimator is reset
      return;
    }
    
    // Check if this is a saved calculation
    if (value.startsWith('saved-')) {
      // First reset to ensure clean state before loading saved calculation
      resetCalculatorValues();
      
      const calculationId = value.replace('saved-', '');
      await loadSavedCalculation(calculationId);
      return; // Return early to avoid other processing
    }
    
    // For all other product types, ensure we start with a clean state
    resetCalculatorValues(); // This also resets the SalesEstimator
    
    // If this is an integration product (contains : separator)
    if (value.includes(':')) {
      const [integrationId, productId] = value.split(':');
      
      // Load category commissions from the static mapping
      const categoryCommissions = {
        '3038': 0.05, // Example: 5% commission
        '2': 0.07, // Example: 7% commission
        // Add more mappings here as needed
      };
      
      // Find the product in the integrations data
      if (integrationsData && integrationsData[integrationId]) {
        const productOffer = integrationsData[integrationId].productOffers?.find(
          (p: any) => p.id.toString() === productId
        );
        
        if (productOffer) {
          // Update calculator state with product data - only set values that are available
          const salePrice = productOffer.sale_price || 0;
          
          // Get category ID and set commission if available
          // Using any type since category_id is not part of the official EmagProductOffer type
          const anyProductOffer = productOffer as any;
          const categoryId = anyProductOffer.category_id ? anyProductOffer.category_id.toString() : null;
          let commission: number | null = null;
          
          if (categoryId) {
            if (categoryId in categoryCommissions) {
              // Convert commission to percentage (multiply by 100)
              commission = categoryCommissions[categoryId as keyof typeof categoryCommissions] * 100;
            } else {
              // If category exists but not in our mapping, set commission to 0
              commission = 0;
            }
            
            // Update the global commission setting
            dispatch({ type: 'SET_EMAG_COMMISSION', payload: commission.toString() });
          }
          
          // Update all categories with the sale price and commission
          Object.keys(state.categories).forEach((category) => {
            const updateData: Partial<CategoryData> = { salePrice };
            
            // Add commission to update data if available
            if (commission !== null) {
              updateData.commission = commission;
            }
            
            dispatch({
              type: 'UPDATE_CATEGORY',
              payload: {
                category: category as keyof typeof state.categories,
                data: updateData
              },
            });
          });
          
          // Check if this integration is FBE type and update visible cards accordingly
          const integration = integrations.find(integration => integration._id === integrationId);
          if (integration && integration.accountType === 'FBE') {
            // For FBE integrations, only show the FBE calculator
            setVisibleCards({
              'FBM-NonGenius': false,
              'FBM-Genius': false,
              'FBE': true
            });
          } else {
            // For non-FBE integrations, show all calculators
            setVisibleCards({
              'FBM-NonGenius': true,
              'FBM-Genius': true,
              'FBE': true
            });
          }
        }
      }
    }
    // Handle legacy static product format
    else if (value.startsWith('emag-') && value.split('-').length > 2) {
      // Reset all values first
      resetCalculatorValues();
      
      // If it's a new format eMAG product (emag-integrationId-productId)
      if (value.split('-').length > 2) {
        const [prefix, integrationId, productId] = value.split('-');
        
        // Find the product in the integrations data
        if (integrationsData && integrationsData[integrationId]) {
          const productOffer = integrationsData[integrationId].productOffers?.find(
            (p: any) => p.id.toString() === productId
          );
          
          if (productOffer) {
            // Update calculator state with product data - only set values that are available
            const salePrice = productOffer.sale_price || 0;
            
            // Get category ID and set commission if available
            // Using any type since category_id is not part of the official EmagProductOffer type
            const anyProductOffer = productOffer as any;
            const categoryId = anyProductOffer.category_id ? anyProductOffer.category_id.toString() : null;
            let commission: number | null = null;
            
            if (categoryId) {
              if (categoryId in categoryCommissions) {
                // Convert commission to percentage (multiply by 100)
                commission = categoryCommissions[categoryId as keyof typeof categoryCommissions] * 100;
              } else {
                // If category exists but not in our mapping, set commission to 0
                commission = 0;
              }
              
              // Update the global commission setting
              dispatch({ type: 'SET_EMAG_COMMISSION', payload: commission.toString() });
            }
            
            // Update all categories with the sale price and commission
            Object.keys(state.categories).forEach((category) => {
              const updateData: Partial<CategoryData> = { salePrice };
              
              // Add commission to update data if available
              if (commission !== null) {
                updateData.commission = commission;
              }
              
                  dispatch({
                    type: 'UPDATE_CATEGORY',
                    payload: {
                      category: category as keyof typeof state.categories,
                  data: updateData
                },
              });
            });
            
            // Check if this integration is FBE type and update visible cards accordingly
            const integration = integrations.find(integration => integration._id === integrationId);
            if (integration && integration.accountType === 'FBE') {
              // For FBE integrations, only show the FBE calculator
              setVisibleCards({
                'FBM-NonGenius': false,
                'FBM-Genius': false,
                'FBE': true
              });
            } else {
              // For non-FBE integrations, show all calculators
              setVisibleCards({
                'FBM-NonGenius': true,
                'FBM-Genius': true,
                'FBE': true
              });
            }
          }
        }
      }
      // Handle legacy static product format
      else {
        // Find the product in the static products
        const staticProduct = staticProducts.emag.find(p => p.id === value);
        if (staticProduct) {
          const salePrice = parseFloat(staticProduct.price);
          
          // For static products, check if we have a category in the name (for demo purposes)
          // Example: if the product name contains "Category 3038", we can extract that
          const categoryMatch = staticProduct.name.match(/Category (\d+)/);
          let commission: number | null = null;
          
          if (categoryMatch && categoryMatch[1]) {
            const matchedCategoryId = categoryMatch[1];
            if (matchedCategoryId in categoryCommissions) {
              // Convert commission to percentage (multiply by 100)
              commission = categoryCommissions[matchedCategoryId as keyof typeof categoryCommissions] * 100;
            } else {
              // If category exists but not in our mapping, set commission to 0
              commission = 0;
            }
            
            // Update the global commission setting
            dispatch({ type: 'SET_EMAG_COMMISSION', payload: commission.toString() });
          }
          
          // Update all categories with the sale price and commission
          Object.keys(state.categories).forEach((category) => {
            const updateData: Partial<CategoryData> = { salePrice };
            
            // Add commission to update data if available
            if (commission !== null) {
              updateData.commission = commission;
            }
            
                  dispatch({
                    type: 'UPDATE_CATEGORY',
                    payload: {
                      category: category as keyof typeof state.categories,
                data: updateData
              },
                  });
                });
          
          // For static products, show all calculators
          setVisibleCards({
            'FBM-NonGenius': true,
            'FBM-Genius': true,
            'FBE': true
            });
          }
        }
    }
    // Handle created products
    else if (value.startsWith('created-')) {
      // Reset all values first
      resetCalculatorValues();
      
      // Find the product in the static products
      const staticProduct = staticProducts.created.find(p => p.id === value);
      if (staticProduct) {
        const salePrice = parseFloat(staticProduct.price);
        
        // Update all categories with only the sale price
        Object.keys(state.categories).forEach((category) => {
          dispatch({
            type: 'UPDATE_CATEGORY',
            payload: {
              category: category as keyof typeof state.categories,
              data: { 
                salePrice
                // Don't set product cost if not available in data
              },
            },
          });
        });
        
        // For created products, show all calculators
        setVisibleCards({
          'FBM-NonGenius': true,
          'FBM-Genius': true,
          'FBE': true
        });
      }
    } else {
      // Show all calculators by default
      setVisibleCards({
        'FBM-NonGenius': true,
        'FBM-Genius': true,
        'FBE': true
      });
    }
  };

  return (
    <Box>
      {/* Header */}
      <CalculatorHeader onNewCalculation={handleNewCalculation} />

      {/* Controls */}
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        spacing={{ xs: 2, sm: 2, md: 3 }} 
        justifyContent="space-between" 
        alignItems={{ xs: 'stretch', sm: 'center' }}
        mb={{ xs: 2, sm: 3 }}
      >
        {/* Product Selection Button */}
        <ProductSelector
            selectedProduct={selectedProduct}
            onSelectProduct={handleSelectProduct}
          getProductNameByValue={getProductNameByValue}
            savedCalculations={savedCalculations}
          loadingSavedCalculations={loadingSavedCalculations}
          savedCalculationsError={savedCalculationsError}
          integrationsData={integrationsData}
          />

        {/* Controls Stack */}
        <CalculatorControls
          syncValues={state.syncValues}
          onSyncValuesChange={(value) => dispatch({ type: 'SET_SYNC_VALUES', payload: value })}
          isExpanded={isExpanded}
          isAnySectionExpanded={isAnySectionExpanded}
          onToggleAll={handleToggleAll}
          visibleCards={visibleCards}
          onCardVisibilityToggle={handleCardVisibilityToggle}
          onOpenSaveModal={() => setOpenSaveModal(true)}
        />
      </Stack>

      {/* Save Calculation Modal */}
      <SaveCalculationModal
        open={openSaveModal}
        onClose={() => setOpenSaveModal(false)}
        calculatorState={state}
        onSaveSuccess={handleSaveSuccess}
        savedCalculationId={currentSavedCalculationId}
        initialTitle={currentSavedCalculationTitle}
        initialDescription={currentSavedCalculationDescription}
      />

      {/* Category Cards */}
      <Box sx={{ 
        display: 'flex', 
        width: '100%',
        justifyContent: 'center',
        flexDirection: 'column',
        alignItems: visibleCardCount === 1 ? 'center' : 'stretch'
      }}>
        <Stack 
          direction={{ xs: 'column', md: 'row' }} 
          spacing={{ xs: 2, sm: 2.5, md: 2 }}
          sx={{
            flexWrap: 'nowrap',
            justifyContent: 'center',
            width: visibleCardCount === 1 ? '65%' : '100%',
            margin: '0 auto',
            '& > .MuiPaper-root': {
              flex: { xs: '1 1 100%', md: '1 1 0%' },
              display: 'flex',
              flexDirection: 'column',
              minWidth: { md: '300px' }
            }
          }}
        >
          {(Object.entries(state.categories) as [keyof typeof state.categories, CategoryData][])
            .filter(([category]) => visibleCards[category as CardKey])
            .map(([category, data]) => (
              <Paper
                key={category}
                elevation={0}
                sx={{
                  p: { xs: 1.5, sm: 2 },
                  border: '1px solid',
                  borderColor: 'divider',
                  width: { lg: `${cardFlexBasis}` }
                }}
              >
                <Typography 
                  variant="h6" 
                  gutterBottom
                  sx={{ 
                    fontSize: { xs: '13px', sm: '14px' },
                    textAlign: { xs: 'center', sm: 'left' }
                  }}
                >
                  {t(`calculator.cards.${category}`)}
                </Typography>

                {/* Net Profit & Margin Summary */}
                <Stack 
                  direction={{ xs: 'row', sm: 'row' }} 
                  spacing={2} 
                  mb={2}
                  sx={{
                    '& .MuiPaper-root': {
                      flex: 1,
                      p: { xs: 1.5, sm: 2 },
                      bgcolor: 'background.neutral'
                    }
                  }}
                >
                  <Paper>
                    <Typography 
                      variant="caption" 
                      color="textSecondary"
                      sx={{ fontSize: { xs: '10px', sm: '11px' } }}
                    >
                      {t('calculator.sections.profit.netProfit')}
                    </Typography>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontSize: { xs: '14px', sm: '16px' },
                        color: (() => {
                          const netProfit = netProfitValues[category];
                          return isNaN(netProfit) || !isFinite(netProfit) ? 'text.secondary' : netProfit >= 0 ? 'success.main' : 'error.main';
                        })()
                      }}
                    >
                      {(() => {
                        const netProfit = netProfitValues[category];
                        return formatCurrency(isNaN(netProfit) || !isFinite(netProfit) ? 0 : netProfit);
                      })()}
                    </Typography>
                  </Paper>
                  <Paper>
                    <Typography 
                      variant="caption" 
                      color="textSecondary"
                      sx={{ fontSize: { xs: '10px', sm: '11px' } }}
                    >
                      {t('calculator.sections.profit.profitMargin')}
                    </Typography>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontSize: { xs: '14px', sm: '16px' },
                        color: (() => {
                          const marginProfit = profitMarginValues[category];
                          return isNaN(marginProfit) || !isFinite(marginProfit) ? 'text.secondary' : marginProfit >= 0 ? 'success.main' : 'error.main';
                        })()
                      }}
                    >
                      {(() => {
                        const marginProfit = profitMarginValues[category];
                        return formatPercentage(isNaN(marginProfit) || !isFinite(marginProfit) ? 0 : marginProfit);
                      })()}
                    </Typography>
                  </Paper>
                </Stack>

                {/* Section Components */}
                <Stack spacing={1.5}>
                  <SalesSection
                    category={category as CardKey}
                    data={data}
                    expandedSections={expandedSections[category as CardKey]}
                    formatCurrency={formatCurrency}
                    vatRate={state.vatRate}
                    onToggle={handleSectionToggle as (category: string, section: string) => void}
                    onUpdateCategory={handleUpdateCategory}
                    profileType={state.profileType}
                    calculations={categoryCalculations[category]}
                  />

                  <CommissionSection
                    category={category as CardKey}
                    data={data}
                    expandedSections={expandedSections[category as CardKey]}
                    formatCurrency={formatCurrency}
                    vatRate={19}
                    onToggle={handleSectionToggle as (category: string, section: string) => void}
                    onUpdateCategory={handleUpdateCategory}
                  />

                  <FulfillmentSection
                    category={category as CardKey}
                    data={data}
                    expandedSections={expandedSections[category as CardKey]}
                    formatCurrency={formatCurrency}
                    vatRate={19}
                    onToggle={handleSectionToggle as (category: string, section: string) => void}
                    onUpdateCategory={handleUpdateCategory}
                  />

                  <ExpendituresSection
                    category={category as CardKey}
                    data={data}
                    expandedSections={expandedSections[category as CardKey]}
                    formatCurrency={formatCurrency}
                    vatRate={19}
                    onToggle={handleSectionToggle as (category: string, section: string) => void}
                    onUpdateCategory={handleUpdateCategory}
                  />

                  <ProductCostSection
                    category={category as CardKey}
                    data={data}
                    expandedSections={expandedSections[category as CardKey]}
                    formatCurrency={formatCurrency}
                    vatRate={19}
                    onToggle={handleSectionToggle as (category: string, section: string) => void}
                    onUpdateCategory={handleUpdateCategory}
                    purchaseType={state.purchaseType}
                    vatRateOfPurchase={state.vatRateOfPurchase}
                    state={state}
                  />

                  <TaxesSection
                    category={category as CardKey}
                    data={data}
                    expandedSections={expandedSections[category as CardKey]}
                    formatCurrency={formatCurrency}
                    vatRate={state.vatRate}
                    vatRateOfPurchase={state.vatRateOfPurchase}
                    onToggle={handleSectionToggle as (category: string, section: string) => void}
                    calculations={categoryCalculations[category]}
                    profileType={state.profileType}
                    purchaseType={state.purchaseType}
                    salesHeaderValue={state.profileType === 'vat' ? (data.salePrice + data.shippingPrice) * (1 + state.vatRate/100) : data.salePrice + data.shippingPrice}
                    commissionHeaderValue={-((data.salePrice + data.shippingPrice) * (data.commission / 100) * (1 + 0.19))}
                    fulfillmentHeaderValue={-((category === 'FBE' 
                      ? 0 
                      : category === 'FBM-Genius' 
                        ? 5 * (1 + 0.19) 
                        : data.fulfillmentShippingCost * (1 + 0.19)) + 
                      data.fulfillmentCost * (1 + 0.19))}
                    expendituresHeaderValue={-(data.otherExpenses || 0) * (1 + 0.19)}
                    productCostHeaderValue={state.purchaseType === 'china' 
                      ? -(data.productCost + data.shippingCost + (data.productCost * data.customsDuty / 100) + ((data.productCost + data.shippingCost + (data.productCost * data.customsDuty / 100)) * 0.19))
                      : -(data.productCost + data.shippingCost)}
                  />

                  <ProfitSection
                    category={category}
                    data={data}
                    expandedSections={expandedSections[category as CardKey]}
                    formatCurrency={formatCurrency}
                    formatPercentage={formatPercentage}
                    calculations={categoryCalculations[category]}
                    onToggle={handleSectionToggle as (category: string, section: string) => void}
                    profileType={state.profileType}
                    purchaseType={state.purchaseType}
                    vatRate={state.vatRate}
                  />
                </Stack>
              </Paper>
            ))}
        </Stack>

        {/* Save Calculation Button - Show only on mobile, after cards */}
        <MobileSaveButton onOpenSaveModal={() => setOpenSaveModal(true)} />
      </Box>

      {/* Sales Estimator Section */}
      <Box sx={{ mt: 5 }}>
        <SalesEstimator
          onDistributionChange={handleDistributionChange}
          taxRate={state.taxRate}
          visibleCards={visibleCards}
          selectedProduct={selectedProduct}
        />
      </Box>
    </Box>
  );
};

export default Calculator;