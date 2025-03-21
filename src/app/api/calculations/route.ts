import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import SavedCalculation from '@/app/models/SavedCalculation';

// GET handler to retrieve all saved calculations
export async function GET() {
  try {
    await connectDB();
    const calculations = await SavedCalculation.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: calculations });
  } catch (error) {
    console.error('Error fetching calculations:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch calculations' },
      { status: 500 }
    );
  }
}

// POST handler to save a new calculation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, calculatorState, emagProduct } = body;

    // Validate based on calculation type
    if (emagProduct) {
      // For eMAG products, we need the emagProduct data and calculatorState
      if (!emagProduct.productId || !emagProduct.integrationId || !calculatorState) {
        return NextResponse.json(
          { success: false, message: 'eMAG product ID, integration ID, and calculator state are required' },
          { status: 400 }
        );
      }
    } else {
      // For created products, we need title and calculatorState
      if (!title || !calculatorState) {
        return NextResponse.json(
          { success: false, message: 'Title and calculator state are required' },
          { status: 400 }
        );
      }
    }

    await connectDB();
    
    // Check if there's already a saved calculation for this eMAG product
    if (emagProduct) {
      const existingCalculation = await SavedCalculation.findOne({
        'emagProduct.integrationId': emagProduct.integrationId,
        'emagProduct.productId': emagProduct.productId
      });
      
      if (existingCalculation) {
        // Update the existing calculation
        existingCalculation.calculatorState = calculatorState;
        await existingCalculation.save();
        
        return NextResponse.json({ 
          success: true, 
          message: 'Calculation updated successfully', 
          data: existingCalculation 
        });
      }
    }
    
    // Create a new calculation
    const newCalculation = await SavedCalculation.create({
      title,
      description,
      emagProduct,
      calculatorState
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Calculation saved successfully', 
      data: newCalculation 
    });
  } catch (error) {
    console.error('Error saving calculation:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to save calculation' },
      { status: 500 }
    );
  }
} 