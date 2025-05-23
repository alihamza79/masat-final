import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectDB from '@/app/lib/mongodb';
import Feature from '@/models/Feature';
import FeatureVote from '@/models/FeatureVote';
import mongoose from 'mongoose';
import { authOptions } from '@/app/lib/auth';

// POST endpoint to vote for a feature
export async function POST(request: NextRequest) {
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
    
    // Parse request body
    const body = await request.json();
    
    if (!body.featureId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Feature ID is required' 
      }, { status: 400 });
    }
    
    await connectDB();
    
    // Validate feature ID format
    if (!mongoose.Types.ObjectId.isValid(body.featureId)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid feature ID format' 
      }, { status: 400 });
    }
    
    const featureId = new mongoose.Types.ObjectId(body.featureId);
    
    // Check if feature exists
    const feature = await Feature.findById(featureId);
    if (!feature) {
      return NextResponse.json({ 
        success: false, 
        error: 'Feature not found' 
      }, { status: 404 });
    }
    
    // Check if user is voting for their own feature
    if (feature.userId.toString() === userId.toString()) {
      return NextResponse.json({ 
        success: false, 
        error: 'You cannot vote for your own feature' 
      }, { status: 400 });
    }
    
    // Check if user has already voted
    const existingVote = await FeatureVote.findOne({ 
      featureId, 
      userId: new mongoose.Types.ObjectId(userId) 
    });
    
    if (existingVote) {
      return NextResponse.json({ 
        success: false, 
        error: 'You have already voted for this feature' 
      }, { status: 400 });
    }
    
    // Create vote record
    const newVote = new FeatureVote({
      featureId,
      userId: new mongoose.Types.ObjectId(userId),
    });
    
    await newVote.save();
    
    // Increment vote count on the feature
    await Feature.findByIdAndUpdate(
      featureId,
      { $inc: { voteCount: 1 } },
      { new: true }
    );
    
    return NextResponse.json({ 
      success: true, 
      data: { message: 'Vote added successfully' } 
    });
    
  } catch (error: any) {
    console.error('Error adding vote:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'An error occurred while adding vote' 
    }, { status: 500 });
  }
}

// DELETE endpoint to remove a vote
export async function DELETE(request: NextRequest) {
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
    
    const objectFeatureId = new mongoose.Types.ObjectId(featureId);
    
    // Find and delete the vote
    const deletedVote = await FeatureVote.findOneAndDelete({ 
      featureId: objectFeatureId, 
      userId: new mongoose.Types.ObjectId(userId) 
    });
    
    if (!deletedVote) {
      return NextResponse.json({ 
        success: false, 
        error: 'Vote not found' 
      }, { status: 404 });
    }
    
    // Decrement vote count on the feature
    await Feature.findByIdAndUpdate(
      objectFeatureId,
      { $inc: { voteCount: -1 } },
      { new: true }
    );
    
    return NextResponse.json({ 
      success: true, 
      data: { message: 'Vote removed successfully' } 
    });
    
  } catch (error: any) {
    console.error('Error removing vote:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'An error occurred while removing vote' 
    }, { status: 500 });
  }
} 