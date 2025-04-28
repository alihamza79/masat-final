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
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { 
  IconSearch, 
  IconPackage, 
  IconDeviceLaptop, 
  IconDeviceMobile, 
  IconHeadphones, 
  IconDeviceDesktop, 
  IconShirt,
  IconBrandApple 
} from '@tabler/icons-react';
import useProducts from '@/lib/hooks/useProducts';

interface ExpenseDialogProps {
  open: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  expense?: {
    id?: number;
    description: string;
    amount: number;
    date: string;
    type: string;
    isRecurring?: boolean;
    product?: {
      name: string;
      sku: string;
      pnk: string;
      unitsCount: number;
      costPerUnit: number;
    };
  } | null;
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

const ExpenseDialog = ({ open, onClose, mode, expense }: ExpenseDialogProps) => {
  const [type, setType] = useState('one-time');
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

  useEffect(() => {
    if (expense) {
      setType(expense.type);
      setDescription(expense.description);
      setAmount(expense.amount.toString());
      setDate(new Date(expense.date));
      setIsRecurring(expense.isRecurring || false);
      if (expense.product) {
        setUnitsCount(expense.product.unitsCount.toString());
        setCostPerUnit(expense.product.costPerUnit.toString());
        // We don't set selectedProduct here because we would need to match it with our products list
      }
    }
  }, [expense]);

  const handleProductSelect = (product: any) => {
    setSelectedProduct(product);
    if (product) {
      // You can set other fields based on the product if needed
      setDescription(product.name || '');
    }
  };

  const handleSubmit = () => {
    // Handle form submission (UI only for now)
    onClose();
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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
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
              onChange={(e) => setType(e.target.value)}
            >
              <MenuItem value="one-time">One Time</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="annually">Annually</MenuItem>
              <MenuItem value="cogs">COGS</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
          />

          {type !== 'cogs' && (
            <TextField
              label="Amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              fullWidth
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
              onChange={(newValue: Date | null) => setDate(newValue)}
              renderInput={(params) => <TextField {...params} fullWidth />}
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
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          {mode === 'add' ? 'Add' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExpenseDialog; 