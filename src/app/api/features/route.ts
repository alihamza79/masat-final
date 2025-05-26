import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Feature from '@/models/Feature';
import FeatureSubscription from '@/models/FeatureSubscription';
import Notification from '@/models/Notification';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import mongoose from 'mongoose';

// Set export configuration for Next.js
export const dynamic = 'force-dynamic';

// GET endpoint to fetch all features
export async function GET(request: NextRequest) {
  try {
    // Get the user's session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Connect to MongoDB
    await connectToDatabase();
    
    // Get all features sorted by created date (newest first)
    const features = await Feature.find().sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      data: { features }
    });
  } catch (error: any) {
    console.error('Error fetching features:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch features' },
      { status: 500 }
    );
  }
}

// POST endpoint to create a new feature
export async function POST(request: NextRequest) {
  try {
    // Get the user's session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get request body
    const body = await request.json();
    const { subject, body: featureBody, status } = body;
    
    // Validate required fields
    if (!subject || !featureBody) {
      return NextResponse.json(
        { success: false, error: 'Subject and body are required' },
        { status: 400 }
      );
    }
    
    // Validate status
    if (status && !['Proposed', 'Development'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Status must be either "Proposed" or "Development"' },
        { status: 400 }
      );
    }
    
    // Connect to MongoDB
    await connectToDatabase();
    
    // Create new feature
    const feature = await Feature.create({
      subject,
      body: featureBody,
      status: status || 'Proposed',
      userId: session.user.id,
      createdBy: session.user.name || 'Unknown user'
    });
    
    return NextResponse.json({
      success: true,
      data: { feature },
      message: 'Feature request created successfully'
    });
  } catch (error: any) {
    console.error('Error creating feature:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create feature' },
      { status: 500 }
    );
  }
}

// PUT endpoint to update a feature
export async function PUT(request: NextRequest) {
  try {
    // Get the user's session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get request body
    const body = await request.json();
    const { id, subject, body: featureBody, status } = body;
    
    // Validate ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Valid feature ID is required' },
        { status: 400 }
      );
    }
    
    // Validate required fields
    if (!subject && !featureBody && !status) {
      return NextResponse.json(
        { success: false, error: 'At least one field to update is required' },
        { status: 400 }
      );
    }
    
    // Validate status
    if (status && !['Proposed', 'Development'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Status must be either "Proposed" or "Development"' },
        { status: 400 }
      );
    }
    
    // Connect to MongoDB
    await connectToDatabase();
    
    // Find feature
    const feature = await Feature.findById(id);
    
    if (!feature) {
      return NextResponse.json(
        { success: false, error: 'Feature not found' },
        { status: 404 }
      );
    }
    
    // Check if the current user is the feature creator
    if (feature.userId.toString() !== session.user.id.toString()) {
      return NextResponse.json(
        { success: false, error: 'You can only edit your own feature requests' },
        { status: 403 }
      );
    }
    
    // Track what changed for notifications
    const wasStatusChanged = status && feature.status !== status;
    const wasContentChanged = (subject && feature.subject !== subject) || (featureBody && feature.body !== featureBody);
    
    // Update fields if they're provided
    if (subject) feature.subject = subject;
    if (featureBody) feature.body = featureBody;
    if (status) feature.status = status;
    
    // Save updated feature
    feature.updatedAt = new Date();
    await feature.save();
    
    // Get subscribers to notify
    const subscribers = await FeatureSubscription.find({ featureId: id });
    
    // If there are subscribers and there were changes, create notifications
    if (subscribers.length > 0 && (wasStatusChanged || wasContentChanged)) {
      const notificationType = wasStatusChanged ? 'feature_status_change' : 'feature_update';
      const notificationTitle = wasStatusChanged 
        ? `Status changed: ${feature.subject}`
        : `Update: ${feature.subject}`;
      
      const notificationMessage = wasStatusChanged
        ? `Status changed to "${status}"`
        : 'Content has been updated';
      
      // Create notifications for all subscribers
      const notifications = subscribers.map(sub => ({
        userId: sub.userId,
        title: notificationTitle,
        message: notificationMessage,
        type: notificationType,
        referenceId: feature._id,
        referenceType: 'Feature',
        read: false
      }));
      
      // Bulk insert notifications
      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    }
    
    return NextResponse.json({
      success: true,
      data: { feature },
      message: 'Feature request updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating feature:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update feature' },
      { status: 500 }
    );
  }
}

// DELETE endpoint to delete a feature
export async function DELETE(request: NextRequest) {
  try {
    // Get the user's session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get feature ID from query params
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    // Validate ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Valid feature ID is required' },
        { status: 400 }
      );
    }
    
    // Connect to MongoDB
    await connectToDatabase();
    
    // Find the feature first
    const feature = await Feature.findById(id);
    
    if (!feature) {
      return NextResponse.json(
        { success: false, error: 'Feature not found' },
        { status: 404 }
      );
    }
    
    // Check if the current user is the feature creator
    if (feature.userId.toString() !== session.user.id.toString()) {
      return NextResponse.json(
        { success: false, error: 'You can only delete your own feature requests' },
        { status: 403 }
      );
    }
    
    // Delete the feature
    await Feature.findByIdAndDelete(id);
    
    // Also delete any subscriptions to this feature
    await FeatureSubscription.deleteMany({ featureId: id });
    
    return NextResponse.json({
      success: true,
      message: 'Feature request deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting feature:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete feature' },
      { status: 500 }
    );
  }
} 