import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db/mongodb';
import { getMockDashboardData } from '@/lib/services/dashboardService';

// Define Order schema here to avoid importing the model
const OrderSchema = new mongoose.Schema({
  integrationId: { type: mongoose.Schema.Types.ObjectId, required: true },
  emagOrderId: { type: String, required: true },
  status: { type: Number },
  payment_mode_id: { type: Number },
  products: { type: Array },
  customer: {
    date: { type: String },
    delivery_mode: { type: String },
    payment_mode: { type: String }
  },
  shipping_tax: { type: Number, default: 0 },
  cancellation_request: { type: String },
  refunded_amount: { type: String, default: "0" },
  date: { type: String }, // Add top-level date field
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const url = new URL(req.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    
    // Connect to database
    await connectToDatabase();
    
    // Define Order model
    const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);
    
    // Build the query for the date range
    let dateFilter: any = {};
    if (startDate && endDate) {
      try {
        // Format dates for string comparison
        const formattedStartDate = new Date(startDate).toISOString().split('T')[0];
        const formattedEndDate = new Date(endDate).toISOString().split('T')[0];
        
        console.log('Filtering by date range:', formattedStartDate, 'to', formattedEndDate);
        
        // Get a sample order to examine date format
        const sampleOrder = await Order.findOne();
        console.log('Sample order date format:', sampleOrder?.date);
        
        // Simple string comparison for date format YYYY-MM-DD HH:MM:SS
        dateFilter = {
          "date": {
            $gte: formattedStartDate + ' 00:00:00', 
            $lte: formattedEndDate + ' 23:59:59'
          }
        };
        
        console.log('Using date filter:', JSON.stringify(dateFilter));
      } catch (error) {
        console.error('Error creating date filter:', error);
      }
    }

    // Get real order stats - only query for the four required metrics
    let orderStats = await Order.aggregate([
      // Apply date filter if any
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          grossRevenue: {
            $sum: {
              $add: [
                // Product price × quantity
                {
                  $cond: [
                    { $isArray: "$products" },
                    {
                      $reduce: {
                        input: "$products",
                        initialValue: 0,
                        in: {
                          $add: [
                            "$$value",
                            {
                              $multiply: [
                                { $toDouble: { $ifNull: ["$$this.sale_price", "0"] } },
                                { $ifNull: ["$$this.quantity", 1] }
                              ]
                            }
                          ]
                        }
                      }
                    },
                    0
                  ]
                },
                // Include shipping tax
                { $ifNull: ["$shipping_tax", 0] },
                // Include VAT from products
                {
                  $cond: [
                    { $isArray: "$products" },
                    {
                      $reduce: {
                        input: "$products",
                        initialValue: 0,
                        in: {
                          $add: [
                            "$$value",
                            {
                              $multiply: [
                                { $toDouble: { $ifNull: ["$$this.sale_price", "0"] } },
                                { $toDouble: { $ifNull: ["$$this.vat", "0"] } },
                                { $ifNull: ["$$this.quantity", 1] }
                              ]
                            }
                          ]
                        }
                      }
                    },
                    0
                  ]
                }
              ]
            }
          },
          shippingRevenue: { $sum: { $ifNull: ["$shipping_tax", 0] } },
          refundedOrders: {
            $sum: { $cond: [{ $ne: ["$cancellation_request", null] }, 1, 0] }
          }
        }
      }
    ]);

    // Log the result count to verify filtering is working
    console.log(`Found ${orderStats.length ? orderStats[0].totalOrders || 0 : 0} orders for the selected period`);

    // If no results with date filter, return zero values instead of fetching all orders
    if (orderStats.length === 0) {
      console.log('No orders found in date range, returning zero values');
      orderStats = [];
    }

    // Get mock data for everything else
    const mockData = getMockDashboardData();
    
    // Override only the four required metrics with real data
    const stats = orderStats.length > 0 ? {
      totalOrders: Math.round(orderStats[0].totalOrders || 0),
      grossRevenue: Math.round(orderStats[0].grossRevenue || 0),
      shippingRevenue: Math.round(orderStats[0].shippingRevenue || 0),
      refundedOrders: Math.round(orderStats[0].refundedOrders || 0)
    } : {
      totalOrders: 0,
      grossRevenue: 0,
      shippingRevenue: 0,
      refundedOrders: 0
    };

    // Merge real metrics with mock data
    const dashboardData = {
      ...mockData,
      orderStats: {
        ...mockData.orderStats,
        ...stats
      }
    };

    return NextResponse.json({ 
      success: true, 
      data: dashboardData
    });
  } catch (error: any) {
    console.error('Error fetching dashboard data:', error);
    
    // Return mock data on error
    return NextResponse.json({ 
      success: true, 
      data: getMockDashboardData()
    });
  }
} 