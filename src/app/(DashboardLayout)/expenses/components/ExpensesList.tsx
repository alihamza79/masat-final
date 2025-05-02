'use client';
import { useState } from 'react';
import {
  Card,
  CardContent,
  SelectChangeEvent,
} from '@mui/material';
import useExpenses, { Expense, ExpenseType } from '@/lib/hooks/useExpenses';
import { 
  ExpenseHeader,
  ExpenseTypeFilter,
  MobileAddButton,
  ExpenseEmptyState,
  ExpenseTableContent,
  ExpenseActionsMenu,
  ExpenseLoadingSkeleton,
  ExpenseErrorDisplay
} from './expense-components';
import { useTheme, useMediaQuery } from '@mui/material';
import ExpenseDialog from './ExpenseDialog';
import DeleteConfirmationDialog from '@/app/components/dialogs/DeleteConfirmationDialog';
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
      deleteExpense(selectedExpense._id);
    }
    setIsDeleteDialogOpen(false);
    setSelectedExpense(null);
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
    return <ExpenseLoadingSkeleton isMobile={isMobile} />;
  }

  // Render error state
  if (error) {
    return <ExpenseErrorDisplay error={error} />;
  }

  return (
    <Card>
      <CardContent>
        {/* Header with title and desktop add button */}
        <ExpenseHeader isMobile={isMobile} onAddClick={handleAddClick} />

        {/* Type filter - different on mobile vs desktop */}
        <ExpenseTypeFilter 
          isMobile={isMobile} 
          selectedType={selectedType} 
          onTypeChange={handleTypeChange} 
          onTypeSelectChange={handleTypeSelectChange} 
        />

        {/* Mobile add button */}
        {isMobile && <MobileAddButton onAddClick={handleAddClick} />}

        {/* Empty state or expense table */}
        {expenses.length === 0 ? (
          <ExpenseEmptyState onAddClick={handleAddClick} />
        ) : (
          <ExpenseTableContent 
            expenses={expenses} 
            isMobile={isMobile} 
            isDeleting={isDeleting} 
            onMenuOpen={handleMenuOpen} 
          />
        )}

        {/* Actions menu for edit/delete */}
        <ExpenseActionsMenu 
          anchorEl={anchorEl}
          onClose={handleMenuClose}
          onEditClick={handleEditClick}
          onDeleteClick={handleDeleteClick}
        />

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