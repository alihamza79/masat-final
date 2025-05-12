'use client';
import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Box,
  Divider,
  Typography,
  CircularProgress
} from '@mui/material';
import { Expense, ExpenseType } from '@/lib/hooks/useExpenses';
import { format } from 'date-fns';
import useProducts from '@/lib/hooks/useProducts';
import { useTranslation } from 'react-i18next';
import { 
  ExpenseTypeSelector, 
  RegularExpenseFields, 
  CogsFields
} from './expense-components';

interface ExpenseDialogProps {
  open: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  expense?: Expense | null;
  onSave: (expense: Omit<Expense, '_id'> | Expense) => void;
  isSaving: boolean;
  initialType?: ExpenseType;
}

const ExpenseDialog = ({ 
  open, 
  onClose, 
  mode, 
  expense,
  onSave,
  isSaving,
  initialType
}: ExpenseDialogProps) => {
  const { t } = useTranslation();
  // Validation error state
  const [errors, setErrors] = useState<Record<string,string>>({});

  const [type, setType] = useState<ExpenseType>(initialType ? initialType : 'one-time');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState<Date | null>(new Date());
  const [isRecurring, setIsRecurring] = useState(false);
  const [unitsCount, setUnitsCount] = useState('');
  const [costPerUnit, setCostPerUnit] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  // Clear errors on type change or open
  useEffect(() => {
    setErrors({});
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
        setType(initialType ? initialType : 'one-time');
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
  }, [open, initialType]);

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

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        {mode === 'add' ? t('expenses.dialog.add') : t('expenses.dialog.edit')}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={4} sx={{ mt: 2 }}>
          {/* Expense Type Selection */}
          <ExpenseTypeSelector 
            type={type} 
            setType={setType} 
            mode={mode} 
          />

          {/* Divider with label */}
          <Box sx={{ position: 'relative', my: 1 }}>
            <Divider sx={{ '&::before, &::after': { borderColor: 'divider' } }}>
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ px: 1 }}
              >
                {t('expenses.dialog.expenseDetails')}
              </Typography>
            </Divider>
          </Box>

          {/* Expense details section - render appropriate fields based on type */}
          {type === 'cogs' ? (
            <CogsFields
              date={date}
              setDate={setDate}
              selectedProduct={selectedProduct}
              handleProductSelect={handleProductSelect}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filteredProducts={filteredProducts}
              productsLoading={productsLoading}
              unitsCount={unitsCount}
              setUnitsCount={setUnitsCount}
              costPerUnit={costPerUnit}
              setCostPerUnit={setCostPerUnit}
              errors={errors}
              setErrors={setErrors}
            />
          ) : (
            <RegularExpenseFields
              type={type}
              description={description}
              setDescription={setDescription}
              amount={amount}
              setAmount={setAmount}
              date={date}
              setDate={setDate}
              isRecurring={isRecurring}
              setIsRecurring={setIsRecurring}
              errors={errors}
              setErrors={setErrors}
            />
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={isSaving}>
          {t('expenses.dialog.cancel')}
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={isSaving}
          startIcon={isSaving ? <CircularProgress size={20} /> : null}
        >
          {t('expenses.dialog.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExpenseDialog; 