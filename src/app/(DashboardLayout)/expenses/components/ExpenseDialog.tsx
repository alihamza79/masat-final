'use client';
import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  FormControlLabel,
  Switch,
  Typography,
  Box,
  InputAdornment,
  Autocomplete,
  Paper,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { 
  IconSearch, 
  IconPackage, 
  IconDeviceLaptop, 
  IconDeviceMobile, 
  IconHeadphones, 
  IconDeviceDesktop, 
  IconShirt,
  IconBrandApple,
  IconCalendar 
} from '@tabler/icons-react';
import useProducts from '@/lib/hooks/useProducts';
import { Expense, ExpenseType } from '@/lib/hooks/useExpenses';
import { format } from 'date-fns';

interface ExpenseDialogProps {
  open: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  expense?: Expense | null;
  onSave: (expense: Omit<Expense, '_id'> | Expense) => void;
  isSaving: boolean;
}

// Helper function to render product image or fallback icon
const ProductImage = ({ product, size = 'small' }: { product: any, size?: 'small' | 'large' }) => {
  const isSmall = size === 'small';
  const iconSize = isSmall ? 18 : 32;
  
  // Get the appropriate icon based on product category or name
  const getIcon = () => {
    const category = product.category?.toLowerCase() || '';
    const name = product.name?.toLowerCase() || '';
    
    if (product.brand === 'Apple' || name.includes('iphone') || name.includes('macbook') || name.includes('ipad')) {
      return <IconBrandApple size={iconSize} />;
    } else if (category.includes('laptop') || name.includes('laptop')) {
      return <IconDeviceLaptop size={iconSize} />;
    } else if (category.includes('audio') || name.includes('headphone') || name.includes('airpod') || name.includes('headset')) {
      return <IconHeadphones size={iconSize} />;
    } else if (category.includes('smartphone') || category.includes('phone') || name.includes('phone')) {
      return <IconDeviceMobile size={iconSize} />;
    } else if (category.includes('monitor') || category.includes('display') || name.includes('monitor')) {
      return <IconDeviceDesktop size={iconSize} />;
    } else if (category.includes('clothing') || category.includes('apparel') || name.includes('shirt') || name.includes('clothing')) {
      return <IconShirt size={iconSize} />;
    } else {
      // Default icon for other products
      return <IconPackage size={iconSize} />;
    }
  };

  // Check for image in different possible locations in the product object
  const getImageUrl = () => {
    // Direct image property (as used in our test)
    if (product.image) {
      return product.image;
    }
    
    // Array of images (as returned from API)
    if (product.images && product.images.length > 0 && product.images[0].url) {
      return product.images[0].url;
    }
    
    // No image found
    return null;
  };
  
  const imageUrl = getImageUrl();

  return (
    <Box
      sx={{
        width: isSmall ? 32 : '100%',
        height: isSmall ? 32 : '0',
        paddingBottom: isSmall ? 0 : '100%', // Make it square with 1:1 aspect ratio for large size
        position: 'relative',
        borderRadius: isSmall ? 0.5 : 1,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: theme => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50',
      }}
    >
      {imageUrl ? (
        <>
          <Box
            component="img"
            src={imageUrl}
            alt={product.name}
            sx={{
              position: isSmall ? 'static' : 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
              // If image fails to load, show the fallback icon
              e.currentTarget.style.display = 'none';
              const fallbackEl = e.currentTarget.parentElement?.querySelector('.fallback-icon');
              if (fallbackEl) {
                (fallbackEl as HTMLElement).style.display = 'flex';
              }
            }}
          />
          <Box 
            className="fallback-icon"
            sx={{
              position: isSmall ? 'static' : 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'none', // Hidden by default, shown on image error
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Typography 
              variant="h3" 
              color="text.secondary"
              sx={{ opacity: 0.7 }}
            >
              {getIcon()}
            </Typography>
          </Box>
        </>
      ) : (
        <Box
          sx={{
            position: isSmall ? 'static' : 'absolute',
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
            variant="h3" 
            color="text.secondary"
            sx={{ opacity: 0.7 }}
          >
            {getIcon()}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

const ExpenseDialog: React.FC<ExpenseDialogProps> = ({ 
  open, 
  onClose, 
  mode, 
  expense,
  onSave,
  isSaving
}) => {
  const [type, setType] = useState<ExpenseType>('one-time');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState<Date | null>(new Date());
  const [isRecurring, setIsRecurring] = useState(false);
  const [unitsCount, setUnitsCount] = useState('');
  const [costPerUnit, setCostPerUnit] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  const { products, isLoading: productsLoading } = useProducts();

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase().trim();
    return products.filter((product: any) => {
      return (
        product.name?.toLowerCase().includes(query) ||
        product.part_number?.toLowerCase().includes(query) ||
        product.part_number_key?.toLowerCase().includes(query)
      );
    }).slice(0, 10); // Limit to 10 results for performance
  }, [searchQuery, products]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      // Small timeout to allow animation to complete
      const timer = setTimeout(() => {
        setType('one-time');
        setDescription('');
        setAmount('');
        setDate(new Date());
        setIsRecurring(false);
        setUnitsCount('');
        setCostPerUnit('');
        setSearchQuery('');
        setSelectedProduct(null);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Populate form when editing an existing expense
  useEffect(() => {
    if (expense && mode === 'edit') {
      setType(expense.type);
      setDescription(expense.description || '');
      setAmount(expense.amount.toString());
      setDate(expense.date ? new Date(expense.date) : new Date());
      setIsRecurring(expense.isRecurring || false);
      
      if (expense.product) {
        // For COGS expenses, populate product fields
        setUnitsCount(expense.product.unitsCount.toString());
        setCostPerUnit(expense.product.costPerUnit.toString());
        
        // Create a product object for display
        setSelectedProduct({
          emagProductOfferId: expense.product.emagProductOfferId,
          name: expense.product.name,
          part_number: expense.product.part_number,
          part_number_key: expense.product.part_number_key,
          image: expense.product.image,
        });
      }
    }
  }, [expense, mode]);

  const handleProductSelect = (product: any) => {
    setSelectedProduct(product);
    if (product) {
      // Update expense with product details
      setDescription(product.name || '');
    }
  };

  const handleSubmit = () => {
    // Validate form
    if (type !== 'cogs' && !description.trim()) {
      return; // Description is required for non-COGS expenses
    }

    if (type !== 'cogs' && (!amount || isNaN(Number(amount)) || Number(amount) <= 0)) {
      return; // Valid amount is required for non-COGS expenses
    }

    if (!date) {
      return; // Date is required
    }

    if (type === 'cogs') {
      if (!selectedProduct) {
        return; // Product selection is required for COGS
      }
      
      if (!unitsCount || isNaN(Number(unitsCount)) || Number(unitsCount) <= 0) {
        return; // Valid units count is required for COGS
      }
      
      if (!costPerUnit || isNaN(Number(costPerUnit)) || Number(costPerUnit) <= 0) {
        return; // Valid cost per unit is required for COGS
      }
    }

    // Create expense object
    const expenseData: Omit<Expense, '_id'> = {
      type,
      description: type === 'cogs' && selectedProduct ? selectedProduct.name : description,
      amount: type === 'cogs' 
        ? Number(unitsCount) * Number(costPerUnit) 
        : Number(amount),
      date: date ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      isRecurring: (type === 'monthly' || type === 'annually') ? isRecurring : false,
    };

    // Add product details for COGS expenses
    if (type === 'cogs' && selectedProduct) {
      expenseData.product = {
        emagProductOfferId: selectedProduct.emagProductOfferId || selectedProduct._id || '',
        name: selectedProduct.name,
        part_number: selectedProduct.part_number || '',
        part_number_key: selectedProduct.part_number_key || '',
        image: getImageUrl(selectedProduct),
        unitsCount: Number(unitsCount),
        costPerUnit: Number(costPerUnit),
      };
    }

    // If editing, include the ID
    if (mode === 'edit' && expense?._id) {
      onSave({ ...expenseData, _id: expense._id });
    } else {
      onSave(expenseData);
    }
  };

  // Get image URL from product
  const getImageUrl = (product: any) => {
    if (product.image) {
      return product.image;
    }
    
    if (product.images && product.images.length > 0 && product.images[0].url) {
      return product.images[0].url;
    }
    
    return '';
  };

  const renderCogsFields = () => (
    <Stack spacing={3}>
      <Typography variant="subtitle1" sx={{ mt: 2 }}>
        Product Details
      </Typography>
      
      <Autocomplete
        value={selectedProduct}
        onChange={(_, newValue) => handleProductSelect(newValue)}
        getOptionLabel={(option) => option.name || ''}
        options={filteredProducts}
        loading={productsLoading}
        noOptionsText={searchQuery ? "No products found" : "Type to search"}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Search Product"
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <>
                  <InputAdornment position="start">
                    <IconSearch size={20} />
                  </InputAdornment>
                  {params.InputProps.startAdornment}
                </>
              ),
              endAdornment: (
                <>
                  {productsLoading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
            helperText="Search by name, SKU (part_number) or PNK (part_number_key)"
            fullWidth
          />
        )}
        renderOption={(props, option) => (
          <li {...props}>
            <Stack direction="row" spacing={1.5} width="100%" alignItems="center">
              {/* Small product image in dropdown */}
              <ProductImage product={option} size="small" />
              
              <Stack spacing={0.5} flex={1}>
                <Typography variant="body1" fontWeight={500}>
                  {option.name}
                </Typography>
                <Stack direction="row" spacing={1}>
                  {option.part_number && (
                    <Typography variant="caption" color="text.secondary">
                      SKU: {option.part_number}
                    </Typography>
                  )}
                  {option.part_number_key && (
                    <Typography variant="caption" color="text.secondary">
                      PNK: {option.part_number_key}
                    </Typography>
                  )}
                </Stack>
              </Stack>
            </Stack>
          </li>
        )}
        PaperComponent={(props) => (
          <Paper {...props} elevation={6} sx={{ mt: 0.5 }} />
        )}
      />

      {selectedProduct && (
        <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'action.hover' }}>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
              {/* Product Image Container - Fixed width container for large size */}
              <Box sx={{ 
                width: { xs: '100%', sm: 100 },
                maxWidth: { xs: '100%', sm: 100 },
                alignSelf: { xs: 'center', sm: 'flex-start' }
              }}>
                <ProductImage product={selectedProduct} size="large" />
              </Box>
              
              {/* Product Details */}
              <Stack spacing={1} width="100%">
                <Typography variant="subtitle1" fontWeight={600}>
                  {selectedProduct.name}
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  {selectedProduct.part_number && (
                    <Typography variant="body2">
                      <strong>SKU:</strong> {selectedProduct.part_number}
                    </Typography>
                  )}
                  {selectedProduct.part_number_key && (
                    <Typography variant="body2">
                      <strong>PNK:</strong> {selectedProduct.part_number_key}
                    </Typography>
                  )}
                </Stack>
                
                {/* Quantity and Cost fields within the product details */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mt={1.5}>
                  <TextField
                    label="Number of Units"
                    type="number"
                    value={unitsCount}
                    onChange={(e) => setUnitsCount(e.target.value)}
                    fullWidth
                    size="small"
                    InputProps={{
                      inputProps: { min: 0 },
                    }}
                  />
                  <TextField
                    label="Cost per Unit"
                    type="number"
                    value={costPerUnit}
                    onChange={(e) => setCostPerUnit(e.target.value)}
                    fullWidth
                    size="small"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">RON</InputAdornment>,
                      inputProps: { min: 0 },
                    }}
                  />
                </Stack>
              </Stack>
            </Stack>
          </Stack>
        </Box>
      )}
    </Stack>
  );

  return (
    <Dialog 
      open={open} 
      onClose={isSaving ? undefined : onClose} 
      maxWidth="sm" 
      fullWidth
    >
      <DialogTitle>
        {mode === 'add' ? 'Add New Expense' : 'Edit Expense'}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Type</InputLabel>
            <Select
              value={type}
              label="Type"
              onChange={(e) => setType(e.target.value as ExpenseType)}
              disabled={mode === 'edit'} // Don't allow changing type when editing
            >
              <MenuItem value="one-time">One Time</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="annually">Annually</MenuItem>
              <MenuItem value="cogs">COGS</MenuItem>
            </Select>
          </FormControl>

          {type !== 'cogs' && (
            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              required
            />
          )}

          {type !== 'cogs' && (
            <TextField
              label="Amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              fullWidth
              required
              InputProps={{
                startAdornment: <InputAdornment position="start">RON</InputAdornment>,
                inputProps: { min: 0 },
              }}
            />
          )}

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Date"
              value={date}
              onChange={(newDate) => {
                if (newDate) {
                  setDate(newDate as Date);
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  required
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconCalendar size={20} />
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />
          </LocalizationProvider>

          {(type === 'monthly' || type === 'annually') && (
            <FormControlLabel
              control={
                <Switch
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                />
              }
              label={`Recurring ${type === 'monthly' ? 'Monthly' : 'Annually'}`}
            />
          )}

          {type === 'cogs' && renderCogsFields()}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={onClose}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={isSaving}
          startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {isSaving ? 'Saving...' : (mode === 'add' ? 'Add' : 'Save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExpenseDialog; 