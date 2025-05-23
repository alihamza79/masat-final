import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import Notification from '@/models/Notification';
import mongoose from 'mongoose';

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
    const page = parseInt(url.searchParams.get('page') || '1');
    const unreadOnly = url.searchParams.get('unreadOnly') === 'true';
    const searchQuery = url.searchParams.get('search') || '';
    const typeFilter = url.searchParams.get('type') || '';
    
    // Time filter
    const timeRange = url.searchParams.get('timeRange') || '';
    const startDate = url.searchParams.get('startDate') || '';
    const endDate = url.searchParams.get('endDate') || '';
    
    // Calculate skip value for pagination
    const skip = (page - 1) * limit;
    
    // Connect to database
    await connectToDatabase();

    // Build query
    const query: any = { userId };
    
    // Apply unread filter
    if (unreadOnly) {
      query.read = false;
    }
    
    // Apply search query
    if (searchQuery) {
      query.$or = [
        { title: { $regex: searchQuery, $options: 'i' } },
        { message: { $regex: searchQuery, $options: 'i' } }
      ];
    }
    
    // Apply type filter
    if (typeFilter) {
      query.type = typeFilter;
    }
    
    // Apply time filter
    if (timeRange) {
      const now = new Date();
      let filterDate;
      
      switch (timeRange) {
        case 'today':
          filterDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'yesterday':
          filterDate = new Date(now.setDate(now.getDate() - 1));
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          filterDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        default:
          filterDate = null;
      }
      
      if (filterDate) {
        query.createdAt = { $gte: filterDate };
      }
    } else if (startDate && endDate) {
      // Use custom date range if provided
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Set to end of day
      
      query.createdAt = { 
        $gte: start,
        $lte: end
      };
    }

    // Get total count for pagination
    const totalCount = await Notification.countDocuments(query);
    
    // Get notifications with pagination
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
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
        unreadCount,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit)
        }
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

// Delete notifications
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

    // Get query parameters
    const url = new URL(req.url);
    const notificationId = url.searchParams.get('id');
    const deleteAll = url.searchParams.get('all') === 'true';
    
    // Connect to database
    await connectToDatabase();

    if (deleteAll) {
      // Delete all notifications for this user
      await Notification.deleteMany({ userId });
      
      return NextResponse.json({ 
        success: true,
        data: { message: 'All notifications deleted' }
      });
    } else if (notificationId) {
      // Validate ID
      if (!mongoose.Types.ObjectId.isValid(notificationId)) {
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid notification ID' 
        }, { status: 400 });
      }
      
      // Delete a single notification
      const result = await Notification.deleteOne({ 
        _id: notificationId,
        userId 
      });
      
      if (result.deletedCount === 0) {
        return NextResponse.json({ 
          success: false, 
          error: 'Notification not found or you do not have permission to delete it' 
        }, { status: 404 });
      }
      
      return NextResponse.json({ 
        success: true,
        data: { message: 'Notification deleted' }
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Notification ID or deleteAll parameter is required' 
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error deleting notifications:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to delete notifications' 
    }, { status: 500 });
  }
} 