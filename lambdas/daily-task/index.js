/**
 * Daily task Lambda function
 * Triggered every 5 minutes to process recurring expenses
 */

const axios = require('axios');
const { isSameDay } = require('date-fns');

const API_URL = process.env.API_URL;
const API_KEY = process.env.RECURRING_EXPENSES_API_KEY;

// Validate required environment variables
if (!API_URL) {
  throw new Error('API_URL environment variable is required');
}
if (!API_KEY) {
  throw new Error('RECURRING_EXPENSES_API_KEY environment variable is required');
}

// Configure axios with base URL and API key
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'x-api-key': API_KEY
  }
});

/**
 * Process recurring expenses that are due today
 * This function checks for duplicates and creates new expenses as needed
 */
async function processRecurringExpenses() {
  try {
    const currentDate = new Date();
    const todayString = currentDate.toISOString().split('T')[0];
    
    console.log(`Processing recurring expenses for ${todayString}`);
    
    // Fetch expenses that are due today using the optimized API endpoint
    const response = await api.get('/api/expenses/recurring', {
      params: {
        dueToday: true
      }
    });
    
    if (!response.data.success) {
      throw new Error('Failed to fetch recurring expenses due today');
    }
    
    const dueExpenses = response.data.data.expenses;
    console.log(`Found ${dueExpenses.length} recurring expenses due to be processed today`);
    
    // Process each expense
    const results = await Promise.all(
      dueExpenses.map(async (expense) => {
        try {
          // Check for existing expenses on the same date to prevent duplicates
          const existingExpenses = await api.get('/api/expenses/recurring', {
            params: {
              date: todayString,
              description: expense.description,
              amount: expense.amount,
            },
          });
          
          console.log(`Checking for duplicates of "${expense.description}" on ${todayString}`);
          
          // Check for duplicates
          const isDuplicate = existingExpenses.data.data.expenses.some(e => 
            e.description === expense.description && 
            e.amount === expense.amount &&
            isSameDay(new Date(e.date), currentDate)
          );
          
          if (!isDuplicate) {
            // Create new expense with today's date
            const newExpense = {
              ...expense,
              date: currentDate.toISOString(),
              _id: undefined, // Remove _id to create new expense
            };
            
            console.log(`Creating new recurring expense for "${expense.description}" on ${todayString}`);
            await api.post('/api/expenses/recurring', newExpense);
            return { expenseId: expense._id, created: true };
          } else {
            console.log(`Skipping duplicate expense "${expense.description}" on ${todayString}`);
            return { expenseId: expense._id, created: false };
          }
        } catch (error) {
          console.error(`Error processing expense ${expense._id}:`, error);
          return { expenseId: expense._id, error: error.message };
        }
      })
    );
    
    // Count created expenses
    const created = results.filter(r => r.created).length;
    const skipped = results.filter(r => !r.created && !r.error).length;
    const errors = results.filter(r => r.error).length;
    
    console.log(`Processing summary: ${created} created, ${skipped} skipped (duplicates), ${errors} errors`);
    
    return { created, skipped, errors };
  } catch (error) {
    console.error('Error processing recurring expenses:', error);
    throw error;
  }
}

/**
 * Main Lambda handler
 */
exports.handler = async (event, context) => {
  try {
    console.log('Daily task Lambda function executed at:', new Date().toISOString());
    
    // Process recurring expenses due today
    const summary = await processRecurringExpenses();
    
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