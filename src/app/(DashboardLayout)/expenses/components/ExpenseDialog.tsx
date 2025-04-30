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
  Divider,
  Chip,
  Grid,
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

// Add helper to highlight matched substrings in option text
const getHighlightedText = (text: string, highlight: string) => {
  if (!highlight) return text;
  const escapedHighlight = highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escapedHighlight})`, 'gi'));
  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <Box component="span" key={index} sx={{ backgroundColor: theme => theme.palette.warning.light, px: 0.5 }}>
            {part}
          </Box>
        ) : (
          part
        )
      )}
    </>
  );
};

const ExpenseDialog = ({ 
  open, 
  onClose, 
  mode, 
  expense,
  onSave,
  isSaving
}: ExpenseDialogProps) => {
  // Validation error state
  const [errors, setErrors] = useState<Record<string,string>>({});

  const [type, setType] = useState<ExpenseType>('one-time');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dateError, setDateError] = useState('');
  const [date, setDate] = useState<Date | null>(new Date());
  const [isRecurring, setIsRecurring] = useState(false);
  const [unitsCount, setUnitsCount] = useState('');
  const [costPerUnit, setCostPerUnit] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  // Clear errors on type change or open
  useEffect(() => {
    setErrors({});
    setDateError('');
  }, [type, open]);

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
    // Clear product selection error if present
    if (errors.product) {
      const newErrors = { ...errors };
      delete newErrors.product;
      setErrors(newErrors);
    }
    if (product) {
      // Update expense with product details
      setDescription(product.name || '');
    }
  };

  const handleSubmit = () => {
    // Validate form fields
    const validationErrors: Record<string,string> = {};
    if (type !== 'cogs') {
      if (!description.trim()) validationErrors.description = 'Description is required';
      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) validationErrors.amount = 'Valid amount is required';
    }
    if (!date) {
      validationErrors.date = 'Date is required';
    }
    if (type === 'cogs') {
      if (!selectedProduct) validationErrors.product = 'Product selection is required';
      if (!unitsCount || isNaN(Number(unitsCount)) || Number(unitsCount) <= 0) validationErrors.unitsCount = 'Units count must be greater than 0';
      if (!costPerUnit || isNaN(Number(costPerUnit)) || Number(costPerUnit) <= 0) validationErrors.costPerUnit = 'Cost per unit must be greater than 0';
    }
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
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
    <Stack spacing={3} sx={{ mt: 0 }}>
      {/* Fields without container */}
      <Stack spacing={3}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label="Purchase Date"
            value={date}
            onChange={(newDate) => {
              if (newDate) {
                const dt = newDate as Date;
                setDate(dt);
                if (errors.date) {
                  const newErrors = { ...errors };
                  delete newErrors.date;
                  setErrors(newErrors);
                }
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                fullWidth
                required
                error={Boolean(errors.date)}
                helperText={errors.date}
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
        
        <Autocomplete
          value={selectedProduct}
          onChange={(_, newValue) => handleProductSelect(newValue)}
          getOptionLabel={(option) => option.name || ''}
          options={filteredProducts}
          filterOptions={(options) => options}
          loading={productsLoading}
          noOptionsText={searchQuery ? "No products found" : "Type to search"}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Search Product"
              onChange={(e) => setSearchQuery(e.target.value)}
              error={Boolean(errors.product)}
              helperText={errors.product || "Search by name, SKU or PNK"}
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
                    {getHighlightedText(option.name, searchQuery)}
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    {option.part_number && (
                      <Typography variant="caption" color="text.secondary">
                        SKU: {getHighlightedText(option.part_number, searchQuery)}
                      </Typography>
                    )}
                    {option.part_number_key && (
                      <Typography variant="caption" color="text.secondary">
                        PNK: {getHighlightedText(option.part_number_key, searchQuery)}
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
      </Stack>

      {selectedProduct && (
        <Paper 
          variant="outlined"
          sx={{ 
            p: 2, 
            borderRadius: 1,
            borderColor: 'divider',
            bgcolor: theme => theme.palette.mode === 'dark' ? 'grey.800' : 'background.paper',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}
        >
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
                <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
                  <Typography variant="subtitle1" fontWeight={600}>
                    {selectedProduct.name}
                  </Typography>
                </Stack>
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
                <Box sx={{ 
                  mt: 2,
                  p: 1.5, 
                  bgcolor: theme => theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
                  borderRadius: 1
                }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Purchase Details
                  </Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                      label="Number of Units"
                      type="number"
                      value={unitsCount}
                      onChange={(e) => {
                        const value = e.target.value;
                        setUnitsCount(value);
                        if (errors.unitsCount) {
                          const newErrors = { ...errors };
                          delete newErrors.unitsCount;
                          setErrors(newErrors);
                        }
                      }}
                      fullWidth
                      size="small"
                      error={Boolean(errors.unitsCount)}
                      helperText={errors.unitsCount}
                      InputProps={{
                        inputProps: { min: 0 },
                      }}
                    />
                    <TextField
                      label="Cost per Unit"
                      type="number"
                      value={costPerUnit}
                      onChange={(e) => {
                        const value = e.target.value;
                        setCostPerUnit(value);
                        if (errors.costPerUnit) {
                          const newErrors = { ...errors };
                          delete newErrors.costPerUnit;
                          setErrors(newErrors);
                        }
                      }}
                      fullWidth
                      size="small"
                      error={Boolean(errors.costPerUnit)}
                      helperText={errors.costPerUnit}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">RON</InputAdornment>,
                        inputProps: { min: 0 },
                      }}
                    />
                  </Stack>
                  {Number(unitsCount) > 0 && Number(costPerUnit) > 0 && (
                    <Box sx={{ mt: 2, textAlign: 'right' }}>
                      <Typography variant="subtitle2">
                        Total: <strong>{(Number(unitsCount) * Number(costPerUnit)).toLocaleString()} RON</strong>
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Stack>
            </Stack>
          </Stack>
        </Paper>
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
        <Stack spacing={4} sx={{ mt: 2 }}>
          {/* Expense Type Selection - using visual toggle buttons instead of dropdown */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Expense Type {mode === 'edit' && '(cannot be changed)'}
            </Typography>
            <Grid container spacing={1.5}>
              {[
                { value: 'one-time', label: 'One Time', icon: <IconCalendar size={18} /> },
                { value: 'monthly', label: 'Monthly', icon: <IconCalendar size={18} /> },
                { value: 'annually', label: 'Annually', icon: <IconCalendar size={18} /> },
                { value: 'cogs', label: 'COGS', icon: <IconPackage size={18} /> },
              ].map((option) => (
                <Grid item xs={6} sm={3} key={option.value}>
                  <Paper
                    onClick={() => !mode || mode !== 'edit' ? setType(option.value as ExpenseType) : null}
                    sx={{
                      p: 1.5,
                      textAlign: 'center',
                      cursor: mode === 'edit' ? 'default' : 'pointer',
                      border: '1px solid',
                      borderColor: type === option.value 
                        ? 'primary.main' 
                        : 'divider',
                      bgcolor: type === option.value 
                        ? 'primary.lighter'
                        : 'background.paper',
                      color: type === option.value 
                        ? 'primary.main' 
                        : 'text.primary',
                      opacity: mode === 'edit' ? 0.7 : 1,
                      transition: 'all 0.2s',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      '&:hover': {
                        borderColor: mode === 'edit' ? undefined : (type === option.value ? 'primary.main' : 'grey.400'),
                        boxShadow: mode === 'edit' ? undefined : '0 2px 8px rgba(0,0,0,0.08)',
                      }
                    }}
                  >
                    <Stack spacing={1} alignItems="center">
                      {option.icon}
                      <Typography variant="body2" fontWeight={type === option.value ? 600 : 400}>
                        {option.label}
                      </Typography>
                    </Stack>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Divider with label */}
          <Box sx={{ position: 'relative', my: 1 }}>
            <Divider sx={{ '&::before, &::after': { borderColor: 'divider' } }}>
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ px: 1 }}
              >
                Expense Details
              </Typography>
            </Divider>
          </Box>

          {/* Expense details section */}
          <Stack spacing={3}>
            {type !== 'cogs' && (
              <TextField
                label="Description"
                value={description}
                onChange={(e) => {
                  const value = e.target.value;
                  setDescription(value);
                  if (errors.description) {
                    const newErrors = { ...errors };
                    delete newErrors.description;
                    setErrors(newErrors);
                  }
                }}
                fullWidth
                required
                error={Boolean(errors.description)}
                helperText={errors.description}
                inputProps={{ style: { textAlign: 'center' } }}
              />
            )}

            {/* Date and Amount in a row for better space usage */}
            {type !== 'cogs' && (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Amount"
                  type="number"
                  value={amount}
                  onChange={(e) => {
                    const value = e.target.value;
                    setAmount(value);
                    if (errors.amount) {
                      const newErrors = { ...errors };
                      delete newErrors.amount;
                      setErrors(newErrors);
                    }
                  }}
                  fullWidth
                  required
                  error={Boolean(errors.amount)}
                  helperText={errors.amount}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">RON</InputAdornment>,
                    inputProps: { min: 0 },
                  }}
                />
                
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Date"
                    value={date}
                    onChange={(newDate) => {
                      if (newDate) {
                        const dt = newDate as Date;
                        setDate(dt);
                        if (errors.date) {
                          const newErrors = { ...errors };
                          delete newErrors.date;
                          setErrors(newErrors);
                        }
                      }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        required
                        error={Boolean(errors.date)}
                        helperText={errors.date}
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
              </Stack>
            )}

            {/* Recurring expenses option - made more visual */}
            {(type === 'monthly' || type === 'annually') && (
              <Paper sx={{ p: 1.5, border: '1px solid', borderColor: 'divider' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isRecurring}
                      onChange={(e) => setIsRecurring(e.target.checked)}
                      color="success"
                    />
                  }
                  label={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography>{`Recurring ${type === 'monthly' ? 'Monthly' : 'Annually'}`}</Typography>
                    </Stack>
                  }
                />
              </Paper>
            )}
          
            {/* COGS specific fields */}
            {type === 'cogs' && renderCogsFields()}
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, bgcolor: theme => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50' }}>
        <Button 
          onClick={onClose}
          disabled={isSaving}
          variant="outlined"
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