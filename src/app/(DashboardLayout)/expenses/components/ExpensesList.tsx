'use client';
import { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  useTheme,
  useMediaQuery,
  FormControl,
  Select,
  InputLabel,
  SelectChangeEvent,
} from '@mui/material';
import { IconDotsVertical, IconPlus, IconPencil, IconTrash } from '@tabler/icons-react';
import ExpenseDialog from './ExpenseDialog';

type ExpenseType = 'one-time' | 'monthly' | 'annually' | 'cogs';

interface Expense {
  id: number;
  description: string;
  amount: number;
  date: string;
  type: ExpenseType;
  isRecurring?: boolean;
  product?: {
    name: string;
    sku: string;
    pnk: string;
    unitsCount: number;
    costPerUnit: number;
  };
}

// Dummy data
const dummyExpenses: Expense[] = [
  {
    id: 1,
    description: 'Office Rent',
    amount: 2500,
    date: '2024-03-15',
    type: 'monthly',
    isRecurring: true,
  },
  {
    id: 2,
    description: 'Software License',
    amount: 1200,
    date: '2024-03-10',
    type: 'annually',
    isRecurring: true,
  },
  {
    id: 3,
    description: 'Equipment Purchase',
    amount: 5000,
    date: '2024-03-05',
    type: 'one-time',
  },
  {
    id: 4,
    description: 'Product A',
    amount: 3000,
    date: '2024-03-01',
    type: 'cogs',
    product: {
      name: 'Product A',
      sku: 'SKU123',
      pnk: 'PNK456',
      unitsCount: 100,
      costPerUnit: 30,
    },
  },
];

const ExpensesList = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [expenses] = useState<Expense[]>(dummyExpenses);
  const [selectedType, setSelectedType] = useState<ExpenseType | 'all'>('all');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');

  const handleTypeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newType: ExpenseType | 'all',
  ) => {
    setSelectedType(newType || 'all');
  };

  const handleTypeSelectChange = (event: SelectChangeEvent<ExpenseType | 'all'>) => {
    setSelectedType(event.target.value as ExpenseType | 'all');
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, expense: Expense) => {
    setAnchorEl(event.currentTarget);
    setSelectedExpense(expense);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedExpense(null);
  };

  const handleAddClick = () => {
    setDialogMode('add');
    setSelectedExpense(null);
    setIsDialogOpen(true);
  };

  const handleEditClick = () => {
    setDialogMode('edit');
    setIsDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    // Handle delete (UI only for now)
    handleMenuClose();
  };

  const filteredExpenses = expenses.filter(
    (expense) => selectedType === 'all' || expense.type === selectedType
  );

  return (
    <Card>
      <CardContent>
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            alignItems: { xs: 'stretch', sm: 'center' }, 
            mb: 3 
          }}
        >
          <Typography 
            variant="h5"
            sx={{ 
              fontSize: { xs: '1.25rem', md: 'h5.fontSize' },
              textAlign: { xs: 'center', sm: 'left' },
            }}
          >
            Expenses List
          </Typography>
          {!isMobile && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<IconPlus />}
              onClick={handleAddClick}
              sx={{
                minHeight: { xs: '36px' },
                fontSize: { xs: '0.813rem', sm: '0.875rem' },
              }}
            >
              Add Expense
            </Button>
          )}
        </Box>

        {isMobile ? (
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel id="expense-type-select-label">Filter by Type</InputLabel>
            <Select
              labelId="expense-type-select-label"
              id="expense-type-select"
              value={selectedType}
              label="Filter by Type"
              onChange={handleTypeSelectChange}
              size="small"
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="one-time">One Time</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="annually">Annually</MenuItem>
              <MenuItem value="cogs">COGS</MenuItem>
            </Select>
          </FormControl>
        ) : (
          <Stack direction="row" spacing={2} sx={{ mb: 3, overflowX: 'auto' }}>
            <ToggleButtonGroup
              value={selectedType}
              exclusive
              onChange={handleTypeChange}
              aria-label="expense type filter"
              size={isMobile ? "small" : "medium"}
            >
              <ToggleButton value="all">All</ToggleButton>
              <ToggleButton value="one-time">One Time</ToggleButton>
              <ToggleButton value="monthly">Monthly</ToggleButton>
              <ToggleButton value="annually">Annually</ToggleButton>
              <ToggleButton value="cogs">COGS</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        )}

        {isMobile && (
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<IconPlus />}
              onClick={handleAddClick}
              fullWidth
              sx={{
                maxWidth: '250px',
                minHeight: '36px',
                fontSize: '0.813rem',
              }}
            >
              Add Expense
            </Button>
          </Box>
        )}

        <Box sx={{ width: '100%', overflowX: 'auto' }}>
          <TableContainer sx={{ minWidth: { xs: 300, sm: 600 } }}>
            <Table size={isMobile ? "small" : "medium"}>
              <TableHead>
                <TableRow>
                  <TableCell>Description</TableCell>
                  {!isMobile && <TableCell>Type</TableCell>}
                  <TableCell>Amount</TableCell>
                  {!isMobile && <TableCell>Date</TableCell>}
                  {!isMobile && <TableCell>Status</TableCell>}
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>
                      {expense.description}
                      {isMobile && (
                        <>
                          <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            <Chip
                              label={expense.type.toUpperCase()}
                              color={
                                expense.type === 'cogs'
                                  ? 'warning'
                                  : expense.type === 'one-time'
                                  ? 'info'
                                  : 'default'
                              }
                              size="small"
                            />
                            {expense.isRecurring && (
                              <Chip label="Recurring" color="success" size="small" />
                            )}
                          </Box>
                          <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                            {new Date(expense.date).toLocaleDateString()}
                          </Typography>
                        </>
                      )}
                    </TableCell>
                    {!isMobile && (
                      <TableCell>
                        <Chip
                          label={expense.type.toUpperCase()}
                          color={
                            expense.type === 'cogs'
                              ? 'warning'
                              : expense.type === 'one-time'
                              ? 'info'
                              : 'default'
                          }
                          size="small"
                        />
                      </TableCell>
                    )}
                    <TableCell>{expense.amount.toLocaleString()} RON</TableCell>
                    {!isMobile && <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>}
                    {!isMobile && (
                      <TableCell>
                        {expense.isRecurring && (
                          <Chip label="Recurring" color="success" size="small" />
                        )}
                      </TableCell>
                    )}
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, expense)}
                      >
                        <IconDotsVertical size={isMobile ? 18 : 20} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleEditClick}>
            <IconPencil size={20} />
            <Typography sx={{ ml: 1 }}>Edit</Typography>
          </MenuItem>
          <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
            <IconTrash size={20} />
            <Typography sx={{ ml: 1 }}>Delete</Typography>
          </MenuItem>
        </Menu>

        <ExpenseDialog
          open={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          mode={dialogMode}
          expense={selectedExpense}
        />
      </CardContent>
    </Card>
  );
};

export default ExpensesList; 