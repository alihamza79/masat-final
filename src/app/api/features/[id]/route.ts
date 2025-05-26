import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Feature from '@/models/Feature';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

// GET endpoint to fetch a specific feature by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the user's session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { id } = params;
    
    // Validate ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Valid feature ID is required' },
        { status: 400 }
      );
    }
    
    // Connect to MongoDB
    await connectToDatabase();
    
    // Find the feature by ID
    const feature = await Feature.findById(id);
    
    if (!feature) {
      return NextResponse.json(
        { success: false, error: 'Feature not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: { feature }
    });
  } catch (error: any) {
    console.error(`Error fetching feature with ID ${params.id}:`, error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch feature' },
      { status: 500 }
    );
  }
} 