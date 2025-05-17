'use client';
import { useIntegrationsStore } from '@/app/(DashboardLayout)/integrations/store/integrations';
import useCommission from '@/lib/hooks/useCommission';
import categoryCommissions from '@/utils/categoryCommissions.json';
import {
  Box,
  Paper,
  Stack,
  Typography
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CategoryData, useCalculations, useCalculator } from '../context/CalculatorContext';
import useCalculatorReset, { CardKey, VisibleCards } from '../hooks/useCalculatorReset';
import useFormatting from '../hooks/useFormatting';
import useSavedCalculations, { SavedCalculation } from '../hooks/useSavedCalculations';
import useSectionToggle from '../hooks/useSectionToggle';
import { useProfitStore } from '../store/profitStore';
import CalculatorControls from './layout/CalculatorControls';
import CalculatorHeader from './layout/CalculatorHeader';
import MobileSaveButton from './layout/MobileSaveButton';
import useProducts from '@/lib/hooks/useProducts';
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
import { toast } from 'react-hot-toast';
import { useCommissionLoading } from '../context/CommissionLoadingContext';
import axios from 'axios';
import React from 'react';

const Calculator = () => {
  const { t } = useTranslation();
  // integrationsData removed since it's no longer used
  const { integrations } = useIntegrationsStore();
  const { products: queryProducts, isLoading: productsLoading, error: productsError, refetch: refetchProducts } = useProducts();
  const { fetchCommission, error: commissionError, isCached } = useCommission();
  const { isLoading: commissionLoading, setIsLoading: setCommissionLoading } = useCommissionLoading();
  
  // Add state for directly fetched products
  const [directProducts, setDirectProducts] = useState<any[]>([]);
  const [isDirectFetching, setIsDirectFetching] = useState(false);
  
  // Function to directly fetch products from the API
  const fetchProductsDirectly = async () => {
    try {
      setIsDirectFetching(true);
      console.log('Calculator: Directly fetching products from API...');
      
      const response = await fetch('/api/db/product-offers', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include' // Include cookies for authentication
      });
      
      const data = await response.json();
      console.log('Calculator: Direct API response:', data);
      
      if (data.success && data.data && Array.isArray(data.data.productOffers)) {
        console.log(`Calculator: Successfully fetched ${data.data.productOffers.length} products directly`);
        setDirectProducts(data.data.productOffers);
      } else {
        console.error('Calculator: API returned invalid data structure:', data);
        setDirectProducts([]);
      }
    } catch (error) {
      console.error('Calculator: Error fetching products directly:', error);
      setDirectProducts([]);
    } finally {
      setIsDirectFetching(false);
    }
  };
  
  // Fetch products directly on component mount
  useEffect(() => {
    fetchProductsDirectly();
  }, []);
  
  // Use either direct products or query products, with direct products taking priority
  const products = directProducts.length > 0 ? directProducts : queryProducts;
  
  // Move selectedProduct state declaration before the hooks that use it
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  
  const {
    savedCalculations,
    loadingSavedCalculations,
    savedCalculationsError,
    currentSavedCalculationId,
    currentSavedCalculationTitle,
    currentSavedCalculationDescription,
    currentSavedCalculationImage,
    openSaveModal,
    handleSaveSuccess,
    loadSavedCalculation,
    resetSavedCalculation,
    setOpenSaveModal,
    
  } = useSavedCalculations();

  // Use a ref instead of state for the product map to avoid re-renders
  const productIdMapRef = React.useRef<Map<string, any>>(new Map());
  
  // Update product map whenever products change
  useEffect(() => {
    console.log('Updating product ID map...');
    const newMap = new Map<string, any>();
    
    if (products && products.length > 0) {
      products.forEach((product: any) => {
        // Get all possible ID forms for each product
        const ids = [];
        
        // Add MongoDB ID if available
        if (product._id) {
          ids.push(product._id.toString());
        }
        
        // Add eMAG product offer ID if available
        if (product.emagProductOfferId) {
          ids.push(product.emagProductOfferId.toString());
        }
        
        // Store the product under each possible ID
        ids.forEach(id => {
          newMap.set(id, product);
        });
      });
      
      console.log(`Built product map with ${newMap.size} entries`);
    }
    
    // Update the ref instead of state
    productIdMapRef.current = newMap;
  }, [products]);

  // Define a helper function to get product name by value
  const getProductNameByValue = (value: string, calculationsParam?: SavedCalculation[]): string | undefined => {
    // Check if it's a saved calculation
    if (value.startsWith('saved-')) {
      const savedCalcsToUse = calculationsParam || savedCalculations;
      const calculationId = value.replace('saved-', '');
      const savedCalculation = savedCalcsToUse.find(calc => calc._id === calculationId);
      if (savedCalculation) {
        return savedCalculation.title;
      }
      return 'Saved Calculation';
    }
    
    // Check if it's an eMAG product
    if (value.startsWith('emag-')) {
      const parts = value.split('-');
      if (parts.length < 3) {
        return 'Unknown eMAG Product';
      }
      
      const integrationId = parts[1];
      const productId = parts[2];
      
      // Try to find product using both integrationId and emagProductOfferId
      // Look through products array with strict matching
      const foundProduct = products.find((p: any) => {
        // Check integration ID match first
        const integrationMatches = typeof p.integrationId === 'object' 
          ? p.integrationId?._id?.toString() === integrationId 
          : p.integrationId?.toString() === integrationId;
        
        // Then check product ID match (try emagProductOfferId first)
        const productMatches = p.emagProductOfferId?.toString() === productId;
        
        return integrationMatches && productMatches;
      });
      
      if (foundProduct) {
        return foundProduct.name;
      }
      
      // If not found with strict match, try with MongoDB _id
      const foundByMongoId = products.find((p: any) => {
        const integrationMatches = typeof p.integrationId === 'object' 
          ? p.integrationId?._id?.toString() === integrationId 
          : p.integrationId?.toString() === integrationId;
        
        const productMatches = p._id?.toString() === productId;
        
        return integrationMatches && productMatches;
      });
      
      if (foundByMongoId) {
        return foundByMongoId.name;
      }
      
      // Final fallback - try by product ID only (less reliable)
      const foundByIdOnly = products.find((p: any) => 
        p.emagProductOfferId?.toString() === productId || 
        p._id?.toString() === productId
      );
      
      if (foundByIdOnly) {
        return foundByIdOnly.name;
      }
      
      // Check saved calculations for this eMAG product
      const savedWithEmagProduct = savedCalculations.find(
        calc => calc.emagProduct && 
                calc.emagProduct.integrationId === integrationId && 
                calc.emagProduct.productId === productId
      );
      
      if (savedWithEmagProduct) {
        return savedWithEmagProduct.title;
      }
      
      return `eMAG Product ${productId.slice(0, 8)}`;
    }
    
    // For other product types
    return undefined;
  };

  // Update the handleSaveCalculation function to include visibleCards
  const handleSaveCalculation = async () => {
    // Check if an eMAG product is selected
    if (selectedProduct && selectedProduct.startsWith('emag-') && selectedProduct.split('-').length > 2) {
      try {
        const [prefix, integrationId, productId] = selectedProduct.split('-');
        
        // Create FormData for the request
        const formData = new FormData();
        
        // Add eMAG product data as JSON string
        formData.append('emagProduct', JSON.stringify({
          integrationId,
          productId,
          selectedProduct // Store the full product identifier
        }));
        
        // Add calculator state as JSON string, including visibleCards state
        const calculatorStateWithVisibleCards = {
          ...state,
          visibleCards // Include visibleCards state
        };
        formData.append('calculatorState', JSON.stringify(calculatorStateWithVisibleCards));
        
        // Create a direct API request to save the calculation
        const response = await fetch('/api/calculations', {
          method: 'POST',
          body: formData,
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.message || 'Failed to save calculation');
        }
        
        // Show a success toast
        toast.success('Calculation saved successfully!');
        
        // Refresh saved calculations list
        handleSaveSuccess();
      } catch (err) {
        console.error('Error saving calculation:', err);
        // Show an error toast
        toast.error(err instanceof Error ? err.message : 'Failed to save calculation');
      }
    } else {
      // For non-eMAG products, open the save modal
      setOpenSaveModal(true);
    }
  };

  // Add handler for when a new calculation is saved
  const handleSaveComplete = async (newCalculationId: string) => {
    // Automatically select the newly created calculation
    setSelectedProduct(`saved-${newCalculationId}`);
    
    // Load the saved calculation data to populate title and description
    await loadSavedCalculation(newCalculationId);
    
    // Show success message
    toast.success('Calculation saved and selected!');
  };

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

  // Add this function inside the Calculator component before handleSelectProduct
  const fetchIntegrationDetails = async (integrationId: string) => {
    try {
      const response = await axios.get(`/api/integrations/${integrationId}`);
      if (response.data && response.data.success) {
        return response.data.integration;
      }
      return null;
    } catch (error) {
      console.error('Error fetching integration details:', error);
      return null;
    }
  };

  // Handle product selection
  const handleSelectProduct = async (value: string) => {
    console.log('handleSelectProduct called with value:', value);
    
    // Skip processing if value is null or undefined
    if (!value) {
      console.log('Empty product value, resetting calculator');
      resetCalculatorValues();
      setSelectedProduct('');
      return;
    }
    
    // Skip processing if value contains "undefined"
    if (value.includes('undefined')) {
      console.error('Invalid product ID detected:', value);
      toast.error('Invalid product selected. Please try another product.');
      return;
    }
    
    console.log('Setting selectedProduct to:', value);
    setSelectedProduct(value);
    
    // Handle saved calculations
    if (value.startsWith('saved-')) {
      console.log('Loading saved calculation:', value);
      resetCalculatorValues();
      const calculationId = value.replace('saved-', '');
      await loadSavedCalculation(calculationId);
      return;
    }
    
    // Reset calculator values for all other types
    resetCalculatorValues();
    
    // Handle eMAG product selection
    if (value.startsWith('emag-') && value.split('-').length > 2) {
      console.log('Processing eMAG product:', value);
      const [prefix, integrationId, productId] = value.split('-');
      console.log('Split values:', { prefix, integrationId, productId });
      
      // Log all available products to help with debugging
      console.log('Available products:', 
        products.map((p: any) => ({
          id: p._id?.toString(),
          emagId: p.emagProductOfferId?.toString(),
          name: p.name,
          integrationId: typeof p.integrationId === 'object' ? p.integrationId?._id : p.integrationId
        }))
      );
      
      // First check if there's a saved calculation for this eMAG product
      const emagSavedCalculation = savedCalculations.find(
        calc => calc.emagProduct && 
                calc.emagProduct.integrationId === integrationId && 
                calc.emagProduct.productId === productId
      );
      
      if (emagSavedCalculation) {
        console.log('Found saved calculation for this eMAG product:', emagSavedCalculation._id);
        await loadSavedCalculation(emagSavedCalculation._id);
        return;
      }
      
      // If no saved calculation, process as standard eMAG product
      console.log('Processing as standard eMAG product');
      console.log('Looking for product in products array with length:', products.length);
      
      // Try to find the product in different ways to ensure we catch all possible formats
      let productOffer = null;
      
      // First try direct match with both integrationId and emagProductOfferId
      productOffer = products.find((p: any) => {
        // Check if integration ID matches (handle both string and object forms)
        const integrationMatches = typeof p.integrationId === 'object' 
          ? p.integrationId?._id?.toString() === integrationId 
          : p.integrationId?.toString() === integrationId;
          
        // Check if product ID matches emagProductOfferId specifically
        const productMatches = p.emagProductOfferId?.toString() === productId;
        
        return integrationMatches && productMatches;
      });
      
      if (!productOffer) {
        // If not found with emagProductOfferId, try with MongoDB _id
        console.log('Direct match with emagProductOfferId failed, trying with MongoDB _id...');
        productOffer = products.find((p: any) => {
          // Check if integration ID matches (handle both string and object forms)
          const integrationMatches = typeof p.integrationId === 'object' 
            ? p.integrationId?._id?.toString() === integrationId 
            : p.integrationId?.toString() === integrationId;
            
          // Check if product ID matches MongoDB _id
          const productMatches = p._id?.toString() === productId;
          
          return integrationMatches && productMatches;
        });
      }
      
      if (!productOffer) {
        // Try a more lenient match if strict match failed - match by product ID only
        console.log('Direct match failed, trying looser matching by product ID only...');
        productOffer = products.find((p: any) => {
          // Match only by product ID (either emagProductOfferId or _id)
          return (p.emagProductOfferId?.toString() === productId) || 
                 (p._id?.toString() === productId);
        });
      }
      
      if (productOffer) {
        console.log('Found product offer:', productOffer);
        
        const salePrice = productOffer.sale_price || 0;
        const anyProductOffer: any = productOffer;
        
        // Immediately update the sale price for all categories
        Object.keys(state.categories).forEach((category) => {
          dispatch({
            type: 'UPDATE_CATEGORY',
            payload: { 
              category: category as keyof typeof state.categories, 
              data: { salePrice }
            }
          });
        });
        
        // Get product offer ID from product for commission calculation
        const productOfferId = anyProductOffer.emagProductOfferId ? anyProductOffer.emagProductOfferId.toString() : null;
        
        // Fetch commission from API if product offer ID exists
        let commission: number | null = null;
        
        if (productOfferId) {
          try {
            // Set commission source to emag before fetching to show loading state immediately
            dispatch({ type: 'SET_COMMISSION_SOURCE', payload: 'emag' });
            
            // Set loading state to true before fetching
            setCommissionLoading(true);
            
            // Fetch commission from API using product offer ID
            commission = await fetchCommission(productOfferId);
            
            // Set loading state to false after fetching
            setCommissionLoading(false);
            
            if (commission !== null) {
              // Set commission in the global state
              dispatch({ type: 'SET_EMAG_COMMISSION', payload: commission.toString() });
              
              // Update commission for all categories
              Object.keys(state.categories).forEach((category) => {
                dispatch({
                  type: 'UPDATE_CATEGORY',
                  payload: { 
                    category: category as keyof typeof state.categories, 
                    data: { commission: commission as number }
                  }
                });
              });
            } else {
              // Fallback to static JSON if API fails
              let fallbackCommission = 0;
              if (productOfferId in categoryCommissions) {
                fallbackCommission = categoryCommissions[productOfferId as keyof typeof categoryCommissions] * 100;
              }
              
              dispatch({ type: 'SET_EMAG_COMMISSION', payload: fallbackCommission.toString() });
              dispatch({ type: 'SET_COMMISSION_SOURCE', payload: 'emag' });
              
              // Update commission for all categories
              Object.keys(state.categories).forEach((category) => {
                dispatch({
                  type: 'UPDATE_CATEGORY',
                  payload: { 
                    category: category as keyof typeof state.categories, 
                    data: { commission: fallbackCommission }
                  }
                });
              });
            }
          } catch (error) {
            // Set loading state to false in case of error
            setCommissionLoading(false);
            
            console.error('Error fetching commission:', error);
            
            // Fallback to static JSON
            let fallbackCommission = 0;
            if (productOfferId in categoryCommissions) {
              fallbackCommission = categoryCommissions[productOfferId as keyof typeof categoryCommissions] * 100;
            }
            
            dispatch({ type: 'SET_EMAG_COMMISSION', payload: fallbackCommission.toString() });
            dispatch({ type: 'SET_COMMISSION_SOURCE', payload: 'emag' });
            
            // Update commission for all categories
            Object.keys(state.categories).forEach((category) => {
              dispatch({
                type: 'UPDATE_CATEGORY',
                payload: { 
                  category: category as keyof typeof state.categories, 
                  data: { commission: fallbackCommission }
                }
              });
            });
          }
        }
        
        // Get integration details
        let integrationDetails = integrations.find(integration => integration._id === integrationId);
        
        if (!integrationDetails) {
          // If not found in store, fetch it directly
          integrationDetails = await fetchIntegrationDetails(integrationId);
        }

        console.log('Integration details:', integrationDetails);

        if (integrationDetails && integrationDetails.accountType === 'FBE') {
          console.log('Setting visible cards for FBE only');
          setVisibleCards({ 'FBM-NonGenius': false, 'FBM-Genius': false, 'FBE': true });
        } else {
          console.log('Setting visible cards for all calculator types');
          setVisibleCards({ 'FBM-NonGenius': true, 'FBM-Genius': true, 'FBE': true });
        }
        return;
      } else {
        // If product not found, show an error toast
        console.error('Product not found with IDs:', { integrationId, productId });
        toast.error('Selected product could not be found. Please try another product.');
      }
    }
    // For integration products with colon separator
    else if (value.includes(':')) {
      const [integrationId, productId] = value.split(':');
      
      const productOffer = products.find((p: any) => 
        p.integrationId === integrationId && 
        (String(p.emagProductOfferId) === productId || 
         String(p._id) === productId)
      );
      
      if (productOffer) {
        const salePrice = productOffer.sale_price || 0;
        const anyProductOffer: any = productOffer;
        
        // Immediately update the sale price for all categories
        Object.keys(state.categories).forEach((category) => {
          dispatch({
            type: 'UPDATE_CATEGORY',
            payload: { 
              category: category as keyof typeof state.categories, 
              data: { salePrice }
            }
          });
        });
        
        // Get product offer ID from product for commission calculation
        const productOfferId = anyProductOffer.emagProductOfferId ? anyProductOffer.emagProductOfferId.toString() : null;
        
        // Fetch commission from API if product offer ID exists
        let commission: number | null = null;
        
        if (productOfferId) {
          try {
            // Set commission source to emag before fetching to show loading state immediately
            dispatch({ type: 'SET_COMMISSION_SOURCE', payload: 'emag' });
            
            // Set loading state to true before fetching
            setCommissionLoading(true);
            
            // Fetch commission from API using product offer ID
            commission = await fetchCommission(productOfferId);
            
            // Set loading state to false after fetching
            setCommissionLoading(false);
            
            if (commission !== null) {
              // Set commission in the global state
              dispatch({ type: 'SET_EMAG_COMMISSION', payload: commission.toString() });
              
              // Update commission for all categories
              Object.keys(state.categories).forEach((category) => {
                dispatch({
                  type: 'UPDATE_CATEGORY',
                  payload: { 
                    category: category as keyof typeof state.categories, 
                    data: { commission: commission as number }
                  }
                });
              });
            } else {
              // Fallback to static JSON if API fails
              let fallbackCommission = 0;
              if (productOfferId in categoryCommissions) {
                fallbackCommission = categoryCommissions[productOfferId as keyof typeof categoryCommissions] * 100;
              }
              
              dispatch({ type: 'SET_EMAG_COMMISSION', payload: fallbackCommission.toString() });
              dispatch({ type: 'SET_COMMISSION_SOURCE', payload: 'emag' });
              
              // Update commission for all categories
              Object.keys(state.categories).forEach((category) => {
                dispatch({
                  type: 'UPDATE_CATEGORY',
                  payload: { 
                    category: category as keyof typeof state.categories, 
                    data: { commission: fallbackCommission }
                  }
                });
              });
            }
          } catch (error) {
            // Set loading state to false in case of error
            setCommissionLoading(false);
            
            console.error('Error fetching commission:', error);
            
            // Fallback to static JSON
            let fallbackCommission = 0;
            if (productOfferId in categoryCommissions) {
              fallbackCommission = categoryCommissions[productOfferId as keyof typeof categoryCommissions] * 100;
            }
            
            dispatch({ type: 'SET_EMAG_COMMISSION', payload: fallbackCommission.toString() });
            dispatch({ type: 'SET_COMMISSION_SOURCE', payload: 'emag' });
            
            // Update commission for all categories
            Object.keys(state.categories).forEach((category) => {
              dispatch({
                type: 'UPDATE_CATEGORY',
                payload: { 
                  category: category as keyof typeof state.categories, 
                  data: { commission: fallbackCommission }
                }
              });
            });
          }
        }
        
        // Get integration details
        let integrationDetails = integrations.find(integration => integration._id === integrationId);
        
        if (!integrationDetails) {
          // If not found in store, fetch it directly
          integrationDetails = await fetchIntegrationDetails(integrationId);
        }

        console.log('Integration details (colon notation):', integrationDetails);

        if (integrationDetails && integrationDetails.accountType === 'FBE') {
          console.log('Setting visible cards for FBE only (colon notation)');
          setVisibleCards({ 'FBM-NonGenius': false, 'FBM-Genius': false, 'FBE': true });
        } else {
          console.log('Setting visible cards for all calculator types (colon notation)');
          setVisibleCards({ 'FBM-NonGenius': true, 'FBM-Genius': true, 'FBE': true });
        }
      }
    }
    // Handle created products
    else if (value.startsWith('created-')) {
      console.log('Processing created product:', value);
      // Find the product in the static products
      const staticProduct = products.find((p: any) => p.id === value);
      if (staticProduct) {
        console.log('Found static product:', staticProduct);
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
      console.log('No specific product type matched, using default settings');
      // Show all calculators by default
      setVisibleCards({
        'FBM-NonGenius': true,
        'FBM-Genius': true,
        'FBE': true
      });
    }
  };

  // Add a helper to check if we're dealing with a saved calculation
  const isSavedCalculation: boolean = !!currentSavedCalculationId || 
    !!(selectedProduct && selectedProduct.startsWith('saved-'));

  // Listen for getVisibleCards event from SaveCalculationModal
  useEffect(() => {
    const handleGetVisibleCards = (event: CustomEvent) => {
      if (event.detail && typeof event.detail.callback === 'function') {
        // Send the current visibleCards state back via callback
        event.detail.callback(visibleCards);
      }
    };
    
    // Add event listener
    document.addEventListener('getVisibleCards', handleGetVisibleCards as EventListener);
    
    // Clean up
    return () => {
      document.removeEventListener('getVisibleCards', handleGetVisibleCards as EventListener);
    };
  }, [visibleCards]);

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
          onRefresh={fetchProductsDirectly}
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
          onOpenSaveModal={handleSaveCalculation}
          isSavedCalculation={isSavedCalculation}
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
        initialImage={currentSavedCalculationImage}
        onSaveComplete={handleSaveComplete}
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
        <MobileSaveButton 
          onOpenSaveModal={handleSaveCalculation} 
          isSavedCalculation={isSavedCalculation}
        />
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