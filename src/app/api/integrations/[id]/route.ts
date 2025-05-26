import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Integration from '@/models/Integration';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const id = params.id;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid integration ID format' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find integration by ID and ensure it belongs to the current user
    const integration = await Integration.findOne({ _id: id, userId });

    if (!integration) {
      return NextResponse.json(
        { success: false, error: 'Integration not found or you do not have permission to access it' },
        { status: 404 }
      );
    }

    // Return integration with success status, excluding the actual password
    const integrationData = integration.toObject();
    delete integrationData.password;
    
    return NextResponse.json({
      success: true,
      integration: integrationData
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
    const id = params.id;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid integration ID format' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Delete integration, ensuring it belongs to the current user
    const result = await Integration.findOneAndDelete({ _id: id, userId });

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Integration not found or you do not have permission to delete it' },
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