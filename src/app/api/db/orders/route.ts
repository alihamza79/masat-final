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

    const orders = await Order.find(query).sort({ date: -1 });

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
    
    // Map orders with ALL explicit fields to ensure MongoDB saves them
    const formattedOrders = orders.map(order => {
      const { id, ...orderData } = order;
      
      // Format all document fields explicitly with defaults
      return {
        integrationId,
        emagOrderId: id,
        
        // Original fields (already in schema)
        status: orderData.status || 0,
        payment_mode_id: orderData.payment_mode_id || 0,
        total_amount: orderData.total_amount || 0,
        created: orderData.created || null,
        date: orderData.date || null,
        customer: orderData.customer || null,
        delivery_mode: orderData.delivery_mode || null,
        payment_mode: orderData.payment_mode || null,
        products: orderData.products || [],
        details: orderData.details || [],
        
        // Additional fields we want to save
        vendor_name: orderData.vendor_name || null,
        type: orderData.type || null,
        parent_id: orderData.parent_id || null,
        modified: orderData.modified || null,
        payment_status: orderData.payment_status || null,
        shipping_tax: orderData.shipping_tax || 0,
        shipping_tax_voucher_split: orderData.shipping_tax_voucher_split || [],
        vouchers: orderData.vouchers || [],
        proforms: orderData.proforms || [],
        attachments: orderData.attachments || [],
        cashed_co: orderData.cashed_co || 0,
        cashed_cod: orderData.cashed_cod || 0,
        cancellation_request: orderData.cancellation_request || null,
        has_editable_products: orderData.has_editable_products || 0,
        refunded_amount: orderData.refunded_amount || "0",
        is_complete: orderData.is_complete || 0,
        reason_cancellation: orderData.reason_cancellation || null,
        refund_status: orderData.refund_status || null,
        maximum_date_for_shipment: orderData.maximum_date_for_shipment || null,
        late_shipment: orderData.late_shipment || 0,
        flags: orderData.flags || [],
        emag_club: orderData.emag_club || 0,
        finalization_date: orderData.finalization_date || null,
        enforced_vendor_courier_accounts: orderData.enforced_vendor_courier_accounts || null,
        weekend_delivery: orderData.weekend_delivery || 0
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