import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import FeatureSubscription from '@/models/FeatureSubscription';

export async function GET(req: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }
    const userId = session.user.id;

    // Get featureId from query params
    const url = new URL(req.url);
    const featureId = url.searchParams.get('featureId');
    
    if (!featureId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Feature ID is required' 
      }, { status: 400 });
    }

    // Connect to database
    await connectToDatabase();

    // Check if subscription exists
    const subscription = await FeatureSubscription.findOne({
      featureId,
      userId
    });

    return NextResponse.json({ 
      success: true,
      data: { 
        isSubscribed: !!subscription,
        subscription
      }
    });
  } catch (error: any) {
    console.error('Error checking subscription status:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to check subscription status' 
    }, { status: 500 });
  }
} 