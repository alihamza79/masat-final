'use client';
import {
  Box,
  Button,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Typography,
  Menu
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { IconChevronRight, IconDeviceFloppy, IconLayoutCollage, IconLayoutGrid, IconPackage, IconSettings } from '@tabler/icons-react';
import { useState } from 'react';
import { CategoryData, useCalculations, useCalculator } from '../context/CalculatorContext';
import ProductSelectionModal from './ProductSelectionModal';
import CommissionSection from './sections/CommissionSection';
import ExpendituresSection from './sections/ExpendituresSection';
import FulfillmentSection from './sections/FulfillmentSection';
import ProductCostSection from './sections/ProductCostSection';
import ProfitSection from './sections/ProfitSection';
import SalesSection from './sections/SalesSection';
import TaxesSection from './sections/TaxesSection';
import SalesEstimator from './SalesEstimator';
import { useTaxStore } from '../store/taxStore';
import { useSalesStore } from '../store/salesStore';
import { useCommissionStore } from '../store/commissionStore';
import { useFulfillmentStore } from '../store/fulfillmentStore';
import { useExpenditureStore } from '../store/expenditureStore';
import { useProductCostStore } from '../store/productCostStore';
import { useProfitStore } from '../store/profitStore';

interface MenuItem {
  value: string;
  label: string;
}

type CardKey = 'FBM-NonGenius' | 'FBM-Genius' | 'FBE';
type VisibleCards = Record<CardKey, boolean>;
type SectionKey = 'sales' | 'commission' | 'fulfillment' | 'expenditures' | 'productCost' | 'taxes' | 'profit';
type ExpandedSections = Record<CardKey, Record<SectionKey, boolean>>;

const Calculator = () => {
  const allMenuItems: MenuItem[] = [
    { value: 'emag-1', label: 'iPhone 14 Pro Max' },
    { value: 'emag-2', label: 'MacBook Air M2' },
    { value: 'emag-3', label: 'AirPods Pro 2' },
    { value: 'created-1', label: 'Gaming Mouse RGB' },
    { value: 'created-2', label: 'Mechanical Keyboard' },
    { value: 'created-3', label: 'Gaming Headset' }
  ];

  const [selectedProduct, setSelectedProduct] = useState('emag-1');
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

  const [isExpanded, setIsExpanded] = useState(true);
  const [openProductModal, setOpenProductModal] = useState(false);
  const [visibleCards, setVisibleCards] = useState<VisibleCards>({
    'FBM-NonGenius': true,
    'FBM-Genius': true,
    'FBE': true
  });
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(null);
  const [expandedSections, setExpandedSections] = useState<ExpandedSections>({
    'FBM-NonGenius': {
      sales: true,
      commission: true,
      fulfillment: true,
      expenditures: true,
      productCost: true,
      taxes: true,
      profit: true,
    },
    'FBM-Genius': {
      sales: true,
      commission: true,
      fulfillment: true,
      expenditures: true,
      productCost: true,
      taxes: true,
      profit: true,
    },
    'FBE': {
      sales: true,
      commission: true,
      fulfillment: true,
      expenditures: true,
      productCost: true,
      taxes: true,
      profit: true,
    },
  });

  const handleSectionToggle = (category: CardKey, section: SectionKey) => {
    setExpandedSections(prev => {
      const newValue = !prev[category][section];
      return Object.keys(prev).reduce((acc, cat) => ({
        ...acc,
        [cat]: {
          ...prev[cat as CardKey],
          [section]: newValue,
        },
      }), {} as ExpandedSections);
    });
  };

  const handleToggleAll = () => {
    const shouldExpand = !isAnySectionExpanded;
    setIsExpanded(shouldExpand);
    setExpandedSections(prev => 
      Object.keys(prev).reduce((acc, category) => ({
        ...acc,
        [category]: Object.keys(prev[category as keyof ExpandedSections]).reduce((secAcc, section) => ({
          ...secAcc,
          [section]: shouldExpand,
        }), {} as Record<SectionKey, boolean>),
      }), {} as ExpandedSections)
    );
  };

  const formatCurrency = (value: number, includeCurrency: boolean = true) => 
    `${value.toFixed(2)}${includeCurrency ? ' RON' : ''}`;

  const formatPercentage = (value: number) =>
    `${value.toFixed(2)}%`;

  const handleUpdateCategory = (category: string, data: Partial<CategoryData>) => {
    if (state.syncValues && (data.salePrice !== undefined || data.shippingPrice !== undefined || data.otherExpenses !== undefined)) {
      Object.keys(state.categories).forEach((cat) => {
        dispatch({
          type: 'UPDATE_CATEGORY',
          payload: {
            category: cat as keyof typeof state.categories,
            data: {
              ...data,
              // Force shipping price to 0 for non-FBM-NonGenius categories
              ...(data.shippingPrice !== undefined && cat !== 'FBM-NonGenius' ? { shippingPrice: 0 } : {})
            },
          },
        });
      });
    } else {
      dispatch({
        type: 'UPDATE_CATEGORY',
        payload: {
          category: category as keyof typeof state.categories,
          data: {
            ...data,
            // Force shipping price to 0 for non-FBM-NonGenius categories
            ...(data.shippingPrice !== undefined && category !== 'FBM-NonGenius' ? { shippingPrice: 0 } : data)
          },
        },
      });
    }
  };

  const theme = useTheme();

  const handleSettingsClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setSettingsAnchorEl(event.currentTarget);
  };

  const handleSettingsClose = () => {
    setSettingsAnchorEl(null);
  };

  const handleCardVisibilityToggle = (cardKey: CardKey) => {
    setVisibleCards(prev => {
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

  // Calculate VAT to be paid
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

  // Calculate how many cards are visible to determine flex basis
  const visibleCardCount = Object.values(visibleCards).filter(Boolean).length;
  const cardFlexBasis = visibleCardCount === 1 ? '70%' : visibleCardCount === 2 ? '48%' : '32%';

  const calculateIncomeTax = (category: string, data: CategoryData) => {
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

  const salesHeaderValues = useSalesStore((state) => state.salesHeaderValues);
  const commissionHeaderValues = useCommissionStore((state) => state.commissionHeaderValues);
  const fulfillmentHeaderValues = useFulfillmentStore((state) => state.fulfillmentHeaderValues);
  const expenditureHeaderValues = useExpenditureStore((state) => state.expenditureHeaderValues);
  const productCostHeaderValues = useProductCostStore((state) => state.productCostHeaderValues);
  const taxValues = useTaxStore((state) => state.taxValues);
  const { netProfitValues, profitMarginValues } = useProfitStore();

  const isAnySectionExpanded = Object.values(expandedSections).some(section => Object.values(section).includes(true));

  return (
    <Box>
      {/* Header */}
      <Typography 
        variant="h5" 
        sx={{ 
          fontSize: '24px',
          fontWeight: 600,
          mb: 4,
          color: 'text.primary'
        }}
      >
        Calculator
      </Typography>

      {/* Controls */}
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        spacing={{ xs: 2, sm: 2, md: 3 }} 
        justifyContent="space-between" 
        alignItems={{ xs: 'stretch', sm: 'center' }}
        mb={{ xs: 2, sm: 3 }}
      >
        {/* Product Selection Button */}
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={{ xs: 1.5, sm: 2 }} 
          alignItems={{ xs: 'stretch', sm: 'center' }}
          width={{ xs: '100%', sm: 'auto' }}
        >
          <Button
            variant="outlined"
            onClick={() => setOpenProductModal(true)}
            sx={{ 
              minWidth: { xs: '100%', sm: '280px', md: '320px' },
              maxWidth: '100%',
              height: { xs: '40px', sm: '35px' },
              justifyContent: 'space-between',
              px: { xs: 1.5, sm: 2 },
              py: 1,
              color: 'text.primary',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'transparent',
                color: 'text.primary'
              }
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <IconPackage size={18} />
              <Typography sx={{ fontSize: '13px' }}>
                {selectedProduct ? allMenuItems.find(item => item.value === selectedProduct)?.label : 'Select Product'}
              </Typography>
            </Stack>
            <IconChevronRight size={18} />
          </Button>

          <ProductSelectionModal 
            open={openProductModal}
            onClose={() => setOpenProductModal(false)}
            selectedProduct={selectedProduct}
            onSelectProduct={(value: string) => {
              setSelectedProduct(value);
              setOpenProductModal(false);
            }}
          />
        </Stack>

        {/* Controls Stack */}
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={2}
          alignItems={{ xs: 'stretch', sm: 'center' }}
        >
          {/* Desktop Controls */}
          <Stack 
            direction="row" 
            spacing={2}
            alignItems="center"
            sx={{ 
              display: { xs: 'none', sm: 'flex' }
            }}
          >
            {/* Sync Toggle */}
            <Box sx={{ 
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <Typography 
                variant="body2" 
                color="textSecondary"
                sx={{ fontSize: '12px' }}
              >
                Sync All Values
              </Typography>
              <Switch
                size="small"
                checked={state.syncValues}
                onChange={(e) => dispatch({ type: 'SET_SYNC_VALUES', payload: e.target.checked })}
              />
            </Box>

            {/* Expand/Collapse Button */}
            <Button
              variant="outlined"
              size="small"
              startIcon={isExpanded ? <IconLayoutCollage size={18} /> : <IconLayoutGrid size={18} />}
              onClick={handleToggleAll}
              sx={{
                height: '35px',
                px: 2,
                borderColor: theme.palette.divider,
                color: theme.palette.text.primary,
                bgcolor: theme.palette.background.paper,
                textTransform: 'none',
                fontSize: '13px',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                '&:hover': {
                  borderColor: theme.palette.text.primary,
                  bgcolor: 'transparent',
                  color: theme.palette.text.primary
                }
              }}
            >
              {isAnySectionExpanded ? 'Collapse All' : 'Expand All'}
            </Button>

            {/* Settings Button */}
            <Button
              variant="outlined"
              size="small"
              startIcon={<IconSettings size={18} />}
              onClick={handleSettingsClick}
              sx={{
                height: '35px',
                px: 2,
                borderColor: theme.palette.divider,
                color: theme.palette.text.primary,
                bgcolor: theme.palette.background.paper,
                textTransform: 'none',
                fontSize: '13px',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                '&:hover': {
                  borderColor: theme.palette.text.primary,
                  bgcolor: 'transparent',
                  color: theme.palette.text.primary
                }
              }}
            >
              Choose Calculator
            </Button>

            {/* Save Calculation Button */}
            <Button
              variant="contained"
              size="small"
              startIcon={<IconDeviceFloppy size={18} />}
              sx={{
                bgcolor: '#00c292',
                color: 'white',
                '&:hover': {
                  bgcolor: '#00a67d',
                },
                px: { sm: 2.5 },
                height: '35px',
                borderRadius: '8px',
                textTransform: 'none',
                fontSize: '13px',
                fontWeight: 500,
                boxShadow: 'none',
                minWidth: 'auto',
                whiteSpace: 'nowrap'
              }}
            >
              Save Calculation
            </Button>
          </Stack>

          {/* Mobile Controls */}
          <Box 
            sx={{ 
              display: { xs: 'block', sm: 'none' },
              width: '100%'
            }}
          >
            {/* Settings Button - Mobile */}
            <Button
              variant="outlined"
              size="small"
              startIcon={<IconSettings size={18} />}
              onClick={handleSettingsClick}
              sx={{
                height: '35px',
                px: 1,
                width: '100%',
                borderColor: theme.palette.divider,
                color: theme.palette.text.primary,
                bgcolor: theme.palette.background.paper,
                textTransform: 'none',
                fontSize: '12px',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                mb: 1,
                '&:hover': {
                  borderColor: theme.palette.text.primary,
                  bgcolor: 'transparent',
                  color: theme.palette.text.primary
                }
              }}
            >
              Choose Calculator
            </Button>

            {/* Sync and Expand Controls - Mobile */}
            <Stack 
              direction="row" 
              spacing={0}
              alignItems="center"
              justifyContent="space-between"
              width="100%"
            >
              <Box 
                sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5
                }}
              >
                <Typography 
                  variant="body2" 
                  color="textSecondary"
                  sx={{ fontSize: '11px' }}
                >
                  Sync All Values
                </Typography>
                <Switch
                  size="small"
                  checked={state.syncValues}
                  onChange={(e) => dispatch({ type: 'SET_SYNC_VALUES', payload: e.target.checked })}
                />
              </Box>

              <Button
                variant="outlined"
                size="small"
                startIcon={isExpanded ? <IconLayoutCollage size={18} /> : <IconLayoutGrid size={18} />}
                onClick={handleToggleAll}
                sx={{
                  height: '35px',
                  px: 1,
                  borderColor: theme.palette.divider,
                  color: theme.palette.text.primary,
                  bgcolor: theme.palette.background.paper,
                  textTransform: 'none',
                  fontSize: '12px',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    borderColor: theme.palette.text.primary,
                    bgcolor: 'transparent',
                    color: theme.palette.text.primary
                  }
                }}
              >
                {isAnySectionExpanded ? 'Collapse All' : 'Expand All'}
              </Button>
            </Stack>
          </Box>

          {/* Settings Menu */}
          <Menu
            anchorEl={settingsAnchorEl}
            open={Boolean(settingsAnchorEl)}
            onClose={handleSettingsClose}
            PaperProps={{
              sx: {
                mt: 1.5,
                boxShadow: theme.shadows[8],
                minWidth: 200
              }
            }}
          >
            <Typography
              variant="caption"
              sx={{
                px: 2,
                py: 1,
                display: 'block',
                color: 'text.secondary'
              }}
            >
              Show/Hide Cards
            </Typography>
            {(Object.keys(visibleCards) as CardKey[]).map((cardKey) => (
              <MenuItem
                key={cardKey}
                onClick={(e: React.MouseEvent<HTMLLIElement>) => {
                  const target = e.target as HTMLElement;
                  if (target.closest('.MuiSwitch-root')) {
                    return;
                  }
                  handleCardVisibilityToggle(cardKey);
                }}
                sx={{
                  py: 1,
                  px: 2
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1} width="100%">
                  <Switch
                    size="small"
                    checked={visibleCards[cardKey]}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleCardVisibilityToggle(cardKey);
                    }}
                    className="MuiSwitch-root"
                  />
                  <Typography variant="body2">
                    {cardKey === 'FBE' ? 'FBE - Fulfilled by EMAG' : cardKey}
                  </Typography>
                </Stack>
              </MenuItem>
            ))}
          </Menu>
        </Stack>
      </Stack>

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
                  {category === 'FBE' ? 'FBE - Fulfilled by EMAG' : category}
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
                      Net Profit
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
                      Profit Margin
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
        <Button
          variant="contained"
          size="small"
          startIcon={<IconDeviceFloppy size={18} />}
          sx={{
            display: { xs: 'flex', sm: 'none' },
            bgcolor: '#00c292',
            color: 'white',
            '&:hover': {
              bgcolor: '#00a67d',
            },
            px: 2.5,
            height: '40px',
            borderRadius: '8px',
            textTransform: 'none',
            fontSize: '13px',
            fontWeight: 500,
            boxShadow: 'none',
            width: '100%',
            mt: 3
          }}
        >
          Save Calculation
        </Button>
      </Box>

      {/* Sales Estimator Section */}
      <Box sx={{ mt: 5 }}>
        <SalesEstimator
          onDistributionChange={handleDistributionChange}
          taxRate={state.taxRate}
        />
      </Box>
    </Box>
  );
};

export default Calculator;