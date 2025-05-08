/**
 * Daily task Lambda function
 * Triggered at 00:05 (5 minutes after midnight) every day
 */

const axios = require('axios');
const { addMonths, addYears, isSameDay, differenceInDays } = require('date-fns');

// Configure axios with base URL and API key
const api = axios.create({
  baseURL: 'https://masat-dev.shiftcrowd.eu',
  timeout: 10000,
  headers: {
    'x-api-key': process.env.RECURRING_EXPENSES_API_KEY || 'masat-recurring-test-key-123456'
  }
});

/**
 * Process recurring expenses
 * @param {Object} expense - The recurring expense to process
 * @param {Date} currentDate - The current date
 * @returns {Promise<boolean>} - Whether a new expense was created
 */
async function processRecurringExpense(expense, currentDate) {
  try {
    const expenseDate = new Date(expense.date);
    let shouldCreate = false;
    let newDate;

    if (expense.type === 'monthly' && expense.isRecurring) {
      // For monthly expenses, check if we need to create a new expense
      const nextMonthDate = addMonths(expenseDate, 1);
      shouldCreate = isSameDay(currentDate, nextMonthDate);
      newDate = nextMonthDate;
    } else if (expense.type === 'annually' && expense.isRecurring) {
      // For annual expenses, check if we need to create a new expense
      const nextYearDate = addYears(expenseDate, 1);
      shouldCreate = isSameDay(currentDate, nextYearDate);
      newDate = nextYearDate;
    }

    if (shouldCreate) {
      // Check for existing expenses on the same date to prevent duplicates
      const existingExpenses = await api.get('/api/expenses/recurring', {
        params: {
          date: newDate.toISOString().split('T')[0],
          description: expense.description,
          amount: expense.amount,
        },
      });

      // If no duplicate exists, create new expense
      if (!existingExpenses.data.data.expenses.some(e => 
        e.description === expense.description && 
        e.amount === expense.amount &&
        isSameDay(new Date(e.date), newDate)
      )) {
        const newExpense = {
          ...expense,
          date: newDate.toISOString(),
          _id: undefined, // Remove _id to create new expense
        };

        await api.post('/api/expenses/recurring', newExpense);
        console.log(`Created new recurring expense for ${expense.description} on ${newDate.toISOString()}`);
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error(`Error processing recurring expense ${expense._id}:`, error);
    return false;
  }
}

/**
 * Check for missed recurring expenses
 * @param {Object} expense - The recurring expense to check
 * @param {Date} currentDate - The current date
 * @returns {Promise<boolean>} - Whether any missed expenses were created
 */
async function checkMissedRecurringExpenses(expense, currentDate) {
  try {
    const expenseDate = new Date(expense.date);
    let missedDates = [];

    if (expense.type === 'monthly' && expense.isRecurring) {
      // Calculate missed months
      const monthsDiff = differenceInDays(currentDate, expenseDate) / 30;
      if (monthsDiff > 1) {
        for (let i = 1; i < Math.floor(monthsDiff); i++) {
          missedDates.push(addMonths(expenseDate, i));
        }
      }
    } else if (expense.type === 'annually' && expense.isRecurring) {
      // Calculate missed years
      const yearsDiff = differenceInDays(currentDate, expenseDate) / 365;
      if (yearsDiff > 1) {
        for (let i = 1; i < Math.floor(yearsDiff); i++) {
          missedDates.push(addYears(expenseDate, i));
        }
      }
    }

    if (missedDates.length > 0) {
      // Get all existing expenses for this recurring expense
      const existingExpenses = await api.get('/api/expenses/recurring', {
        params: {
          description: expense.description,
          amount: expense.amount,
        },
      });

      // Filter out dates that already have expenses
      const existingDates = existingExpenses.data.data.expenses.map(e => 
        new Date(e.date).toISOString().split('T')[0]
      );

      // Create missed expenses
      for (const date of missedDates) {
        const dateStr = date.toISOString().split('T')[0];
        if (!existingDates.includes(dateStr)) {
          const newExpense = {
            ...expense,
            date: date.toISOString(),
            _id: undefined,
          };

          await api.post('/api/expenses/recurring', newExpense);
          console.log(`Created missed recurring expense for ${expense.description} on ${dateStr}`);
        }
      }

      return true;
    }

    return false;
  } catch (error) {
    console.error(`Error checking missed expenses for ${expense._id}:`, error);
    return false;
  }
}

/**
 * Main Lambda handler
 */
exports.handler = async (event, context) => {
  try {
    console.log('Daily task Lambda function executed at:', new Date().toISOString());
    
    // Get current date
    const currentDate = new Date();
    
    // Fetch all recurring expenses
    const response = await api.get('/api/expenses/recurring', {
      params: {
        type: ['monthly', 'annually'],
        isRecurring: true,
      },
    });

    if (!response.data.success) {
      throw new Error('Failed to fetch recurring expenses');
    }

    const recurringExpenses = response.data.data.expenses;
    console.log(`Found ${recurringExpenses.length} recurring expenses to process`);

    // Process each recurring expense
    const results = await Promise.all(
      recurringExpenses.map(async (expense) => {
        // First check for missed expenses
        const missedCreated = await checkMissedRecurringExpenses(expense, currentDate);
        
        // Then process current recurring expense
        const newCreated = await processRecurringExpense(expense, currentDate);
        
        return { expenseId: expense._id, missedCreated, newCreated };
      })
    );

    // Log results
    const summary = results.reduce((acc, result) => {
      if (result.missedCreated) acc.missedCreated++;
      if (result.newCreated) acc.newCreated++;
      return acc;
    }, { missedCreated: 0, newCreated: 0 });

    console.log('Recurring expenses processing summary:', summary);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Daily task executed successfully',
        timestamp: new Date().toISOString(),
        summary,
      })
    };
  } catch (error) {
    console.error('Error executing daily task:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error executing daily task',
        error: error.message
      })
    };
  }
};