import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import FeatureSubscription from '@/models/FeatureSubscription';
import Feature from '@/models/Feature';

export async function POST(req: NextRequest) {
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

    // Parse request body
    const body = await req.json();
    const { featureId } = body;
    
    if (!featureId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Feature ID is required' 
      }, { status: 400 });
    }

    // Connect to database
    await connectToDatabase();

    // Check if feature exists
    const feature = await Feature.findById(featureId);
    if (!feature) {
      return NextResponse.json({ 
        success: false, 
        error: 'Feature not found' 
      }, { status: 404 });
    }

    // Check if user is the feature creator (can't subscribe to own feature)
    if (feature.userId.toString() === userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'You cannot subscribe to your own feature' 
      }, { status: 400 });
    }

    // Create subscription (upsert to handle potential duplicates)
    const subscription = await FeatureSubscription.findOneAndUpdate(
      { featureId, userId },
      { featureId, userId },
      { upsert: true, new: true }
    );

    return NextResponse.json({ 
      success: true, 
      data: { subscription } 
    });
  } catch (error: any) {
    console.error('Error subscribing to feature:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to subscribe to feature' 
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
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

    // Delete subscription
    const result = await FeatureSubscription.findOneAndDelete({
      featureId,
      userId
    });

    if (!result) {
      return NextResponse.json({ 
        success: false, 
        error: 'Subscription not found' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      data: { message: 'Unsubscribed successfully' }
    });
  } catch (error: any) {
    console.error('Error unsubscribing from feature:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to unsubscribe from feature' 
    }, { status: 500 });
  }
} 