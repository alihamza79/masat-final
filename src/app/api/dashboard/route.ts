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

// Define Expense schema to fetch COGS data
const ExpenseSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  type: { type: String, enum: ['one-time', 'monthly', 'annually', 'cogs'], required: true },
  description: { type: String },
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  isRecurring: { type: Boolean, default: false },
  product: {
    emagProductOfferId: String,
    name: String,
    part_number: String,
    part_number_key: String,
    image: String,
    unitsCount: Number,
    costPerUnit: Number
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
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
                { $ifNull: ["$shipping_tax", 0] }
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

    // Query real COGS data from expenses
    const Expense = mongoose.models.Expense || mongoose.model('Expense', ExpenseSchema);
    
    // Build expense date filter based on the same parameters as orders
    let expenseDateFilter = {};
    if (startDate && endDate) {
      try {
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        
        // Set end date to end of day for inclusive comparison
        endDateObj.setHours(23, 59, 59, 999);
        
        expenseDateFilter = {
          date: {
            $gte: startDateObj,
            $lte: endDateObj
          }
        };
        
        console.log(`Applying date filter to expenses: ${startDate} to ${endDate}`);
      } catch (error) {
        console.error('Error creating expense date filter:', error);
      }
    }
    
    // Query COGS expenses with proper ObjectId to string conversion
    const cogsExpensesWithUser = await Expense.aggregate([
      {
        $match: {
          $expr: { $eq: [{ $toString: "$userId" }, session.user.id.toString()] },
          type: 'cogs',
          ...(Object.keys(expenseDateFilter).length > 0 ? expenseDateFilter : {})
        }
      },
      {
        $group: {
          _id: null,
          totalCogs: { $sum: '$amount' }
        }
      }
    ]);
    
    // Calculate real COGS value for this user
    let realCogs = cogsExpensesWithUser.length > 0 ? Math.round(cogsExpensesWithUser[0].totalCogs) : 0;
    console.log(`COGS for user ${session.user.id} in period: ${realCogs} RON`);
    
    // Query all other non-COGS expenses for this period
    console.log(`========== EXPENSE CALCULATION DEBUG ==========`);
    console.log(`Date range: ${startDate || 'all'} to ${endDate || 'all'}`);
    
    // First get a list of all expenses to verify we're finding them correctly
    const allExpenses = await Expense.find({ 
      userId: session.user.id
    }).sort({ date: -1 });
    
    console.log(`Total expenses found for user (all types): ${allExpenses.length}`);
    console.log(`Expense breakdown by type:`);
    const expenseTypes: Record<string, number> = {};
    allExpenses.forEach(exp => {
      const expType = exp.type || 'unknown';
      expenseTypes[expType] = (expenseTypes[expType] || 0) + 1;
    });
    console.log(expenseTypes);
    
    // Now log each expense with its type and date for debugging
    console.log(`All expenses for user (latest 10):`);
    allExpenses.slice(0, 10).forEach((exp, i) => {
      console.log(`Expense ${i+1}: type=${exp.type}, amount=${exp.amount}, date=${exp.date.toISOString().split('T')[0]}`);
    });
    
    // Debug the date filter
    if (Object.keys(expenseDateFilter).length > 0) {
      console.log(`Date filter being applied:`, JSON.stringify(expenseDateFilter));
    } else {
      console.log(`No date filter being applied - querying all expenses`);
    }
    
    const otherExpensesWithUser = await Expense.aggregate([
      {
        $match: {
          $expr: { $eq: [{ $toString: "$userId" }, session.user.id.toString()] },
          type: { $ne: 'cogs' }, // All expense types except COGS
          ...(Object.keys(expenseDateFilter).length > 0 ? expenseDateFilter : {})
        }
      },
      {
        $group: {
          _id: null,
          totalOtherExpenses: { $sum: '$amount' }
        }
      }
    ]);
    
    // Get the total of other expenses
    const realOtherExpenses = otherExpensesWithUser.length > 0 ? Math.round(otherExpensesWithUser[0].totalOtherExpenses) : 0;
    console.log(`Other expenses for user ${session.user.id} in period: ${realOtherExpenses} RON`);
    
    // Try with a direct find query to double-check
    const otherExpensesDirect = await Expense.find({
      userId: session.user.id,
      type: { $ne: 'cogs' },
      ...(Object.keys(expenseDateFilter).length > 0 ? expenseDateFilter : {})
    });
    
    const directTotal = otherExpensesDirect.reduce((sum, exp) => sum + exp.amount, 0);
    console.log(`Other expenses (direct query) total: ${directTotal} RON`);
    console.log(`Other expenses found (direct query): ${otherExpensesDirect.length}`);
    
    // Log each other expense found with the direct query
    if (otherExpensesDirect.length > 0) {
      console.log(`Other expenses details (direct query):`);
      otherExpensesDirect.forEach((exp, i) => {
        console.log(`Expense ${i+1}: type=${exp.type}, amount=${exp.amount}, date=${exp.date.toISOString().split('T')[0]}`);
      });
    }
    
    // Get mock data for everything else
    const mockData = getMockDashboardData();
    
    // Calculate shipping revenue
    const shippingRevenue = orderStats.length > 0 ? Math.round(orderStats[0].shippingRevenue || 0) : 0;
    
    // Override only the four required metrics with real data
    const stats = orderStats.length > 0 ? {
      totalOrders: Math.round(orderStats[0].totalOrders || 0),
      grossRevenue: Math.round(orderStats[0].grossRevenue || 0),
      shippingRevenue: shippingRevenue,
      refundedOrders: Math.round(orderStats[0].refundedOrders || 0)
    } : {
      totalOrders: 0,
      grossRevenue: 0,
      shippingRevenue: 0,
      refundedOrders: 0
    };
    
    // Calculate actual profit using the formula:
    // Profit = Gross revenue - COGS - All other expenses - Shipping price - 15 (static value)
    const grossRevenue = stats.grossRevenue;
    const profit = grossRevenue - realCogs - realOtherExpenses - shippingRevenue - 15;
    
    // We no longer need profit margin percentage since we'll display actual profit value
    console.log(`------- PROFIT CALCULATION -------`);
    console.log(`Gross Revenue: ${grossRevenue} RON`);
    console.log(`COGS: ${realCogs} RON`);
    console.log(`Other Expenses: ${realOtherExpenses} RON`);
    console.log(`Shipping Revenue: ${shippingRevenue} RON`);
    console.log(`Static Value: 15 RON`);
    console.log(`Profit = ${grossRevenue} - ${realCogs} - ${realOtherExpenses} - ${shippingRevenue} - 15 = ${profit} RON`);
    console.log(`========== END DEBUG ==========`);

    // Merge real metrics with mock data
    const dashboardData = {
      ...mockData,
      orderStats: {
        ...mockData.orderStats,
        ...stats,
        costOfGoods: realCogs,
        profitMargin: profit // Use actual profit value in RON instead of percentage
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