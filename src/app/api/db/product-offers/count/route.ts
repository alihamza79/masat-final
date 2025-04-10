export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import ProductOffer from '@/models/ProductOffer';
import Integration from '@/models/Integration';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';

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
    const searchParams = request.nextUrl.searchParams;
    const integrationId = searchParams.get('integrationId');
    
    if (!integrationId) {
      return NextResponse.json(
        { success: false, error: 'Integration ID is required' },
        { status: 400 }
      );
    }
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(integrationId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid integration ID format' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // First verify that the integration belongs to the current user
    const integration = await Integration.findOne({ _id: integrationId, userId });
    
    if (!integration) {
      return NextResponse.json(
        { success: false, error: 'Integration not found or you do not have permission to access it' },
        { status: 404 }
      );
    }
    
    // Get total count
    const totalCount = await ProductOffer.countDocuments({ integrationId });
    
    return NextResponse.json({
      success: true,
      data: {
        totalCount
      }
    });
  } catch (error: any) {
    console.error('Error counting product offers:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to count product offers' },
      { status: 500 }
    );
  }
} 