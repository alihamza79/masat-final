import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import Expense, { IExpense } from '@/models/Expense';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic'; // Disable caching for this route

/**
 * GET endpoint to fetch expenses for the current user
 */
export async function GET(request: NextRequest) {
  try {
    // Get the user's session
    const session = await getServerSession(authOptions);
    
    // Check if the user is authenticated
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Get optional expense ID from query parameters
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    await connectToDatabase();
    
    if (id) {
      // Validate ID format
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json(
          { success: false, error: 'Invalid expense ID format' },
          { status: 400 }
        );
      }
      
      // Get a specific expense by ID (only if it belongs to the current user)
      const expense = await Expense.findOne({ _id: id, userId });
      
      if (!expense) {
        return NextResponse.json(
          { success: false, error: 'Expense not found or you do not have permission to view it' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        data: { expense }
      });
    } else {
      // Get optional filter parameters
      const type = searchParams.get('type');
      
      // Build query - always filter by userId
      const query: any = { userId };
      
      // Add type filter if provided
      if (type && ['one-time', 'monthly', 'annually', 'cogs'].includes(type)) {
        query.type = type;
      }
      
      // Fetch all expenses for this user with optional filters
      const expenses = await Expense.find(query).sort({ date: -1 });
      
      return NextResponse.json({
        success: true,
        data: { expenses }
      });
    }
  } catch (error: any) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint to create a new expense
 */
export async function POST(request: NextRequest) {
  try {
    // Get the user's session
    const session = await getServerSession(authOptions);
    
    // Check if the user is authenticated
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const body = await request.json();
    const { type, description, amount, date, isRecurring, product } = body;
    
    // Validate required fields
    if (!type || !['one-time', 'monthly', 'annually', 'cogs'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Valid expense type is required (one-time, monthly, annually, cogs)' },
        { status: 400 }
      );
    }
    
    if (!amount || isNaN(Number(amount)) || Number(amount) < 0) {
      return NextResponse.json(
        { success: false, error: 'Valid amount is required' },
        { status: 400 }
      );
    }
    
    if (!date) {
      return NextResponse.json(
        { success: false, error: 'Date is required' },
        { status: 400 }
      );
    }
    
    // For non-COGS expenses, description is required
    if (type !== 'cogs' && !description) {
      return NextResponse.json(
        { success: false, error: 'Description is required for non-COGS expenses' },
        { status: 400 }
      );
    }
    
    // For COGS expenses, product details are required
    if (type === 'cogs') {
      if (!product || !product.name || !product.unitsCount || !product.costPerUnit) {
        return NextResponse.json(
          { success: false, error: 'Product details (name, unitsCount, costPerUnit) are required for COGS expenses' },
          { status: 400 }
        );
      }
    }
    
    await connectToDatabase();
    
    // Create a new expense
    const newExpense = new Expense({
      userId,
      type,
      description: type === 'cogs' ? product.name : description, // For COGS, use product name as description
      amount: type === 'cogs' ? product.unitsCount * product.costPerUnit : Number(amount),
      date: new Date(date),
      isRecurring: isRecurring || false,
      ...(type === 'cogs' && product ? { product } : {})
    });
    
    await newExpense.save();
    
    return NextResponse.json({
      success: true,
      data: { expense: newExpense }
    });
  } catch (error: any) {
    console.error('Error creating expense:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * PUT endpoint to update an existing expense
 */
export async function PUT(request: NextRequest) {
  try {
    // Get the user's session
    const session = await getServerSession(authOptions);
    
    // Check if the user is authenticated
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const body = await request.json();
    const { id, type, description, amount, date, isRecurring, product } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Expense ID is required' },
        { status: 400 }
      );
    }
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid expense ID format' },
        { status: 400 }
      );
    }
    
    // Build update object
    const updateData: any = {};
    
    if (type) {
      if (!['one-time', 'monthly', 'annually', 'cogs'].includes(type)) {
        return NextResponse.json(
          { success: false, error: 'Invalid expense type' },
          { status: 400 }
        );
      }
      updateData.type = type;
    }
    
    if (type !== 'cogs' && description !== undefined) {
      updateData.description = description;
    }
    
    if (amount !== undefined && !isNaN(Number(amount)) && Number(amount) >= 0) {
      updateData.amount = Number(amount);
    }
    
    if (date) {
      updateData.date = new Date(date);
    }
    
    if (isRecurring !== undefined) {
      updateData.isRecurring = Boolean(isRecurring);
    }
    
    // Handle product updates for COGS expenses
    if (type === 'cogs' && product) {
      // For COGS expenses, calculate amount based on units and cost
      if (product.unitsCount !== undefined && product.costPerUnit !== undefined) {
        updateData.amount = product.unitsCount * product.costPerUnit;
      }
      
      updateData.product = product;
      updateData.description = product.name; // Use product name as description for COGS
    }
    
    await connectToDatabase();
    
    // Find and update the expense, ensuring it belongs to the current user
    const updatedExpense = await Expense.findOneAndUpdate(
      { _id: id, userId },
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedExpense) {
      return NextResponse.json(
        { success: false, error: 'Expense not found or you do not have permission to update it' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: { expense: updatedExpense }
    });
  } catch (error: any) {
    console.error('Error updating expense:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * DELETE endpoint to remove an expense
 */
export async function DELETE(request: NextRequest) {
  try {
    // Get the user's session
    const session = await getServerSession(authOptions);
    
    // Check if the user is authenticated
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Get expense ID from query parameters
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Expense ID is required' },
        { status: 400 }
      );
    }
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid expense ID format' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Find and delete expense, ensuring it belongs to the current user
    const result = await Expense.findOneAndDelete({ _id: id, userId });
    
    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Expense not found or you do not have permission to delete it' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting expense:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 