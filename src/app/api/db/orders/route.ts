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
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '100', 10);
    const search = searchParams.get('search') || '';
    
    if (!integrationId) {
      return NextResponse.json(
        { success: false, error: 'Integration ID is required' },
        { status: 400 }
      );
    }
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(integrationId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid integration ID format' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Create base query
    const query: any = { integrationId };
    
    // Add search conditions if search parameter is provided
    if (search) {
      // You can customize the search fields as needed
      query.$or = [
        { 'details.name': { $regex: search, $options: 'i' } },
        { 'details.code': { $regex: search, $options: 'i' } }
      ];
    }
    
    // Get total count for pagination
    const totalCount = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalCount / pageSize);
    
    // Validate page parameter
    if (page < 1 || (totalCount > 0 && page > totalPages)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid page number. Valid range is 1-${totalPages || 1}` 
        },
        { status: 400 }
      );
    }
    
    // Fetch orders with pagination
    const orders = await Order.find(query)
      .sort({ created: -1 }) // Sort by created date descending (newest first)
      .skip((page - 1) * pageSize)
      .limit(pageSize);
    
    return NextResponse.json({
      success: true,
      data: {
        orders,
        totalCount,
        totalPages,
        currentPage: page,
        pageSize
      }
    });
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint to store orders
 * Required body: integrationId, orders
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
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(integrationId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid integration ID format' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Prepare bulk operations for all orders (without batching)
    const bulkOps = orders
      .filter(order => order.id !== undefined && order.id !== null)  // ensure valid id
      .map(order => {
        const { id, ...orderData } = order;
        const orderWithIntegrationId = {
          ...orderData,
          integrationId,
          emagOrderId: id
        };
        return {
          updateOne: {
            filter: { emagOrderId: id, integrationId },
            update: { $set: orderWithIntegrationId },
            upsert: true
          }
        };
      });
      
    // Execute bulkWrite for all orders in one go
    const result = await Order.bulkWrite(bulkOps);
    
    // console.log('BulkWrite result for orders:', result);
    
    return NextResponse.json({
      success: true,
      data: {
        results: result,
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