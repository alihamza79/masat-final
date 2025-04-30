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
  CircularProgress,
  Alert,
  Skeleton,
} from '@mui/material';
import { IconDotsVertical, IconPlus, IconPencil, IconTrash } from '@tabler/icons-react';
import ExpenseDialog from './ExpenseDialog';
import DeleteConfirmationDialog from '@/app/components/dialogs/DeleteConfirmationDialog';
import useExpenses, { Expense, ExpenseType } from '@/lib/hooks/useExpenses';
import { format } from 'date-fns';

const ExpensesList = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [selectedType, setSelectedType] = useState<ExpenseType | 'all'>('all');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');

  // Get expenses with optional type filter
  const { 
    expenses, 
    isLoading, 
    error, 
    createExpense, 
    updateExpense, 
    deleteExpense, 
    isCreating, 
    isUpdating, 
    isDeleting 
  } = useExpenses(selectedType === 'all' ? undefined : selectedType);

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
    setAnchorEl(null);
  };

  const handleSaveExpense = (expense: Omit<Expense, '_id'> | Expense) => {
    if ('_id' in expense) {
      updateExpense(expense);
    } else {
      createExpense(expense);
    }
    setIsDialogOpen(false);
  };

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
    setAnchorEl(null);
  };

  const handleConfirmDelete = () => {
    if (selectedExpense?._id) {
      // delete the selected expense
      deleteExpense(selectedExpense._id);
    }
    // close dialog and clear selection
    setIsDeleteDialogOpen(false);
    setSelectedExpense(null);
  };

  // Format date in a readable format
  const formatDate = (dateString: string | Date) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Get the expense name for delete confirmation
  const getExpenseName = (expense: Expense | null) => {
    if (!expense) return '';
    
    if (expense.type === 'cogs' && expense.product) {
      return expense.product.name;
    }
    
    return expense.description || `Expense #${expense._id?.substring(0, 6)}`;
  };

  // Render loading state when fetching expenses
  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ mb: 3 }}>
            <Skeleton variant="text" width="200px" height={40} />
            <Skeleton variant="rectangular" height={48} sx={{ mt: 2 }} />
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  {Array(isMobile ? 3 : 5).fill(0).map((_, index) => (
                    <TableCell key={index}>
                      <Skeleton variant="text" />
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {Array(5).fill(0).map((_, index) => (
                  <TableRow key={index}>
                    {Array(isMobile ? 3 : 5).fill(0).map((_, cellIndex) => (
                      <TableCell key={cellIndex}>
                        <Skeleton variant="text" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    );
  }

  // Render error state
  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error" sx={{ mb: 3 }}>
            Error loading expenses: {error instanceof Error ? error.message : 'Unknown error'}
          </Alert>
          <Button variant="outlined" onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </CardContent>
      </Card>
    );
  }

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

        {expenses.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              No expenses found.
            </Typography>
            <Button
              variant="outlined"
              startIcon={<IconPlus />}
              onClick={handleAddClick}
              sx={{ mt: 1 }}
            >
              Add Your First Expense
            </Button>
          </Box>
        ) : (
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
                  {expenses.map((expense: Expense) => (
                    <TableRow key={expense._id}>
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
                              {formatDate(expense.date)}
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
                      {!isMobile && <TableCell>{formatDate(expense.date)}</TableCell>}
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
                          disabled={isDeleting === expense._id}
                        >
                          {isDeleting === expense._id ? (
                            <CircularProgress size={18} />
                          ) : (
                            <IconDotsVertical size={isMobile ? 18 : 20} />
                          )}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

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

        {/* Expense Dialog for Add/Edit */}
        <ExpenseDialog
          open={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          mode={dialogMode}
          expense={selectedExpense}
          onSave={handleSaveExpense}
          isSaving={isCreating || isUpdating}
        />

        {/* Delete confirmation dialog */}
        <DeleteConfirmationDialog
          open={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleConfirmDelete}
          integrationName={getExpenseName(selectedExpense)}
          title="Delete Expense"
          message={`Are you sure you want to delete the expense "${getExpenseName(selectedExpense)}"? This action cannot be undone.`}
        />
      </CardContent>
    </Card>
  );
};

export default ExpensesList; 