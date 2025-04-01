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
 * Uses MongoDB transactions for atomicity - either all operations succeed or none do.
 */
export async function POST(request: NextRequest) {
  // We'll need this to track the session for cleanup in finally block
  let session = null;
  
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
    
    // Start a MongoDB session and transaction
    session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Insert all new orders in one go within the transaction
      const insertedDocs = await Order.insertMany(
        formattedOrders,
        { session }
      );
      
      console.log(`Inserted ${insertedDocs.length} new orders for integration ${integrationId}`);
      
      // Commit the transaction if operation succeeded
      await session.commitTransaction();
      console.log(`Transaction committed successfully for integration ${integrationId}`);
      
      return NextResponse.json({
        success: true,
        data: {
          results: {
            insertedCount: insertedDocs.length
          },
          totalProcessed: orders.length
        }
      });
    } catch (transactionError) {
      // If any operation fails, abort the transaction to roll back all changes
      await session.abortTransaction();
      console.error(`Transaction aborted for integration ${integrationId}:`, transactionError);
      throw transactionError; // Re-throw to be caught by outer catch block
    }
  } catch (error: any) {
    console.error('Error storing orders:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to store orders' },
      { status: 500 }
    );
  } finally {
    // Always end the session, even if there was an error
    if (session) {
      session.endSession();
    }
  }
} 