import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Integration from '@/models/Integration';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid integration ID format' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find integration by ID using Mongoose
    const integration = await Integration.findById(id);

    if (!integration) {
      return NextResponse.json(
        { success: false, error: 'Integration not found' },
        { status: 404 }
      );
    }

    // Return integration with success status
    return NextResponse.json({
      success: true,
      integration: integration.toObject()
    });
  } catch (error: any) {
    console.error('Error fetching integration:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch integration' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid integration ID format' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Delete integration by ID using Mongoose
    const result = await Integration.findByIdAndDelete(id);

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Integration not found' },
        { status: 404 }
      );
    }

    // Return success response
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting integration:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete integration' },
      { status: 500 }
    );
  }
} 