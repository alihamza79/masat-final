import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Order from '@/models/Order';
import Integration from '@/models/Integration';
import mongoose from 'mongoose';

/**
 * GET endpoint to fetch orders with pagination
 * Required query parameters: integrationId
 * Optional query parameters: page, pageSize, search
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const integrationId = searchParams.get('integrationId');
    const search = searchParams.get('search') || '';

    if (!integrationId) {
      return NextResponse.json({ success: false, error: 'Integration ID is required' }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(integrationId)) {
      return NextResponse.json({ success: false, error: 'Invalid integration ID format' }, { status: 400 });
    }

    await connectToDatabase();

    // If latest parameter is true, return the latest order date
    if (searchParams.get('latest') === 'true') {
      const latestOrder = await Order.findOne({ integrationId }).sort({ date: -1 });
      const latestOrderDate = latestOrder && latestOrder.date ? latestOrder.date : "1970-01-01 00:00:00";
      return NextResponse.json({ success: true, data: { latestOrderDate } });
    }

    const query: any = { integrationId };
    if (search) {
      query.$or = [
        { 'details.name': { $regex: search, $options: 'i' } },
        { 'details.code': { $regex: search, $options: 'i' } }
      ];
    }

    const orders = await Order.find(query).sort({ created: -1 });

    return NextResponse.json({ success: true, data: { orders } });
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch orders' }, { status: 500 });
  }
}

/**
 * POST endpoint to store orders
 * Required body: integrationId, orders
 * This endpoint appends new orders to the existing orders for the integration.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { integrationId, orders } = body;
    
    if (!integrationId) {
      return NextResponse.json(
        { success: false, error: 'Integration ID is required' },
        { status: 400 }
      );
    }
    
    if (!orders || !Array.isArray(orders)) {
      return NextResponse.json(
        { success: false, error: 'Orders must be provided as an array' },
        { status: 400 }
      );
    }
    
    // Validate integrationId format
    if (!mongoose.Types.ObjectId.isValid(integrationId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid integration ID format' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Map the orders; for each order, remove the 'id' field and set 'emagOrderId' to that value,
    // and include integrationId
    const formattedOrders = orders.map(order => {
      const { id, ...orderData } = order;
      return {
        ...orderData,
        integrationId,
        emagOrderId: id
      };
    });
    
    let insertedCount = 0;
    
    try {
      // Use ordered: false to continue processing even if some documents cause duplicate key errors
      // This allows the operation to skip duplicates instead of failing completely
      const insertResult = await Order.insertMany(formattedOrders, { 
        ordered: false 
      });
      
      insertedCount = insertResult.length;
      console.log(`Successfully inserted ${insertedCount} new orders for integration ${integrationId}`);
    } catch (error: any) {
      // If there's a write error, extract the number of successfully inserted documents
      if (error.code === 11000 && error.writeErrors && Array.isArray(error.writeErrors)) {
        // Count orders that were inserted before the first duplicate
        insertedCount = formattedOrders.length - error.writeErrors.length;
        console.log(`Inserted ${insertedCount} new orders for integration ${integrationId}, skipped ${error.writeErrors.length} duplicates`);
      } else {
        // Rethrow other errors
        throw error;
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        results: {
          insertedCount,
          skippedCount: formattedOrders.length - insertedCount
        },
        totalProcessed: orders.length
      }
    });
  } catch (error: any) {
    console.error('Error storing orders:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to store orders' },
      { status: 500 }
    );
  }
} 