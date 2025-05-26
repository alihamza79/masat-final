import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectDB from '@/app/lib/mongodb';
import FeatureVote from '@/models/FeatureVote';
import mongoose from 'mongoose';
import { authOptions } from '@/lib/auth';

// GET endpoint to check if user has voted for a feature
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check authentication
    if (!session || !session.user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }
    
    // Get user ID
    const userId = session.user.id;
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID not found in session' 
      }, { status: 400 });
    }
    
    // Get feature ID from query
    const url = new URL(request.url);
    const featureId = url.searchParams.get('featureId');
    
    if (!featureId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Feature ID is required' 
      }, { status: 400 });
    }
    
    await connectDB();
    
    // Validate feature ID format
    if (!mongoose.Types.ObjectId.isValid(featureId)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid feature ID format' 
      }, { status: 400 });
    }
    
    // Check if user has already voted
    const existingVote = await FeatureVote.findOne({ 
      featureId: new mongoose.Types.ObjectId(featureId), 
      userId: new mongoose.Types.ObjectId(userId) 
    });
    
    return NextResponse.json({ 
      success: true, 
      data: { hasVoted: Boolean(existingVote) } 
    });
    
  } catch (error: any) {
    console.error('Error checking vote status:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'An error occurred while checking vote status' 
    }, { status: 500 });
  }
} 