import { useMemo } from 'react';
import { Expense, ExpenseType } from './useExpenses';
import { format, isThisMonth, isThisYear } from 'date-fns';

interface ExpenseStats {
  totalExpenses: number;
  monthlyExpenses: number;
  yearlyExpenses: number;
  cogsExpenses: number;
  expensesByType: {
    'one-time': number;
    'monthly': number;
    'annually': number;
    'cogs': number;
  };
  currentMonthTotal: number;
  currentYearTotal: number;
}

export const useExpenseStats = (expenses: Expense[]): ExpenseStats => {
  const stats = useMemo(() => {
    // Default values
    const result: ExpenseStats = {
      totalExpenses: 0,
      monthlyExpenses: 0,
      yearlyExpenses: 0,
      cogsExpenses: 0,
      expensesByType: {
        'one-time': 0,
        'monthly': 0,
        'annually': 0,
        'cogs': 0,
      },
      currentMonthTotal: 0,
      currentYearTotal: 0,
    };

    if (!expenses || !expenses.length) {
      return result;
    }

    // Calculate totals by expense type
    expenses.forEach(expense => {
      // Add to total expenses
      result.totalExpenses += expense.amount;

      // Add to expenses by type
      result.expensesByType[expense.type] += expense.amount;

      // Calculate recurring expenses (monthly and annual)
      if (expense.type === 'monthly') {
        result.monthlyExpenses += expense.amount;
      } else if (expense.type === 'annually') {
        result.yearlyExpenses += expense.amount;
      } else if (expense.type === 'cogs') {
        result.cogsExpenses += expense.amount;
      }

      // Calculate current month and year expenses
      const expenseDate = new Date(expense.date);
      if (isThisMonth(expenseDate)) {
        result.currentMonthTotal += expense.amount;
      }
      
      if (isThisYear(expenseDate)) {
        result.currentYearTotal += expense.amount;
      }
    });

    return result;
  }, [expenses]);

  return stats;
};

export default useExpenseStats; 