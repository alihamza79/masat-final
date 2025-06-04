import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/app/lib/mongodb';
import Payment from '@/models/Payment';
import { Types } from 'mongoose';

export async function GET(request: Request) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Connect to database
    await connectDB();
    
    // Get user ID from session
    const userId = session.user.id;
    
    // Calculate skip for pagination
    const skip = (page - 1) * limit;
    
    // Query payments for this user
    const payments = await Payment.find({ 
      userId: new Types.ObjectId(userId) 
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Get total count for pagination
    const total = await Payment.countDocuments({ 
      userId: new Types.ObjectId(userId) 
    });
    
    // Calculate total pages
    const pages = Math.ceil(total / limit);
    
    return NextResponse.json({
      payments,
      pagination: {
        total,
        page,
        limit,
        pages
      }
    });
    
  } catch (error: any) {
    console.error('Payment history API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment history', details: error.message },
      { status: 500 }
    );
  }
} 