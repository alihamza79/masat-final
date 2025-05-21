import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import Notification from '@/models/Notification';

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

    // Get query parameters
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const unreadOnly = url.searchParams.get('unreadOnly') === 'true';
    
    // Connect to database
    await connectToDatabase();

    // Build query
    const query: any = { userId };
    if (unreadOnly) {
      query.read = false;
    }

    // Get notifications
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);

    // Get count of unread notifications
    const unreadCount = await Notification.countDocuments({
      userId,
      read: false
    });

    return NextResponse.json({ 
      success: true,
      data: { 
        notifications,
        unreadCount
      }
    });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to fetch notifications' 
    }, { status: 500 });
  }
}

// Mark notifications as read
export async function PUT(req: NextRequest) {
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
    const { notificationIds, markAll = false } = body;
    
    // Connect to database
    await connectToDatabase();

    if (markAll) {
      // Mark all notifications as read
      await Notification.updateMany(
        { userId },
        { $set: { read: true } }
      );
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      await Notification.updateMany(
        { 
          _id: { $in: notificationIds },
          userId 
        },
        { $set: { read: true } }
      );
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Notification IDs are required or markAll must be true' 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true,
      data: { message: 'Notifications marked as read' }
    });
  } catch (error: any) {
    console.error('Error marking notifications as read:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to mark notifications as read' 
    }, { status: 500 });
  }
} 