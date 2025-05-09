import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Expense from '@/models/Expense';
import { Types } from 'mongoose';

// API key validation middleware
const validateApiKey = (request: NextRequest) => {
  const apiKey = request.headers.get('x-api-key');
  
  // Hardcoded test API key - will be replaced with environment variable later
  const validApiKey = "masat-recurring-test-key-123456";
  
  if (!apiKey || apiKey !== validApiKey) {
    return false;
  }
  
  return true;
};

// GET handler for fetching recurring expenses
export async function GET(request: NextRequest) {
  try {
    // Validate API key
    if (!validateApiKey(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const isRecurring = searchParams.get('isRecurring');
    const date = searchParams.get('date');
    const description = searchParams.get('description');
    const amount = searchParams.get('amount');
    const dueToday = searchParams.get('dueToday');
    
    // If dueToday=true, use specialized query to find recurring expenses due today
    if (dueToday === 'true') {
      return await getDueExpenses(searchParams);
    }

    // Build query
    const query: any = {};

    // Handle type filter (can be array or single value)
    if (type) {
      try {
        const types = JSON.parse(type);
        query.type = Array.isArray(types) ? { $in: types } : types;
      } catch {
        query.type = type;
      }
    }

    // Handle isRecurring filter
    if (isRecurring !== null) {
      query.isRecurring = isRecurring === 'true';
    }

    // Handle date filter
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      query.date = {
        $gte: startDate,
        $lte: endDate
      };
    }

    // Handle description filter
    if (description) {
      query.description = description;
    }

    // Handle amount filter
    if (amount) {
      query.amount = parseFloat(amount);
    }

    // Execute query
    const expenses = await Expense.find(query).sort({ date: -1 });

    return NextResponse.json({
      success: true,
      data: {
        expenses: expenses.map(expense => ({
          ...expense.toObject(),
          _id: expense._id.toString(),
          userId: expense.userId.toString()
        }))
      }
    });
  } catch (error: any) {
    console.error('Error in recurring expenses GET:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Function to get expenses that are due to be processed today
async function getDueExpenses(searchParams: URLSearchParams) {
  try {
    // Get current date
    const currentDate = new Date();
    const currentDay = currentDate.getDate();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Build the aggregation pipeline
    const pipeline: any[] = [
      // Stage 1: Match recurring expenses
      {
        $match: {
          isRecurring: true
        }
      },
      // Stage 2: Add processed fields for date comparison
      {
        $addFields: {
          // Extract day, month, year from the expense date
          expenseDay: { $dayOfMonth: "$date" },
          expenseMonth: { $month: "$date" },
          expenseYear: { $year: "$date" },
          currentDay: currentDay,
          currentMonth: currentMonth + 1, // MongoDB months are 1-12
          currentYear: currentYear
        }
      },
      // Stage 3: Filter based on expense type and date conditions
      {
        $match: {
          $or: [
            // Monthly recurring: same day of month, but different month/year
            {
              type: "monthly",
              expenseDay: currentDay,
              $or: [
                { expenseMonth: { $ne: currentMonth + 1 } },
                { expenseYear: { $ne: currentYear } }
              ]
            },
            // Monthly recurring: last day of month when original day doesn't exist in current month
            {
              type: "monthly",
              expenseDay: { $gt: currentDay },
              currentDay: { $in: [28, 29, 30, 31] }, // Last days of a month
              $expr: {
                // Check if today is the last day of the month
                $and: [
                  // Today's month is one of those with last day < 31
                  { $in: [currentMonth + 1, [2, 4, 6, 9, 11]] },
                  // For February special case
                  {
                    $or: [
                      // For February in non-leap years
                      {
                        $and: [
                          { $eq: [currentMonth + 1, 2] },
                          { $eq: [currentDay, 28] },
                          { $ne: { $mod: [currentYear, 4] } }
                        ]
                      },
                      // For February in leap years
                      {
                        $and: [
                          { $eq: [currentMonth + 1, 2] },
                          { $eq: [currentDay, 29] },
                          { $eq: { $mod: [currentYear, 4] } }
                        ]
                      },
                      // For months with 30 days
                      {
                        $and: [
                          { $in: [currentMonth + 1, [4, 6, 9, 11]] },
                          { $eq: [currentDay, 30] }
                        ]
                      }
                    ]
                  }
                ]
              }
            },
            // Annual recurring: same day and month, different year
            {
              type: "annually",
              expenseDay: currentDay,
              expenseMonth: currentMonth + 1,
              expenseYear: { $ne: currentYear }
            },
            // Annual recurring: Feb 28/29 special case
            {
              type: "annually",
              expenseDay: 29,
              expenseMonth: 2,
              $expr: {
                $and: [
                  { $eq: [currentMonth + 1, 2] },
                  { $eq: [currentDay, 28] },
                  { $ne: { $mod: [currentYear, 4] } } // Not a leap year
                ]
              }
            }
          ]
        }
      },
      // Stage 4: Project only the fields we need
      {
        $project: {
          expenseDay: 0,
          expenseMonth: 0,
          expenseYear: 0,
          currentDay: 0,
          currentMonth: 0,
          currentYear: 0
        }
      }
    ];
    
    // Additional filters if provided
    const typeFilter = searchParams.get('type');
    if (typeFilter) {
      try {
        const types = JSON.parse(typeFilter);
        if (Array.isArray(types)) {
          pipeline[0].$match.type = { $in: types };
        } else {
          pipeline[0].$match.type = types;
        }
      } catch {
        pipeline[0].$match.type = typeFilter;
      }
    }
    
    // Execute aggregation
    const dueExpenses = await Expense.aggregate(pipeline);
    
    console.log(`Found ${dueExpenses.length} expenses due to be processed today`);
    
    return NextResponse.json({
      success: true,
      data: {
        expenses: dueExpenses.map((expense: any) => ({
          ...expense,
          _id: expense._id.toString(),
          userId: expense.userId.toString()
        }))
      }
    });
  } catch (error: any) {
    console.error('Error getting due expenses:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST handler for creating new recurring expenses
export async function POST(request: NextRequest) {
  try {
    // Validate API key
    if (!validateApiKey(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Get request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.type || !body.amount || !body.date) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create new expense
    const expense = new Expense({
      ...body,
      userId: new Types.ObjectId(body.userId), // Convert string ID to ObjectId
      date: new Date(body.date)
    });

    // Save expense
    await expense.save();

    return NextResponse.json({
      success: true,
      data: {
        expense: {
          ...expense.toObject(),
          _id: expense._id.toString(),
          userId: expense.userId.toString()
        }
      }
    });
  } catch (error: any) {
    console.error('Error in recurring expenses POST:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 