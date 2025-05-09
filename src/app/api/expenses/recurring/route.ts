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