import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Types } from 'mongoose';
import { DASHBOARD_QUERY_KEY } from '@/lib/services/dashboardService';
import { useTranslation } from 'react-i18next';

export type ExpenseType = 'one-time' | 'monthly' | 'annually' | 'cogs';

export interface ExpenseProduct {
  emagProductOfferId?: string;
  name: string;
  part_number?: string; // SKU
  part_number_key?: string; // PNK
  image?: string;
  unitsCount: number;
  costPerUnit: number;
}

export interface Expense {
  _id?: string;
  userId?: Types.ObjectId | string; // Accept both for flexibility in frontend
  type: ExpenseType;
  description: string;
  amount: number;
  date: string | Date;
  isRecurring?: boolean;
  product?: ExpenseProduct;
  createdAt?: string;
  updatedAt?: string;
}

export const EXPENSES_QUERY_KEY = ['expenses'];

// API functions
const fetchExpenses = async (type?: ExpenseType, t?: any) => {
  const url = type 
    ? `/api/expenses?type=${type}` 
    : '/api/expenses';
  
  const response = await axios.get(url);
  if (!response.data.success) {
    throw new Error(response.data.error || (t ? t('expenses.toast.fetchError') : 'Failed to fetch expenses'));
  }
  return response.data.data.expenses;
};

const createExpense = async (expense: Omit<Expense, '_id'>) => {
  const response = await axios.post('/api/expenses', expense);
  if (!response.data.success) {
    throw new Error(response.data.error || 'Failed to create expense');
  }
  return response.data.data.expense;
};

const updateExpense = async (expense: Expense, t?: any) => {
  // Ensure we send `id` instead of `_id` for the API
  const { _id, ...rest } = expense;
  if (!_id) {
    throw new Error(t ? t('expenses.toast.missingId') : 'Expense ID is required for update');
  }
  // Send `id` field for the PUT endpoint
  const response = await axios.put('/api/expenses', { id: _id, ...rest });
  if (!response.data.success) {
    throw new Error(response.data.error || (t ? t('expenses.toast.updateError') : 'Failed to update expense'));
  }
  return response.data.data.expense;
};

const deleteExpense = async (id: string, t?: any) => {
  const response = await axios.delete(`/api/expenses?id=${id}`);
  if (!response.data.success) {
    throw new Error(response.data.error || (t ? t('expenses.toast.deleteError') : 'Failed to delete expense'));
  }
  return true;
};

export const useExpenses = (type?: ExpenseType) => {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  // Query for fetching expenses
  const { 
    data: expenses = [], 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: [...EXPENSES_QUERY_KEY, type],
    queryFn: () => fetchExpenses(type, t),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Mutation for creating expenses
  const createMutation = useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXPENSES_QUERY_KEY });
      // Also invalidate dashboard data to refresh charts
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
      toast.success(t('expenses.toast.createSuccess'));
    },
    onError: (error: Error) => {
      toast.error(error.message || t('expenses.toast.createError'));
    },
  });

  // Mutation for updating expenses
  const updateMutation = useMutation({
    mutationFn: (expense: Expense) => updateExpense(expense, t),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXPENSES_QUERY_KEY });
      // Also invalidate dashboard data to refresh charts
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
      toast.success(t('expenses.toast.updateSuccess'));
    },
    onError: (error: Error) => {
      toast.error(error.message || t('expenses.toast.updateError'));
    },
  });

  // Mutation for deleting expenses
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteExpense(id, t),
    onMutate: (id: string) => {
      setIsDeleting(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXPENSES_QUERY_KEY });
      // Also invalidate dashboard data to refresh charts
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
      toast.success(t('expenses.toast.deleteSuccess'));
      setIsDeleting(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || t('expenses.toast.deleteError'));
      setIsDeleting(null);
    },
  });

  return {
    expenses,
    isLoading,
    error,
    refetch,
    createExpense: createMutation.mutate,
    isCreating: createMutation.isPending,
    updateExpense: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deleteExpense: deleteMutation.mutate,
    isDeleting,
  };
};

export default useExpenses; 