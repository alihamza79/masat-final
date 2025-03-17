import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import SavedCalculation from '@/app/models/SavedCalculation';

// GET handler to retrieve a specific calculation by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await connectDB();
    
    const calculation = await SavedCalculation.findById(id);
    
    if (!calculation) {
      return NextResponse.json(
        { success: false, message: 'Calculation not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: calculation });
  } catch (error) {
    console.error('Error fetching calculation:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch calculation' },
      { status: 500 }
    );
  }
}

// PUT handler to update an existing calculation
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { title, description, calculatorState } = body;

    if (!title || !calculatorState) {
      return NextResponse.json(
        { success: false, message: 'Title and calculator state are required' },
        { status: 400 }
      );
    }

    await connectDB();
    
    const calculation = await SavedCalculation.findById(id);
    
    if (!calculation) {
      return NextResponse.json(
        { success: false, message: 'Calculation not found' },
        { status: 404 }
      );
    }
    
    // Update the calculation
    calculation.title = title;
    calculation.description = description;
    calculation.calculatorState = calculatorState;
    
    await calculation.save();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Calculation updated successfully', 
      data: calculation 
    });
  } catch (error) {
    console.error('Error updating calculation:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update calculation' },
      { status: 500 }
    );
  }
}

// DELETE handler to delete a calculation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await connectDB();
    
    const calculation = await SavedCalculation.findByIdAndDelete(id);
    
    if (!calculation) {
      return NextResponse.json(
        { success: false, message: 'Calculation not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Calculation deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting calculation:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete calculation' },
      { status: 500 }
    );
  }
} 