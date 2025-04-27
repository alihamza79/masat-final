'use client';
import { useState, useEffect } from 'react';
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
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

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

const ExpenseDialog = ({ open, onClose, mode, expense }: ExpenseDialogProps) => {
  const [type, setType] = useState('one-time');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState<Date | null>(new Date());
  const [isRecurring, setIsRecurring] = useState(false);
  const [productName, setProductName] = useState('');
  const [productSku, setProductSku] = useState('');
  const [productPnk, setProductPnk] = useState('');
  const [unitsCount, setUnitsCount] = useState('');
  const [costPerUnit, setCostPerUnit] = useState('');

  useEffect(() => {
    if (expense) {
      setType(expense.type);
      setDescription(expense.description);
      setAmount(expense.amount.toString());
      setDate(new Date(expense.date));
      setIsRecurring(expense.isRecurring || false);
      if (expense.product) {
        setProductName(expense.product.name);
        setProductSku(expense.product.sku);
        setProductPnk(expense.product.pnk);
        setUnitsCount(expense.product.unitsCount.toString());
        setCostPerUnit(expense.product.costPerUnit.toString());
      }
    }
  }, [expense]);

  const handleSubmit = () => {
    // Handle form submission (UI only for now)
    onClose();
  };

  const renderCogsFields = () => (
    <Stack spacing={3}>
      <Typography variant="subtitle1" sx={{ mt: 2 }}>
        Product Details
      </Typography>
      <TextField
        label="Product Name"
        value={productName}
        onChange={(e) => setProductName(e.target.value)}
        fullWidth
      />
      <Stack direction="row" spacing={2}>
        <TextField
          label="SKU"
          value={productSku}
          onChange={(e) => setProductSku(e.target.value)}
          fullWidth
        />
        <TextField
          label="PNK"
          value={productPnk}
          onChange={(e) => setProductPnk(e.target.value)}
          fullWidth
        />
      </Stack>
      <Stack direction="row" spacing={2}>
        <TextField
          label="Number of Units"
          type="number"
          value={unitsCount}
          onChange={(e) => setUnitsCount(e.target.value)}
          fullWidth
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
          InputProps={{
            startAdornment: <InputAdornment position="start">RON</InputAdornment>,
            inputProps: { min: 0 },
          }}
        />
      </Stack>
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