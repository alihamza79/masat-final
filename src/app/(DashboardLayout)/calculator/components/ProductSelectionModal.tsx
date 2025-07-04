import React, { useEffect, useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Stack,
  Grid,
  Card,
  Divider,
  useTheme,
  Tabs,
  Tab,
  useMediaQuery,
  CircularProgress,
  TextField,
  InputAdornment,
  Skeleton,
  Tooltip,
  Button
} from '@mui/material';
import { 
  IconX, 
  IconBrandApple, 
  IconDeviceGamepad2, 
  IconShoppingCart, 
  IconBuildingStore,
  IconDots,
  IconAlertCircle,
  IconSearch,
  IconCircleX,
  IconPackage,
  IconDeviceLaptop,
  IconHeadphones,
  IconDeviceDesktop,
  IconShirt,
  IconDeviceMobile,
  IconTrash,
  IconRefresh
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { SavedCalculation } from '../hooks/useSavedCalculations';
import useProducts from '@/lib/hooks/useProducts';

// TabPanel component for switching between tabs
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && children}
    </div>
  );
}

interface ProductSelectionModalProps {
  open: boolean;
  onClose: () => void;
  selectedProduct: string;
  onSelectProduct: (value: string) => void;
  savedCalculations: SavedCalculation[];
  integrationsData?: Record<string, any>;
  // products, loading, and error are now provided by useProducts hook, so they're optional
  products?: any[];
  loading?: boolean;
  error?: string | null;
}

export type { ProductSelectionModalProps };

// Remove this entire static products object
const staticProducts = {
  emag: [
    {
      id: 'emag-1',
      name: 'Smartphone iPhone 15 Pro Max',
      category: 'Smartphones',
      price: '5999.99',
      brand: 'Apple',
      image: '/products/iphone.jpg'
    },
    {
      id: 'emag-2',
      name: 'Gaming Laptop ROG Strix',
      category: 'Laptops',
      price: '7499.99',
      brand: 'ASUS',
      image: '/products/laptop.jpg'
    },
    {
      id: 'emag-3',
      name: 'Smart TV OLED 65"',
      category: 'Televisions',
      price: '3999.99',
      brand: 'LG',
      image: '/products/tv.jpg'
    },
    {
      id: 'emag-4',
      name: 'Wireless Headphones',
      category: 'Audio',
      price: '899.99',
      brand: 'Sony',
      image: '/products/headphones.jpg'
    }
  ],
  
  created: [
    {
      id: 'created-1',
      name: 'Gaming Mouse RGB',
      category: 'Peripherals',
      price: '249.99',
      brand: 'Razer',
      image: '/products/mouse.jpg'
    },
    {
      id: 'created-2',
      name: 'Mechanical Keyboard',
      category: 'Peripherals',
      price: '499.99',
      brand: 'Corsair',
      image: '/products/keyboard.jpg'
    },
    {
      id: 'created-3',
      name: 'Gaming Headset',
      category: 'Audio',
      price: '349.99',
      brand: 'SteelSeries',
      image: '/products/headset.jpg'
    },
    {
      id: 'created-4',
      name: 'Gaming Monitor 27"',
      category: 'Displays',
      price: '1499.99',
      brand: 'ASUS',
      image: '/products/monitor.jpg'
    }
  ]
};

const ProductSkeleton = () => {
  const theme = useTheme();
  
  return (
    <Card
      sx={{
        p: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '12px',
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Stack spacing={1.5} height="100%">
        <Box sx={{ position: 'relative', width: '100%', paddingBottom: '100%' }}>
          <Skeleton 
            variant="rectangular" 
            sx={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              borderRadius: '8px',
              bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100'
            }} 
          />
        </Box>
        <Stack spacing={1} flex={1}>
          <Box>
            <Skeleton 
              variant="text" 
              width="70%" 
              height={20} 
              sx={{ 
                mb: 0.5,
                bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100'
              }} 
            />
            <Skeleton 
              variant="text" 
              width="90%" 
              height={16} 
              sx={{ 
                bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100'
              }} 
            />
          </Box>
          <Skeleton 
            variant="text" 
            width="40%" 
            height={20} 
            sx={{ 
              mt: 'auto',
              bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100'
            }} 
          />
        </Stack>
      </Stack>
    </Card>
  );
};

const ProductSelectionModal: React.FC<ProductSelectionModalProps> = ({
  open,
  onClose,
  selectedProduct,
  onSelectProduct,
  savedCalculations,
  integrationsData,
  // These props are now optional since we'll use the hook
  products: propProducts,
  loading: propLoading,
  error: propError
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Use the products hook to get products data
  const { products: hookProducts, isLoading: hookLoading, error: hookError, refetch } = useProducts();
  
  // Use hook data or fall back to props, but avoid object creation if possible
  const products = useMemo(() => {
    // If hook has products, use them
    if (hookProducts && hookProducts.length > 0) {
      return hookProducts;
    }
    // Otherwise use prop products if available
    return propProducts || [];
  }, [hookProducts, propProducts]);
  
  const loading = hookLoading || propLoading;
  const error = hookError ? String(hookError) : propError;
  
  const [activeTab, setActiveTab] = useState(0);
  const [emagProducts, setEmagProducts] = useState<any[]>([]);
  const [filteredEmagProducts, setFilteredEmagProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [savedSearchQuery, setSavedSearchQuery] = useState('');
  const [filteredSavedCalculations, setFilteredSavedCalculations] = useState<SavedCalculation[]>([]);
  const [loadingEmagProducts, setLoadingEmagProducts] = useState(false);
  const [deletingCalculationId, setDeletingCalculationId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Refetch products when modal opens
  useEffect(() => {
    if (open) {
      refetch();
    }
  }, [open, refetch]);

  // Debug log when the modal opens or products change
  
  
  // Helper function to process products consistently
  const processProducts = (productsToProcess: any[]) => {
    if (!Array.isArray(productsToProcess) || productsToProcess.length === 0) {
      console.log('No products to process in processProducts function');
      return;
    }
    
    try {
      console.log('Processing products, count:', productsToProcess.length);
      
      const allProducts = productsToProcess.map((product: any) => {
        if (!product) return null;
        
        // Use emagProductOfferId or _id (database ID) if present
        const productId = product.emagProductOfferId ? product.emagProductOfferId.toString() : 
                         (product._id ? product._id.toString() : null);
        
        if (!productId) {
          console.log('Skipping product without ID:', product);
          return null; // Skip this product
        }
        
        // Extract integration ID properly, handling different formats
        let integrationIdStr;
        
        try {
          if (typeof product.integrationId === 'object' && product.integrationId !== null) {
            // If integrationId is a populated document
            integrationIdStr = product.integrationId._id?.toString() || product.integrationId.id?.toString();
          } else if (product.integrationId) {
            // If integrationId is already a string or ID
            integrationIdStr = product.integrationId.toString();
          }
        } catch (err) {
          console.warn('Error extracting integration ID:', err);
        }
        
        // Use a fallback ID if no integration ID is available
        if (!integrationIdStr) {
          console.log('Product missing integration ID, using fallback:', product);
          integrationIdStr = 'unknown';
        }
        
        // Log the extracted IDs for debugging
        console.log(`Product ${product.name || 'unknown'}: Integration ID=${integrationIdStr}, Product ID=${productId}`);
        
        return {
          id: `emag-${integrationIdStr}-${productId}`,
          name: product.name || `Product ${productId}`,
          category: product.category || `Category ${product.category_id || 'Unknown'}`,
          price: (product.sale_price?.toString() || product.price?.toString() || '0'),
          brand: product.brand_name || product.brand || 'Unknown',
          image: (product.images && product.images[0]?.url) || product.image || '',
          originalData: product,
          // Store raw IDs to help with matching
          rawProductId: productId,
          rawIntegrationId: integrationIdStr,
          // Store part number and part number key for searching
          part_number: product.part_number || '',
          part_number_key: product.part_number_key || ''
        };
      }).filter(Boolean); // Remove null entries
      
      console.log('Processed product count:', allProducts.length);
      
      // Set the processed products
      setEmagProducts(allProducts);
      setFilteredEmagProducts(allProducts);
    } catch (err) {
      console.error('Error processing products:', err);
      setEmagProducts([]);
      setFilteredEmagProducts([]);
    }
  };

  // Extract and format eMAG product offers from integrations data
  useEffect(() => {
    console.log('Products array received in modal:', products);
    console.log('Products length:', products?.length || 0);
    
    // Skip processing if products is undefined, null, or empty to prevent unnecessary state updates
    if (!products || !Array.isArray(products) || products.length === 0) {
      console.log('No products to process, showing empty state');
      
      // Only update state if the current state has items (avoid unnecessary rerenders)
      if (emagProducts.length > 0 || filteredEmagProducts.length > 0) {
        setEmagProducts([]);
        setFilteredEmagProducts([]);
      }
      
      setLoadingEmagProducts(false);
      return;
    }
    
    // Process products only if there's actual data
    setLoadingEmagProducts(true);
    
    try {
      processProducts(products);
    } finally {
      setLoadingEmagProducts(false);
    }
  }, [products]);

  // Initialize filtered saved calculations
  useEffect(() => {
    // Filter out calculations that have emagProduct to ensure they don't show in the created products section
    const createdProductCalculations = savedCalculations.filter(calc => !calc.emagProduct);
    setFilteredSavedCalculations(createdProductCalculations);
  }, [savedCalculations]);

  // Filter products when search query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredEmagProducts(emagProducts);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = emagProducts.filter(product => 
        product.name.toLowerCase().includes(query) || 
        product.brand.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        // Add search by part_number and part_number_key
        (product.part_number && product.part_number.toLowerCase().includes(query)) ||
        (product.part_number_key && product.part_number_key.toLowerCase().includes(query)) ||
        // Also check in originalData in case they're not extracted to the top level
        (product.originalData?.part_number && product.originalData.part_number.toLowerCase().includes(query)) ||
        (product.originalData?.part_number_key && product.originalData.part_number_key.toLowerCase().includes(query))
      );
      setFilteredEmagProducts(filtered);
    }
  }, [searchQuery, emagProducts]);

  // Filter saved calculations when search query changes
  useEffect(() => {
    if (savedSearchQuery.trim() === '') {
      // Apply the same filter to ensure only created products show
      const createdProductCalculations = savedCalculations.filter(calc => !calc.emagProduct);
      setFilteredSavedCalculations(createdProductCalculations);
    } else {
      const query = savedSearchQuery.toLowerCase();
      const filtered = savedCalculations
        .filter(calc => !calc.emagProduct) // Filter out eMAG product calculations
        .filter(calculation => 
          calculation.title.toLowerCase().includes(query) || 
          (calculation.description && calculation.description.toLowerCase().includes(query))
        );
      setFilteredSavedCalculations(filtered);
    }
  }, [savedSearchQuery, savedCalculations]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleSavedSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSavedSearchQuery(event.target.value);
  };

  const handleClearSavedSearch = () => {
    setSavedSearchQuery('');
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const SectionHeader = ({ title, icon, color }: { title: string; icon: React.ReactNode; color: string }) => (
    <Stack spacing={1.5} sx={{ mb: 2 }}>
      <Stack 
        direction="row" 
        spacing={1.5} 
        alignItems="center"
      >
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '8px',
            bgcolor: `${color}.lighter`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: `${color}.main`,
          }}
        >
          {icon}
        </Box>
        <Box flex={1}>
          <Typography 
            variant="h6"
            sx={{ 
              fontSize: '14px',
              fontWeight: 600,
              color: theme.palette.mode === 'dark' ? 'grey.300' : 'grey.900',
              mb: 0.25
            }}
          >
            {title}
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              fontSize: '10px',
              color: 'text.secondary',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            {title === t('calculator.productSelection.emagProducts.title') 
              ? t('calculator.productSelection.emagProducts.subtitle')
              : t('calculator.productSelection.createdProducts.subtitle')}
          </Typography>
        </Box>
      </Stack>
      <Box 
        sx={{ 
          width: '100%', 
          height: '1px', 
          bgcolor: 'divider',
          opacity: 0.5
        }} 
      />
    </Stack>
  );

  const ProductCard = ({ product }: { product: any }) => (
    <Card
      onClick={() => {
        console.log('Product selected in modal:', product);
        console.log('Product ID format:', product.id);
        console.log('Raw IDs:', {
          rawProductId: product.rawProductId,
          rawIntegrationId: product.rawIntegrationId
        });
        console.log('Current selectedProduct value:', selectedProduct);
        
        // Make sure the ID format is correct: emag-[integrationId]-[productId]
        const correctId = `emag-${product.rawIntegrationId}-${product.rawProductId}`;
        console.log('Sending product ID:', correctId);
        
        // Use the correctly formatted ID
        onSelectProduct(correctId);
      }}
      sx={{
        p: 2,
        cursor: 'pointer',
        border: '1px solid',
        borderColor: (() => {
          // Check if the product is selected by comparing integrationId and productId
          if (selectedProduct && selectedProduct.startsWith('emag-')) {
            const parts = selectedProduct.split('-');
            if (parts.length >= 3) {
              const selectedIntegrationId = parts[1];
              const selectedProductId = parts[2];
              
              // Match by both integration ID and product ID
              if (selectedIntegrationId === product.rawIntegrationId &&
                  selectedProductId === product.rawProductId) {
                return 'primary.main';
              }
            }
          }
          return 'divider';
        })(),
        bgcolor: (() => {
          // Check if the product is selected by comparing integrationId and productId
          if (selectedProduct && selectedProduct.startsWith('emag-')) {
            const parts = selectedProduct.split('-');
            if (parts.length >= 3) {
              const selectedIntegrationId = parts[1];
              const selectedProductId = parts[2];
              
              // Match by both integration ID and product ID
              if (selectedIntegrationId === product.rawIntegrationId &&
                  selectedProductId === product.rawProductId) {
                return 'primary.lighter';
              }
            }
          }
          return 'background.paper';
        })(),
        transition: 'all 0.2s ease-in-out',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '12px',
        '&:hover': {
          borderColor: 'primary.main',
          bgcolor: 'primary.lighter',
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4]
        }
      }}
    >
      <Stack spacing={1.5} height="100%">
        <Box
          sx={{
            width: '100%',
            height: '0',
            paddingBottom: '100%', // Make it square with 1:1 aspect ratio
            position: 'relative',
            bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50',
            borderRadius: '8px',
            overflow: 'hidden'
          }}
        >
          {product.image ? (
            <Box
              component="img"
              src={product.image} 
              alt={product.name}
              sx={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
              onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                // If image fails to load, show a generic image icon instead
                e.currentTarget.style.display = 'none';
                
                // Find parent and add icon
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  // Create icon container if it doesn't exist
                  let iconContainer = parent.querySelector('.product-icon-fallback') as HTMLElement;
                  
                  if (!iconContainer) {
                    iconContainer = document.createElement('div');
                    iconContainer.className = 'product-icon-fallback';
                    iconContainer.style.position = 'absolute';
                    iconContainer.style.top = '0';
                    iconContainer.style.left = '0';
                    iconContainer.style.width = '100%';
                    iconContainer.style.height = '100%';
                    iconContainer.style.display = 'flex';
                    iconContainer.style.alignItems = 'center';
                    iconContainer.style.justifyContent = 'center';
                    iconContainer.style.backgroundColor = theme.palette.mode === 'dark' ? '#2a3441' : '#f5f5f5';
                    
                    // Create icon element with a generic image icon
                    const iconEl = document.createElement('div');
                    iconEl.style.opacity = '0.7';
                    iconEl.style.color = theme.palette.mode === 'dark' ? '#90a4ae' : '#607d8b';
                    
                    // Generic image icon
                    iconEl.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-photo" width="32" height="32" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M15 8h.01"></path><path d="M4 4m0 3a3 3 0 0 1 3 -3h10a3 3 0 0 1 3 3v10a3 3 0 0 1 -3 3h-10a3 3 0 0 1 -3 -3z"></path><path d="M4 15l4 -4a3 5 0 0 1 3 0l5 5"></path><path d="M14 14l1 -1a3 5 0 0 1 3 0l2 2"></path></svg>';
                    
                    iconContainer.appendChild(iconEl);
                    parent.appendChild(iconContainer);
                  } else {
                    // Show the existing fallback
                    iconContainer.style.display = 'flex';
                  }
                }
              }}
            />
          ) : (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.palette.mode === 'dark' ? '#2a3441' : '#f5f5f5'
              }}
            >
              <Typography 
                className="fallback-icon"
                variant="h3" 
                color={theme.palette.mode === 'dark' ? '#90a4ae' : '#607d8b'}
                sx={{ opacity: 0.7, display: 'block' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                  <path d="M15 8h.01"></path>
                  <path d="M4 4m0 3a3 3 0 0 1 3 -3h10a3 3 0 0 1 3 3v10a3 3 0 0 1 -3 3h-10a3 3 0 0 1 -3 -3z"></path>
                  <path d="M4 15l4 -4a3 5 0 0 1 3 0l5 5"></path>
                  <path d="M14 14l1 -1a3 5 0 0 1 3 0l2 2"></path>
                </svg>
              </Typography>
            </Box>
          )}
        </Box>
        <Stack spacing={1} flex={1}>
          <Box>
            <Tooltip title={product.name.length > 50 ? product.name : ""} enterDelay={500} arrow>
              <Typography 
                variant="subtitle1"
                sx={{ 
                  fontSize: '13px',
                  fontWeight: 600,
                  mb: 0.5,
                  color: theme.palette.mode === 'dark' ? 'grey.300' : 'grey.900',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical'
                }}
              >
                {product.name.length > 50 ? `${product.name.substring(0, 50)}...` : product.name}
              </Typography>
            </Tooltip>
            <Stack 
              direction="row" 
              spacing={1} 
              alignItems="center"
              divider={
                <Box 
                  sx={{ 
                    width: '3px', 
                    height: '3px', 
                    borderRadius: '50%', 
                    bgcolor: 'text.disabled' 
                  }} 
                />
              }
            >
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ fontSize: '11px' }}
              >
                {product.brand}
              </Typography>
              
            </Stack>
          </Box>
          <Typography 
            variant="body2"
            color="primary.main"
            sx={{ 
              fontSize: '14px',
              fontWeight: 600,
              mt: 'auto'
            }}
          >
            {product.price} {t('calculator.productSelection.price')}
          </Typography>
        </Stack>
      </Stack>
    </Card>
  );

  const handleDeleteCalculation = async (calculationId: string) => {
    setDeletingCalculationId(calculationId);
    
    try {
      const response = await fetch(`/api/calculations/${calculationId}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete calculation');
      }
      
      const updatedSavedCalculations = savedCalculations.filter(calc => calc._id !== calculationId);
      
      if (selectedProduct === `saved-${calculationId}`) {
        onSelectProduct('');
      }
      
      toast.success(t('calculator.productSelection.calculationDeleted'));
      
      window.location.reload();
    } catch (error) {
      console.error('Error deleting calculation:', error);
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setDeletingCalculationId(null);
      setConfirmDelete(null);
    }
  };

  const SavedCalculationCard = ({ calculation }: { calculation: SavedCalculation }) => {
    const isDeleting = deletingCalculationId === calculation._id;
    const isConfirmingDelete = confirmDelete === calculation._id;
    
    const handleCardClick = (e: React.MouseEvent) => {
      if (isConfirmingDelete) {
        e.stopPropagation();
        return;
      }
      
      onSelectProduct(`saved-${calculation._id}`);
    };
    
    const handleDeleteClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      
      if (isConfirmingDelete) {
        handleDeleteCalculation(calculation._id);
      } else {
        setConfirmDelete(calculation._id);
      }
    };
    
    const handleCancelDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      setConfirmDelete(null);
    };
    
    return (
      <Card
        onClick={handleCardClick}
        sx={{
          p: 2,
          cursor: isConfirmingDelete ? 'default' : 'pointer',
          border: '1px solid',
          borderColor: isConfirmingDelete 
            ? 'error.light' 
            : selectedProduct === `saved-${calculation._id}` 
              ? 'success.main' 
              : 'divider',
          bgcolor: isConfirmingDelete 
            ? 'error.lighter' 
            : selectedProduct === `saved-${calculation._id}` 
              ? 'success.lighter' 
              : 'background.paper',
          transition: 'all 0.2s ease-in-out',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '12px',
          position: 'relative',
          overflow: 'hidden',
          '&:hover': {
            borderColor: isConfirmingDelete 
              ? 'error.main' 
              : 'success.main',
            transform: 'translateY(-2px)',
            boxShadow: theme.shadows[4],
            '& .delete-button': {
              opacity: 1,
            }
          }
        }}
      >
        {!calculation.emagProduct && (
          <>
            {isConfirmingDelete ? (
              // Confirmation overlay
              <Box 
                sx={{ 
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  bgcolor: 'error.lighter',
                  zIndex: 5,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 2,
                  animation: 'fadeIn 0.2s ease-in-out',
                  '@keyframes fadeIn': {
                    '0%': {
                      opacity: 0,
                    },
                    '100%': {
                      opacity: 1,
                    },
                  },
                }}
              >
                <Typography 
                  variant="body2" 
                  color="error.main"
                  sx={{ 
                    fontWeight: 600,
                    textAlign: 'center',
                    mb: 2
                  }}
                >
                  {t('calculator.productSelection.confirmDelete')}
                </Typography>
                
                <Stack 
                  direction="row" 
                  spacing={1} 
                  justifyContent="center"
                >
                  <IconButton 
                    size="small" 
                    color="error" 
                    onClick={handleDeleteClick}
                    disabled={isDeleting}
                    sx={{ 
                      p: 1,
                      bgcolor: 'error.main',
                      color: 'white',
                      '&:hover': { 
                        bgcolor: 'error.dark',
                      },
                      '&.Mui-disabled': {
                        bgcolor: 'error.main',
                        opacity: 0.7,
                        color: 'white',
                      }
                    }}
                  >
                    {isDeleting ? (
                      <CircularProgress size={16} thickness={5} color="inherit" />
                    ) : (
                      <IconTrash size={16} />
                    )}
                  </IconButton>
                  <IconButton 
                    size="small" 
                    onClick={handleCancelDelete}
                    sx={{ 
                      p: 1,
                      bgcolor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'divider',
                      color: 'text.primary',
                      '&:hover': { 
                        bgcolor: 'background.default'
                      },
                      '&.Mui-disabled': {
                        opacity: 0.5,
                      }
                    }}
                    disabled={isDeleting}
                  >
                    <IconX size={16} />
                  </IconButton>
                </Stack>
              </Box>
            ) : (
              // Delete button (visible on hover)
              <IconButton 
                className="delete-button"
                size="small" 
                color="default" 
                onClick={handleDeleteClick}
                sx={{ 
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  zIndex: 1,
                  p: 0.5,
                  opacity: 0,
                  transition: 'all 0.2s ease-in-out',
                  bgcolor: 'background.paper',
                  '&:hover': { 
                    color: 'error.main',
                    bgcolor: 'error.lighter'
                  },
                  boxShadow: theme.shadows[1],
                }}
              >
                <IconTrash size={16} />
              </IconButton>
            )}
          </>
        )}
        
        <Stack spacing={1.5} height="100%" sx={{ opacity: isConfirmingDelete ? 0.2 : 1 }}>
          <Box
            sx={{
              width: '100%',
              height: '0',
              paddingBottom: '100%', // Make it square with 1:1 aspect ratio
              position: 'relative',
              bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50',
              borderRadius: '8px',
              overflow: 'hidden'
            }}
          >
            {calculation.image && calculation.image !== '/products/default.jpg' ? (
              <Box
                component="img"
                src={calculation.image}
                alt={calculation.title}
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
                onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                  // If image fails to load, show the default icon instead
                  e.currentTarget.style.display = 'none';
                  const fallbackIcon = (e.currentTarget.parentNode as HTMLElement).querySelector('.fallback-icon') as HTMLElement;
                  if (fallbackIcon) {
                    fallbackIcon.style.display = 'block';
                  }
                }}
              />
            ) : (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Typography 
                  className="fallback-icon"
                  variant="h3" 
                  color="success.main"
                  sx={{ opacity: 0.7, display: 'block' }}
                >
                  <IconBuildingStore size={32} />
                </Typography>
              </Box>
            )}
          </Box>
          <Stack spacing={1} flex={1}>
            <Box>
              <Tooltip title={calculation.title.length > 50 ? calculation.title : ""} enterDelay={500} arrow>
                <Typography 
                  variant="subtitle1"
                  sx={{ 
                    fontSize: '13px',
                    fontWeight: 600,
                    mb: 0.5,
                    color: theme.palette.mode === 'dark' ? 'grey.300' : 'grey.900',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}
                >
                  {calculation.title.length > 50 ? `${calculation.title.substring(0, 50)}...` : calculation.title}
                </Typography>
              </Tooltip>
              {calculation.description && (
                <Tooltip title={calculation.description} enterDelay={500} arrow>
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ 
                      fontSize: '11px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {calculation.description}
                  </Typography>
                </Tooltip>
              )}
            </Box>
            <Typography 
              variant="body2"
              color="success.main"
              sx={{ 
                fontSize: '12px',
                fontWeight: 500,
                mt: 'auto'
              }}
            >
              {new Date(calculation.createdAt).toLocaleDateString()}
            </Typography>
          </Stack>
        </Stack>
      </Card>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: { xs: 0, sm: 2 },
          maxHeight: { xs: '100vh', sm: '90vh' },
          height: { xs: '100%', sm: '90vh' },
          m: { xs: 0, sm: 3 },
          width: { xs: '100%', sm: 'auto' },
          minWidth: { sm: '800px' },
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <DialogTitle sx={{ px: { xs: 2, sm: 2.5 }, py: 2 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography 
            variant="h6" 
            sx={{ 
              fontSize: { xs: '16px', sm: '18px' },
              fontWeight: 600,
              color: theme.palette.mode === 'dark' ? 'grey.300' : 'grey.900'
            }}
          >
            {t('calculator.productSelection.title')}
          </Typography>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: 'text.secondary',
              '&:hover': { color: 'text.primary' }
            }}
          >
            <IconX size={18} />
          </IconButton>
        </Stack>
      </DialogTitle>
      <Divider />

      {/* Mobile Tabs */}
      {isMobile && (
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              fontSize: '13px',
              fontWeight: 600,
              textTransform: 'none',
              minHeight: '48px',
              color: 'text.secondary',
              '&.Mui-selected': {
                color: 'primary.main'
              }
            }
          }}
        >
          <Tab 
            icon={<IconShoppingCart size={18} />}
            iconPosition="start"
            label={t('calculator.productSelection.emagProducts.title')}
          />
          <Tab 
            icon={<IconBuildingStore size={18} />}
            iconPosition="start"
            label={t('calculator.productSelection.createdProducts.title')}
          />
        </Tabs>
      )}

      <DialogContent sx={{ 
        p: { xs: 2, sm: 2.5 },
        flex: 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minHeight: { xs: 'calc(100vh - 120px)', sm: 'auto' }
      }}>
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={{ xs: 3, sm: 0 }}
          sx={{ 
            height: '100%',
            width: '100%',
            position: 'relative',
            minHeight: { sm: '500px' }
          }}
        >
          {/* eMAG Products */}
          <Box 
            sx={{ 
              display: { 
                xs: activeTab === 0 ? 'block' : 'none',
                sm: 'block'
              },
              width: { sm: '50%' },
              height: '100%',
              pr: { xs: 0, sm: 3 },
              position: 'relative'
            }}
          >
            {!isMobile && (
              <Box sx={{ mb: 2 }}>
                <SectionHeader 
                  title={t('calculator.productSelection.emagProducts.title')}
                  icon={<IconShoppingCart size={18} />}
                  color="primary"
                />
              </Box>
            )}
            
            {/* Search Input */}
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder={t('calculator.productSelection.searchProductsPlaceholder')}
                value={searchQuery}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconSearch size={18} />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton 
                        size="small" 
                        onClick={handleClearSearch}
                        sx={{ p: 0.5 }}
                      >
                        <IconCircleX size={16} />
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: {
                    borderRadius: '8px',
                    fontSize: '14px',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)'
                    }
                  }
                }}
              />
              {!loadingEmagProducts && (
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ 
                    display: 'block', 
                    mt: 0.5, 
                    fontSize: '11px',
                    textAlign: 'right'
                  }}
                >
                  {filteredEmagProducts.length} {t('calculator.productSelection.productsFound')}
                  {searchQuery.trim() !== '' && emagProducts.length > 0 && (
                    <> ({Math.round((filteredEmagProducts.length / emagProducts.length) * 100)}%)</>
                  )}
                </Typography>
              )}
            </Box>
            
            {/* Products Tab Content */}
            <TabPanel value={activeTab} index={0}>
              <Box 
                sx={{ 
                  position: 'absolute',
                  top: isMobile ? '90px' : '140px',
                  bottom: 0,
                  left: 0,
                  right: { xs: 0, sm: 3 },
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  pr: { sm: 1 },
                  pb: 1,
                  '&::-webkit-scrollbar': {
                    width: '8px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: 'rgba(0,0,0,0.1)',
                    borderRadius: '4px',
                  }
                }}
              >
                {/* Display products if loading */}
                {(loading || loadingEmagProducts) ? (
                  <Grid container spacing={1.5}>
                    {[...Array(8)].map((_, index) => (
                      <Grid item xs={12} sm={6} key={`skeleton-${index}`}>
                        <ProductSkeleton />
                      </Grid>
                    ))}
                  </Grid>
                ) : products && products.length > 0 ? (
                  // Display products if we have them
                  <Grid container spacing={1.5}>
                    {filteredEmagProducts.map((product) => (
                      <Grid item xs={12} sm={6} key={product.id || product.emagProductOfferId}>
                        <ProductCard product={product} />
                      </Grid>
                    ))}
                  </Grid>
                ) : searchQuery.trim() !== '' ? (
                  // Display "no results" message when searching
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    py: 4,
                    color: 'text.secondary'
                  }}>
                    <IconAlertCircle size={32} />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {t('calculator.productSelection.noProductsFound')}
                    </Typography>
                  </Box>
                ) : (
                  // Display better empty state message when no products are available
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    py: 4,
                    px: 3,
                    color: 'text.secondary'
                  }}>
                    <IconAlertCircle size={48} color="#FF9800" />
                    <Typography variant="h6" sx={{ mt: 2, color: 'text.primary', textAlign: 'center' }}>
                      No eMAG Products Available
                    </Typography>
                    
                    <Button 
                      variant="outlined" 
                      color="primary" 
                      size="small"
                      startIcon={<IconRefresh size={16} />}
                      sx={{ mt: 3 }}
                      onClick={() => {
                        // Force a full page reload to reset any stale caches
                        window.location.reload();
                      }}
                    >
                      Refresh Products
                    </Button>
                  </Box>
                )}
              </Box>
            </TabPanel>
          </Box>

          {/* Vertical Divider - Only show on desktop */}
          {!isMobile && (
            <Box
              sx={{
                width: '0.5px',
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                my: -2.5,
                mx: 0.5,
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '100%',
                  background: `linear-gradient(180deg, 
                    transparent 0%, 
                    ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} 15%, 
                    ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} 85%, 
                    transparent 100%
                  )`
                }
              }}
            />
          )}

          {/* Saved Calculations */}
          <Box 
            sx={{ 
              display: { 
                xs: activeTab === 1 ? 'block' : 'none',
                sm: 'block'
              },
              width: { sm: '50%' },
              height: '100%',
              pl: { xs: 0, sm: 3 },
              position: 'relative'
            }}
          >
            {!isMobile && (
              <Box sx={{ mb: 2 }}>
                <SectionHeader 
                  title={t('calculator.productSelection.createdProducts.title')}
                  icon={<IconBuildingStore size={18} />}
                  color="success"
                />
              </Box>
            )}
            
            {/* Search Input for Saved Calculations */}
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder={t('calculator.productSelection.searchSavedCalculations')}
                value={savedSearchQuery}
                onChange={handleSavedSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconSearch size={18} />
                    </InputAdornment>
                  ),
                  endAdornment: savedSearchQuery && (
                    <InputAdornment position="end">
                      <IconButton 
                        size="small" 
                        onClick={handleClearSavedSearch}
                        sx={{ p: 0.5 }}
                      >
                        <IconCircleX size={16} />
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: {
                    borderRadius: '8px',
                    fontSize: '14px',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)'
                    }
                  }
                }}
              />
              {!loading && savedCalculations.length > 0 && (
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ 
                    display: 'block', 
                    mt: 0.5, 
                    fontSize: '11px',
                    textAlign: 'right'
                  }}
                >
                  {filteredSavedCalculations.length} {t('calculator.productSelection.calculationsFound')}
                  {savedSearchQuery.trim() !== '' && (
                    <> ({Math.round((filteredSavedCalculations.length / savedCalculations.length) * 100)}%)</>
                  )}
                </Typography>
              )}
            </Box>
            
            {/* Scrollable Saved Calculations Container */}
            <Box 
              sx={{ 
                position: 'absolute',
                top: isMobile ? '90px' : '140px',
                bottom: 0,
                left: { xs: 0, sm: 3 },
                right: 0,
                overflowY: 'auto',
                overflowX: 'hidden',
                pl: { sm: 1 },
                pb: 1,
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: 'rgba(0,0,0,0.1)',
                  borderRadius: '4px',
                }
              }}
            >
              {loading ? (
                <Grid container spacing={1.5}>
                  {[...Array(4)].map((_, index) => (
                    <Grid item xs={12} sm={6} key={`saved-skeleton-${index}`}>
                      <ProductSkeleton />
                    </Grid>
                  ))}
                </Grid>
              ) : error ? (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  py: 4,
                  color: 'text.secondary'
                }}>
                  <IconAlertCircle size={32} />
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {error}
                  </Typography>
                </Box>
              ) : savedCalculations.length === 0 ? (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  py: 4,
                  color: 'text.secondary'
                }}>
                  <IconBuildingStore size={32} />
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {t('calculator.productSelection.noSavedCalculations')}
                  </Typography>
                </Box>
              ) : filteredSavedCalculations.length === 0 ? (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  py: 4,
                  color: 'text.secondary'
                }}>
                  <IconAlertCircle size={32} />
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {t('calculator.productSelection.noSavedCalculationsFound')}
                  </Typography>
                </Box>
              ) : (
                <Grid 
                  container 
                  spacing={1.5}
                >
                  {filteredSavedCalculations.map((calculation) => (
                    <Grid item xs={12} sm={6} key={calculation._id}>
                      <SavedCalculationCard calculation={calculation} />
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default ProductSelectionModal; 