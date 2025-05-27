import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
  Box,
  useTheme,
  Autocomplete,
  Avatar,
  Typography,
  Chip,
  InputAdornment,
  Paper
} from '@mui/material';
import { IconSearch, IconTag, IconPlus, IconX } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { KeywordTrackedProduct } from '@/lib/hooks/useKeywordTracker';
import { useProducts } from '@/lib/hooks/useProducts';

export interface AddProductFormData {
  productId: string;
  productName: string;
  productImage?: string;
  productSKU?: string;
  productPNK?: string;
  keywords: string[];
}

interface AddProductDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<KeywordTrackedProduct, '_id'>) => Promise<void>;
  isSubmitting?: boolean;
}

const AddProductDialog: React.FC<AddProductDialogProps> = ({
  open,
  onClose,
  onSubmit,
  isSubmitting = false,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  
  // Fetch products using the existing hook
  const { products, isLoading: productsLoading } = useProducts();
  
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [keywordInput, setKeywordInput] = useState<string>('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [errors, setErrors] = useState({
    product: '',
    keywords: ''
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedProduct(null);
      setKeywordInput('');
      setKeywords([]);
      setErrors({
        product: '',
        keywords: ''
      });
    }
  }, [open]);

  const handleProductChange = (_event: any, newValue: any) => {
    setSelectedProduct(newValue);
    
    // Clear product error when a product is selected
    if (newValue && errors.product) {
      setErrors(prev => ({
        ...prev,
        product: ''
      }));
    }
  };

  const handleKeywordInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && keywordInput.trim()) {
      e.preventDefault();
      addKeyword();
    }
  };

  const addKeyword = () => {
    const trimmedKeyword = keywordInput.trim();
    if (trimmedKeyword && !keywords.includes(trimmedKeyword)) {
      setKeywords(prev => [...prev, trimmedKeyword]);
      setKeywordInput('');
      
      // Clear keywords error when keywords are added
      if (errors.keywords) {
        setErrors(prev => ({
          ...prev,
          keywords: ''
        }));
      }
    }
  };

  const removeKeyword = (keywordToRemove: string) => {
    setKeywords(prev => prev.filter(keyword => keyword !== keywordToRemove));
  };

  const validateForm = (): boolean => {
    const newErrors = {
      product: '',
      keywords: ''
    };
    
    if (!selectedProduct) {
      newErrors.product = t('keywordTracker.form.errors.productRequired', 'Please select a product');
    }
    
    if (keywords.length === 0) {
      newErrors.keywords = t('keywordTracker.form.errors.keywordsRequired', 'Please add at least one keyword');
    }
    
    setErrors(newErrors);
    
    return !newErrors.product && !newErrors.keywords;
  };

  const handleSubmit = async () => {
    if (validateForm() && !isSubmitting && selectedProduct) {
      try {
        const productData: Omit<KeywordTrackedProduct, '_id'> = {
          productId: selectedProduct.emagProductOfferId?.toString() || selectedProduct.id?.toString() || '',
          productName: selectedProduct.name || '',
          productImage: selectedProduct.images?.[0]?.url || '',
          productSKU: selectedProduct.part_number || '',
          productPNK: selectedProduct.part_number_key || '',
          keywords,
          organicTop10: 0,
          organicTop50: 0,
          sponsoredTop10: 0,
          sponsoredTop50: 0
        };
        
        await onSubmit(productData);
      } catch (error) {
        console.error('Form submission error:', error);
      }
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={!isSubmitting ? onClose : undefined}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: 1,
          maxWidth: '650px'
        }
      }}
    >
      <DialogTitle>
        {t('keywordTracker.addDialog.title', 'Add Product for Keyword Tracking')}
      </DialogTitle>
      
      <DialogContent>
        <Box component="form" sx={{ mt: 1 }}>
          {/* Product Selection */}
          <Autocomplete
            options={products || []}
            getOptionLabel={(option) => option.name || ''}
            value={selectedProduct}
            onChange={handleProductChange}
            loading={productsLoading}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('keywordTracker.form.productLabel', 'Select Product')}
                placeholder={t('keywordTracker.form.productPlaceholder', 'Search by name, SKU, or PNK...')}
                error={!!errors.product}
                helperText={errors.product}
                required
                disabled={isSubmitting}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconSearch size={20} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <>
                      {productsLoading ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
                sx={{ mb: 3 }}
              />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1 }}>
                <Avatar
                  src={option.images?.[0]?.url}
                  alt={option.name}
                  sx={{ width: 32, height: 32 }}
                >
                  {option.name?.charAt(0).toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {option.name}
                  </Typography>
                  <Box display="flex" gap={1} mt={0.5}>
                    {option.part_number && (
                      <Typography variant="caption" color="textSecondary">
                        SKU: {option.part_number}
                      </Typography>
                    )}
                    {option.part_number_key && (
                      <Typography variant="caption" color="textSecondary">
                        PNK: {option.part_number_key}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            )}
            filterOptions={(options, { inputValue }) => {
              return options.filter(option =>
                option.name?.toLowerCase().includes(inputValue.toLowerCase()) ||
                option.part_number?.toLowerCase().includes(inputValue.toLowerCase()) ||
                option.part_number_key?.toLowerCase().includes(inputValue.toLowerCase())
              );
            }}
            noOptionsText={t('keywordTracker.form.noProducts', 'No products found')}
          />

          {/* Selected Product Preview */}
          {selectedProduct && (
            <Paper sx={{ p: 2, mb: 3, bgcolor: theme.palette.action.hover }}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'primary.main' }}>
                {t('keywordTracker.form.selectedProduct', 'Selected Product')}
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar
                  src={selectedProduct.images?.[0]?.url}
                  alt={selectedProduct.name}
                  sx={{ width: 40, height: 40 }}
                >
                  {selectedProduct.name?.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="body2" fontWeight={500}>
                    {selectedProduct.name}
                  </Typography>
                  <Box display="flex" gap={1} mt={0.5}>
                    {selectedProduct.part_number && (
                      <Typography variant="caption" color="textSecondary">
                        SKU: {selectedProduct.part_number}
                      </Typography>
                    )}
                    {selectedProduct.part_number_key && (
                      <Typography variant="caption" color="textSecondary">
                        PNK: {selectedProduct.part_number_key}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            </Paper>
          )}

          {/* Keywords Input */}
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              label={t('keywordTracker.form.keywordsLabel', 'Add Keywords')}
              placeholder={t('keywordTracker.form.keywordsPlaceholder', 'Type a keyword and press Enter...')}
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyPress={handleKeywordInputKeyPress}
              error={!!errors.keywords}
              helperText={errors.keywords || t('keywordTracker.form.keywordsHelp', 'Press Enter to add each keyword')}
              disabled={isSubmitting}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconTag size={20} />
                  </InputAdornment>
                ),
                endAdornment: keywordInput.trim() && (
                  <InputAdornment position="end">
                    <Button
                      size="small"
                      onClick={addKeyword}
                      disabled={isSubmitting}
                      startIcon={<IconPlus size={16} />}
                    >
                      Add
                    </Button>
                  </InputAdornment>
                )
              }}
            />
          </Box>

          {/* Keywords List */}
          {keywords.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {t('keywordTracker.form.keywordsList', 'Keywords to track')} ({keywords.length})
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {keywords.map((keyword, index) => (
                  <Chip
                    key={index}
                    label={keyword}
                    onDelete={() => removeKeyword(keyword)}
                    deleteIcon={<IconX size={16} />}
                    size="small"
                    color="primary"
                    variant="outlined"
                    disabled={isSubmitting}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Summary */}
          <Paper sx={{ p: 2, bgcolor: theme.palette.background.default }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {t('keywordTracker.form.summary', 'Summary')}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="body2">
                <strong>{t('keywordTracker.form.totalKeywords', 'Total Keywords')}:</strong> {keywords.length}
              </Typography>
              <Typography variant="body2">
                <strong>{t('keywordTracker.form.addedKeywords', 'Added Keywords')}:</strong> {keywords.length}
              </Typography>
              <Typography variant="body2">
                <strong>{t('keywordTracker.form.totalTracked', 'Total Keywords to Track')}:</strong> {keywords.length}
              </Typography>
            </Box>
          </Paper>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button 
          onClick={onClose} 
          disabled={isSubmitting}
          variant="outlined"
        >
          {t('common.cancel', 'Cancel')}
        </Button>
        <Button 
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={isSubmitting || !selectedProduct || keywords.length === 0}
          startIcon={isSubmitting ? <CircularProgress size={20} /> : <IconPlus size={18} />}
        >
          {isSubmitting ? t('keywordTracker.form.adding', 'Adding...') : t('keywordTracker.form.addButton', 'Add Product')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddProductDialog; 