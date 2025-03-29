import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Order from '@/models/Order';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
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
    
    // Get total count
    const totalCount = await Order.countDocuments({ integrationId });
    
    return NextResponse.json({
      success: true,
      data: {
        totalCount
      }
    });
  } catch (error: any) {
    console.error('Error counting orders:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to count orders' },
      { status: 500 }
    );
  }
} 