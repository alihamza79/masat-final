import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db/mongodb';
import { getMockDashboardData } from '@/lib/services/dashboardService';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';

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

// Define Integration schema to fetch user's integrations
const IntegrationSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  accountName: { type: String, required: true },
  username: { type: String, required: true },
  password: { type: String, required: true },
  region: { type: String, required: true },
  accountType: { type: String, default: 'Non-FBE' }
});

export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const url = new URL(req.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const integrationIds = url.searchParams.getAll('integrationIds');
    
    // Get the user's session
    const session = await getServerSession(authOptions);
    
    // Check if the user is authenticated
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Connect to database
    await connectToDatabase();
    
    // Define Order and Integration models
    const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);
    const Integration = mongoose.models.Integration || mongoose.model('Integration', IntegrationSchema);
    
    // Get user's integrations
    const userIntegrations = await Integration.find({ userId });
    const userIntegrationIds = userIntegrations.map(integration => integration._id);
    
    if (userIntegrationIds.length === 0) {
      console.log('User has no integrations, returning empty data');
      return NextResponse.json({ 
        success: true, 
        data: {
          ...getMockDashboardData(),
          orderStats: {
            totalOrders: 0,
            grossRevenue: 0,
            shippingRevenue: 0,
            refundedOrders: 0,
            profitMargin: 0,
            costOfGoods: 0
          }
        }
      });
    }
    
    // Build the query with filters
    let queryFilter: any = {};
    
    // Add date filter if dates are provided
    if (startDate && endDate) {
      try {
        // Format dates for string comparison
        const formattedStartDate = new Date(startDate).toISOString().split('T')[0];
        const formattedEndDate = new Date(endDate).toISOString().split('T')[0];
        
        console.log('Filtering by date range:', formattedStartDate, 'to', formattedEndDate);
        
        // Simple string comparison for date format YYYY-MM-DD HH:MM:SS
        queryFilter.date = {
          $gte: formattedStartDate + ' 00:00:00', 
          $lte: formattedEndDate + ' 23:59:59'
        };
        
        console.log('Using date filter:', JSON.stringify(queryFilter.date));
      } catch (error) {
        console.error('Error creating date filter:', error);
      }
    }
    
    // Add integration filter
    if (integrationIds && integrationIds.length > 0) {
      // If specific integrations are selected, use those 
      // (but only if they belong to the current user)
      const validIntegrationIds = integrationIds
        .filter(id => mongoose.Types.ObjectId.isValid(id))
        .map(id => new mongoose.Types.ObjectId(id));
        
      // Ensure we only include integration IDs that belong to the user
      const userValidIntegrationIds = userIntegrationIds.filter(id => 
        validIntegrationIds.some(validId => validId.toString() === id.toString())
      );
      
      if (userValidIntegrationIds.length > 0) {
        queryFilter.integrationId = { $in: userValidIntegrationIds };
        console.log(`Filtering by ${userValidIntegrationIds.length} selected integration IDs`);
      } else {
        // If user selected invalid integrations, just show their integrations
        queryFilter.integrationId = { $in: userIntegrationIds };
        console.log(`No valid integrations selected, showing all user integrations (${userIntegrationIds.length})`);
      }
    } else {
      // If no specific integrations are selected, filter by all of the user's integrations
      queryFilter.integrationId = { $in: userIntegrationIds };
      console.log(`No integrations specified, showing all user integrations (${userIntegrationIds.length})`);
    }

    // Get real order stats - only query for the four required metrics
    let orderStats = await Order.aggregate([
      // Apply filters
      { $match: queryFilter },
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

    // If no results with filters, return zero values instead of fetching all orders
    if (orderStats.length === 0) {
      console.log('No orders found matching filters, returning zero values');
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