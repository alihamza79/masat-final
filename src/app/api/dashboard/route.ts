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
  payment_mode: { type: String },
  products: { type: Array },
  shipping_tax: { type: Number, default: 0 },
  delivery_mode: { type: String },
  cancellation_request: { type: String },
  refunded_amount: { type: String, default: "0" },
  date: { type: String }, // Add top-level date field
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Define Integration schema to fetch user's integrations
const IntegrationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  accountName: { type: String, required: true },
  username: { type: String, required: true },
  password: { type: String, required: true },
  region: { type: String, required: true },
  accountType: { type: String, default: 'Non-FBE' }
});

// Define Expense schema to fetch COGS data
const ExpenseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
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
    const userIntegrations = await Integration.find({ userId: new mongoose.Types.ObjectId(userId) });
    const userIntegrationIds = userIntegrations.map(integration => integration._id);
    
    if (userIntegrationIds.length === 0) {
      console.log('User has no integrations, returning empty data');
      return NextResponse.json({ 
        success: true, 
        data: {
          orderStats: {
            totalOrders: 0,
            grossRevenue: 0,
            shippingRevenue: 0,
            refundedOrders: 0,
            profitMargin: 0,
            costOfGoods: 0
          },
          deliveryMethodStats: {
            home: 0,
            locker: 0
          },
          paymentMethodStats: {
            card: 0,
            cod: 0,
            bank: 0
          },
          salesOverTime: [],
          salesByIntegration: [],
          productStats: [],
          allProducts: []
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
      userId: new mongoose.Types.ObjectId(session.user.id)
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
      userId: new mongoose.Types.ObjectId(session.user.id),
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
    
    // Get sales data over time for the chart
    console.log(`Calculating daily revenue and profit data for chart...`);
    
    // Group orders by date
    const dailyOrderStats = await Order.aggregate([
      { $match: queryFilter },
      {
        $group: {
          _id: { $substr: ["$date", 0, 10] }, // Group by date (YYYY-MM-DD)
          dailyRevenue: {
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
          dailyShippingRevenue: { $sum: { $ifNull: ["$shipping_tax", 0] } },
          ordersCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } } // Sort by date ascending
    ]);
    
    console.log(`Found ${dailyOrderStats.length} days with orders`);
    
    // Group expenses by date
    const dailyExpensesStats = await Expense.aggregate([
      {
        $match: {
          $expr: { $eq: [{ $toString: "$userId" }, session.user.id.toString()] },
          ...(Object.keys(expenseDateFilter).length > 0 ? expenseDateFilter : {})
        }
      },
      {
        $group: {
          _id: { 
            date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            type: "$type"
          },
          totalAmount: { $sum: "$amount" }
        }
      },
      { $sort: { "_id.date": 1 } }
    ]);
    
    console.log(`Found ${dailyExpensesStats.length} days with expenses`);
    
    // Organize expenses by date and type
    const expensesByDate: Record<string, { cogs: number, other: number }> = {};
    
    dailyExpensesStats.forEach(expense => {
      const date = expense._id.date;
      const type = expense._id.type;
      const amount = expense.totalAmount;
      
      if (!expensesByDate[date]) {
        expensesByDate[date] = { cogs: 0, other: 0 };
      }
      
      if (type === 'cogs') {
        expensesByDate[date].cogs += amount;
      } else {
        expensesByDate[date].other += amount;
      }
    });
    
    // Combine order and expense data to calculate daily profit
    const dailySalesData = dailyOrderStats.map(day => {
      const date = day._id;
      const dayExpenses = expensesByDate[date] || { cogs: 0, other: 0 };
      const dailyRevenue = Math.round(day.dailyRevenue || 0);
      const dailyShipping = Math.round(day.dailyShippingRevenue || 0);
      const dailyCogs = Math.round(dayExpenses.cogs || 0);
      const dailyOtherExpenses = Math.round(dayExpenses.other || 0);
      
      // Calculate daily profit using same formula
      // Profit = Revenue - COGS - Other Expenses - Shipping - Daily static cost
      // Static cost of 15 RON is divided by the number of days in the period
      const daysInPeriod = Math.max(1, dailyOrderStats.length);
      const dailyStaticCost = 15 / daysInPeriod;
      
      const dailyProfit = dailyRevenue - dailyCogs - dailyOtherExpenses - dailyShipping - dailyStaticCost;
      
      return {
        date,
        revenue: dailyRevenue,
        profit: Math.round(dailyProfit),
        costOfGoods: dailyCogs,
        ordersCount: day.ordersCount || 0
      };
    });
    
    // Determine appropriate aggregation level based on date range
    let aggregationLevel = 'daily';
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      
      console.log(`Date range spans ${diffDays} days`);
      
      if (diffDays > 365 * 2) {
        aggregationLevel = 'quarterly'; // For periods longer than 2 years
      } else if (diffDays > 90) {
        aggregationLevel = 'monthly'; // For periods longer than 3 months
      } else if (diffDays > 31) {
        aggregationLevel = 'weekly';  // For periods longer than a month
      }
      
      console.log(`Using ${aggregationLevel} aggregation for chart data`);
    }
    
    // Helper function to get week, month or quarter from date string
    const getAggregationKey = (dateStr: string, level: string): string => {
      const date = new Date(dateStr);
      if (level === 'weekly') {
        // Get year and week number
        const oneJan = new Date(date.getFullYear(), 0, 1);
        const weekNum = Math.ceil((((date.getTime() - oneJan.getTime()) / 86400000) + oneJan.getDay() + 1) / 7);
        return `${date.getFullYear()}-W${weekNum}`;
      } else if (level === 'monthly') {
        // Get year and month
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else if (level === 'quarterly') {
        // Use 4-month quarters (0-3, 4-7, 8-11)
        const quarter = Math.floor(date.getMonth() / 4) + 1;
        return `${date.getFullYear()}-Q${quarter}`;
      }
      return dateStr; // For daily, return as is
    };
    
    // Helper function to format aggregation key for display
    const formatAggregationKey = (key: string, level: string): string => {
      if (level === 'weekly') {
        // Format: 2023-W1 -> 2023-W1
        return key;
      } else if (level === 'monthly') {
        // Format: 2023-01 -> 2023-01
        return key;
      } else if (level === 'quarterly') {
        // Format: 2023-Q1 -> 2023-Q1
        return key;
      }
      return key;
    };
    
    // Aggregate the data based on determined level
    let aggregatedData: any[] = [];
    
    if (aggregationLevel === 'daily') {
      // For daily view, use data as is, but ensure proper date formatting
      aggregatedData = dailySalesData.map(item => ({
        ...item,
        date: item.date // Keep date as is for daily view
      }));
    } else {
      // For weekly or monthly, aggregate the values
      const aggregated: Record<string, any> = {};
      
      dailySalesData.forEach(item => {
        const key = getAggregationKey(item.date, aggregationLevel);
        
        if (!aggregated[key]) {
          aggregated[key] = {
            date: formatAggregationKey(key, aggregationLevel),
            revenue: 0,
            profit: 0,
            costOfGoods: 0,
            ordersCount: 0,
            dayCount: 0
          };
        }
        
        aggregated[key].revenue += item.revenue;
        aggregated[key].profit += item.profit;
        aggregated[key].costOfGoods += item.costOfGoods;
        aggregated[key].ordersCount += item.ordersCount;
        aggregated[key].dayCount += 1;
      });
      
      // Convert to array and sort by date
      aggregatedData = Object.values(aggregated).sort((a, b) => {
        return a.date.localeCompare(b.date);
      });
    }
    
    // Handle outliers and smoothing for better visualization
    if (aggregatedData.length > 0) {
      // Calculate stats for outlier detection
      const revenueValues = aggregatedData.map(item => item.revenue);
      const avgRevenue = revenueValues.reduce((sum, val) => sum + val, 0) / revenueValues.length;
      const stdDevRevenue = Math.sqrt(
        revenueValues.reduce((sum, val) => sum + Math.pow(val - avgRevenue, 2), 0) / revenueValues.length
      );
      
      // Cap extreme outliers (beyond 3 standard deviations)
      const revenueUpperLimit = avgRevenue + (3 * stdDevRevenue);
      
      console.log(`Revenue stats - Avg: ${avgRevenue}, StdDev: ${stdDevRevenue}, UpperLimit: ${revenueUpperLimit}`);
      
      // Apply caps to extreme outliers while maintaining proportions
      aggregatedData = aggregatedData.map(item => {
        if (item.revenue > revenueUpperLimit) {
          console.log(`Capping outlier: ${item.date} revenue ${item.revenue} -> ${revenueUpperLimit}`);
          const ratio = item.revenue ? revenueUpperLimit / item.revenue : 1;
          return {
            ...item,
            revenue: Math.round(revenueUpperLimit),
            profit: Math.round(item.profit * ratio),
            costOfGoods: Math.round(item.costOfGoods * ratio)
          };
        }
        return item;
      });
    }
    
    // Final data for the chart
    const salesOverTime = aggregatedData;
    
    console.log(`Generated ${salesOverTime.length} data points for chart using ${aggregationLevel} aggregation`);
    
    // If no data for the period, provide empty array
    if (salesOverTime.length === 0 && startDate && endDate) {
      console.log(`No data found for date range, creating empty entries`);
      
      // Create appropriate entries based on aggregation level
      const start = new Date(startDate);
      const end = new Date(endDate);
      const dateArray = [];
      
      if (aggregationLevel === 'quarterly') {
        // Create quarterly entries for 4-month quarters
        let currentQuarter = new Date(start.getFullYear(), Math.floor(start.getMonth() / 4) * 4, 1);
        while (currentQuarter <= end) {
          const quarter = Math.floor(currentQuarter.getMonth() / 4) + 1;
          const quarterKey = `${currentQuarter.getFullYear()}-Q${quarter}`;
          
          // Log quarterly date creation for debugging
          console.log(`Creating empty quarterly entry: ${quarterKey} for date ${currentQuarter.toISOString().split('T')[0]}`);
          
          dateArray.push({
            date: quarterKey,
            revenue: 0,
            profit: 0,
            costOfGoods: 0
          });
          // Move to next 4-month quarter
          currentQuarter.setMonth(currentQuarter.getMonth() + 4);
        }
      } else if (aggregationLevel === 'monthly') {
        // Create monthly entries
        let currentMonth = new Date(start.getFullYear(), start.getMonth(), 1);
        while (currentMonth <= end) {
          const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
          dateArray.push({
            date: monthKey,
            revenue: 0,
            profit: 0,
            costOfGoods: 0
          });
          currentMonth.setMonth(currentMonth.getMonth() + 1);
        }
      } else if (aggregationLevel === 'weekly') {
        // Create weekly entries (simplified)
        let currentDate = new Date(start);
        while (currentDate <= end) {
          const year = currentDate.getFullYear();
          const oneJan = new Date(year, 0, 1);
          const weekNum = Math.ceil((((currentDate.getTime() - oneJan.getTime()) / 86400000) + oneJan.getDay() + 1) / 7);
          const weekKey = `${year}-W${weekNum}`;
          
          dateArray.push({
            date: weekKey,
            revenue: 0,
            profit: 0,
            costOfGoods: 0
          });
          
          // Move to next week
          currentDate.setDate(currentDate.getDate() + 7);
        }
      } else {
        // Daily entries (as before)
        let currentDate = new Date(start);
        while (currentDate <= end) {
          const dateString = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD
          dateArray.push({
            date: dateString,
            revenue: 0,
            profit: 0,
            costOfGoods: 0
          });
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
      
      console.log(`Created ${dateArray.length} empty entries for ${aggregationLevel} view`);
      salesOverTime.push(...dateArray);
    }

    // Merge real metrics with mock data
    const dashboardData = {
      ...mockData,
      orderStats: {
        ...mockData.orderStats,
        ...stats,
        costOfGoods: realCogs,
        profitMargin: profit // Use actual profit value in RON instead of percentage
      },
      salesOverTime: salesOverTime.map(item => ({
        ...item,
        // Don't distribute COGS - only show on the actual date it occurred
        costOfGoods: typeof item.costOfGoods === 'number' ? item.costOfGoods : 0
      }))
    };
    
    // Calculate exact totals that will be used in the chart summary to match top stats cards
    const chartTotals = {
      revenue: stats.grossRevenue,
      profit: profit,
      costOfGoods: realCogs
    };
    
    // Add chart totals to the response
    dashboardData.chartTotals = chartTotals;

    // Get real data for orders by integration
    try {
      // Perform aggregation to count orders by integration
      const ordersByIntegration = await Order.aggregate([
        { $match: queryFilter },
        {
          $group: {
            _id: "$integrationId",
            ordersCount: { $sum: 1 }
          }
        }
      ]);
      
      console.log(`Found orders for ${ordersByIntegration.length} integrations`);
      
      // Create a map of integration names by ID
      const integrationMap = new Map();
      userIntegrations.forEach(integration => {
        integrationMap.set(integration._id.toString(), integration.accountName);
      });
      
      // Map integration IDs to names and format for the response
      const salesByIntegration = ordersByIntegration.map(item => {
        const integrationId = item._id.toString();
        return {
          integrationName: integrationMap.get(integrationId) || `Integration ${integrationId.substr(0, 6)}`,
          ordersCount: item.ordersCount
        };
      });
      
      // Sort by orders count descending
      salesByIntegration.sort((a, b) => b.ordersCount - a.ordersCount);
      
      console.log(`Mapped ${salesByIntegration.length} integrations with their account names`);
      
      // Add to dashboard data
      dashboardData.salesByIntegration = salesByIntegration;
    } catch (error) {
      console.error('Error getting orders by integration:', error);
      // Keep using mock data for this section if there's an error
    }

    // Get real data for delivery methods
    try {
      const deliveryMethodStats = await Order.aggregate([
        { $match: queryFilter },
        {
          $group: {
            _id: "$delivery_mode",
            count: { $sum: 1 }
          }
        }
      ]);
      
      console.log(`Found delivery methods:`, deliveryMethodStats);
      
      // Map delivery_mode values to expected frontend values
      // pickup -> locker, courier -> home
      let homeCount = 0;
      let lockerCount = 0;
      
      deliveryMethodStats.forEach(stat => {
        if (stat._id === "courier") {
          homeCount = stat.count;
        } else if (stat._id === "pickup") {
          lockerCount = stat.count;
        }
      });
      
      console.log(`Delivery methods mapped: home=${homeCount}, locker=${lockerCount}`);
      
      // Add to dashboard data - only if we found real data
      if (deliveryMethodStats.length > 0) {
        dashboardData.deliveryMethodStats = {
          home: homeCount,
          locker: lockerCount
        };
      } else {
        // Set to empty values instead of mock data
        dashboardData.deliveryMethodStats = {
          home: 0,
          locker: 0
        };
      }
    } catch (error) {
      console.error('Error getting delivery method stats:', error);
      // Set to empty values instead of using mock data
      dashboardData.deliveryMethodStats = {
        home: 0,
        locker: 0
      };
    }

    // Get real data for payment methods
    try {
      const paymentMethodStats = await Order.aggregate([
        { $match: queryFilter },
        {
          $group: {
            _id: "$payment_mode",
            count: { $sum: 1 }
          }
        }
      ]);
      
      console.log(`Found payment methods:`, paymentMethodStats);
      
      // Initialize counters for each payment type
      let cardCount = 0;
      let codCount = 0;
      let bankCount = 0;
      
      // Categorize payment methods based on text values
      paymentMethodStats.forEach(stat => {
        const paymentMode = stat._id ? stat._id.toString().toUpperCase() : '';
        
        if (paymentMode.includes('CARD') || paymentMode === '1') {
          // CARD online or payment_mode_id === 1
          cardCount += stat.count;
        } else if (paymentMode.includes('RAMBURS')) {
          // RAMBURS (Cash on Delivery)
          codCount += stat.count;
        } else if (paymentMode.includes('ORDIN') || paymentMode.includes('PLATA')) {
          // Ordin de Plata (Bank Payment)
          bankCount += stat.count;
        } else if (!paymentMode || paymentMode === 'NULL') {
          // For orders with no payment mode, distribute evenly between card and COD
          // or use some other logic based on your business rules
          codCount += stat.count;
        } else {
          // Other payment methods - consider as COD by default
          codCount += stat.count;
        }
      });
      
      console.log(`Payment methods categorized: card=${cardCount}, cod=${codCount}, bank=${bankCount}`);
      
      // Add to dashboard data - only if we found real data
      if (paymentMethodStats.length > 0) {
        dashboardData.paymentMethodStats = {
          card: cardCount,
          cod: codCount,
          bank: bankCount
        };
      } else {
        // Set to empty values instead of mock data
        dashboardData.paymentMethodStats = {
          card: 0,
          cod: 0,
          bank: 0
        };
      }
    } catch (error) {
      console.error('Error getting payment method stats:', error);
      // Set to empty values instead of using mock data
      dashboardData.paymentMethodStats = {
        card: 0,
        cod: 0,
        bank: 0
      };
    }

    // Get real data for top products by revenue - UPDATED APPROACH
    try {
      console.log('Calculating product performance data...');
      
      // Define ProductOffer schema to fetch user's product offers
      const ProductOfferSchema = new mongoose.Schema({
        integrationId: { type: mongoose.Schema.Types.ObjectId, required: true },
        emagProductOfferId: { type: Number, required: true },
        name: { type: String, required: true },
        sale_price: { type: Number },
        part_number: { type: String },
        part_number_key: { type: String },
        images: { type: Array },
        commission: { type: Number }, // Add commission field
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
      });
      
      // Create or retrieve the ProductOffer model
      const ProductOffer = mongoose.models.ProductOffer || mongoose.model('ProductOffer', ProductOfferSchema);
      
      // 1. First fetch all product offers for the user's integrations
      const userProductOffers = await ProductOffer.find({
        integrationId: { $in: userIntegrationIds }
      }).select('_id emagProductOfferId name sale_price part_number part_number_key images commission');
      
      console.log(`Found ${userProductOffers.length} product offers for user's integrations`);
      
      // Extract product IDs for orders lookup
      const productIds = userProductOffers.map(product => ({
        emagProductOfferId: product.emagProductOfferId,
        part_number_key: product.part_number_key
      }));
      
      console.log(`Extracting data for ${productIds.length} unique products`);
      
      // Adjust query filter for product filtering
      let orderProductFilter = { ...queryFilter };
      
      // 2. Get order data for these products
      const orderProductStats = await Order.aggregate([
        { $match: orderProductFilter },
        // Unwind products array to work with individual products
        { $unwind: "$products" },
        // Group by product identifiers
        {
          $group: {
            _id: {
              part_number_key: "$products.part_number_key"
            },
            totalSold: { 
              $sum: { 
                $convert: { 
                  input: "$products.quantity", 
                  to: "int",
                  onError: 1,
                  onNull: 1
                } 
              }
            },
            totalRefunded: {
              $sum: {
                $cond: [
                  { $ne: ["$cancellation_request", null] },
                  { 
                    $convert: { 
                      input: "$products.quantity", 
                      to: "int",
                      onError: 0,
                      onNull: 0
                    } 
                  },
                  0
                ]
              }
            },
            totalRevenue: {
              $sum: {
                $multiply: [
                  { $toDouble: { $ifNull: ["$products.sale_price", "0"] } },
                  { 
                    $convert: { 
                      input: "$products.quantity", 
                      to: "int",
                      onError: 1,
                      onNull: 1
                    } 
                  }
                ]
              }
            },
            totalShipping: {
              $sum: { $ifNull: ["$shipping_tax", 0] }
            },
            totalOrders: { $sum: 1 },
            prices: {
              $push: {
                price: { $toDouble: { $ifNull: ["$products.sale_price", "0"] } },
                quantity: { 
                  $convert: { 
                    input: "$products.quantity", 
                    to: "int",
                    onError: 1,
                    onNull: 1
                  } 
                }
              }
            }
          }
        }
      ]);
      
      console.log(`Found order data for ${orderProductStats.length} products`);
      
      // Create a map of product stats by part_number_key for easy lookup
      const productStatsMap = new Map();
      orderProductStats.forEach(stats => {
        productStatsMap.set(stats._id.part_number_key, stats);
      });
      
      // 3. Get COGS data from expenses
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
      
      // Fetch all COGS expenses for this user
      const cogsExpenses = await Expense.find({
        userId: new mongoose.Types.ObjectId(session.user.id),
        type: 'cogs',
        ...(Object.keys(expenseDateFilter).length > 0 ? expenseDateFilter : {})
      });
      
      console.log(`Found ${cogsExpenses.length} COGS expenses for the user in the selected period`);
      
      // Create a map of COG expenses by product identifier
      const cogsExpensesMap = new Map();
      
      cogsExpenses.forEach(expense => {
        if (expense.product && expense.product.emagProductOfferId) {
          // Use emagProductOfferId as the key
          cogsExpensesMap.set(expense.product.emagProductOfferId.toString(), {
            amount: expense.amount,
            unitsCount: expense.product.unitsCount,
            costPerUnit: expense.product.costPerUnit,
            part_number_key: expense.product.part_number_key
          });
          
          // Also map by part_number_key for alternative lookup
          if (expense.product.part_number_key) {
            cogsExpensesMap.set(expense.product.part_number_key, {
              amount: expense.amount,
              unitsCount: expense.product.unitsCount,
              costPerUnit: expense.product.costPerUnit,
              emagProductOfferId: expense.product.emagProductOfferId
            });
          }
        }
      });
      
      console.log(`Mapped ${cogsExpensesMap.size} unique product COG expenses`);
      
      // 4. Process all product offers and merge with order data
      const processedProducts = userProductOffers.map(product => {
        // Find order stats for this product
        const stats = productStatsMap.get(product.part_number_key) || null;
        
        // Default values if no orders
        let soldCount = 0;
        let refundedCount = 0;
        let grossRevenue = 0;
        let shippingCost = 0;
        let averagePrice = product.sale_price || 0;
        
        // If we have order stats, calculate metrics
        if (stats) {
          soldCount = stats.totalSold;
          refundedCount = stats.totalRefunded;
          grossRevenue = Math.round(stats.totalRevenue);
          shippingCost = Math.round(stats.totalShipping);
          
          // Calculate average price from orders if available
          let totalValue = 0;
          let totalQty = 0;
          stats.prices.forEach((p: any) => {
            totalValue += p.price * p.quantity;
            totalQty += p.quantity;
          });
          
          if (totalQty > 0) {
            averagePrice = Math.round((totalValue / totalQty) * 100) / 100;
          }
        }
        
        // Look for actual COG for this product
        let actualCostOfGoods = 0; // Default to 0 instead of null
        
        // Try to find by emagProductOfferId first
        const productOfferId = product.emagProductOfferId.toString();
        if (cogsExpensesMap.has(productOfferId)) {
          actualCostOfGoods = cogsExpensesMap.get(productOfferId).amount;
        } 
        // If not found, try part_number_key
        else if (product.part_number_key && cogsExpensesMap.has(product.part_number_key)) {
          actualCostOfGoods = cogsExpensesMap.get(product.part_number_key).amount;
        }
        
        // Calculate profit: revenue - cog (no shipping)
        const profit = grossRevenue - actualCostOfGoods;
        
        // Get commission value - either from stored value or estimate
        let commissionValue: number;
        
        if (product.commission !== undefined && product.commission !== null) {
          // Use stored commission percentage and calculate the amount
          commissionValue = Math.round((product.commission / 100) * grossRevenue);
        } else {
          // Use fallback 8% estimate if no stored value
          commissionValue = Math.round(grossRevenue * 0.08);
        }
        
        // Fixed profit margin for demo purposes
        const fixedProfitMargin = 32.0;
        
        // Get image from product
        let imageUrl = '';
        if (product.images && product.images.length > 0) {
          const mainImage = product.images.find((img: any) => img.display_type === 1) || product.images[0];
          if (mainImage && mainImage.url) {
            imageUrl = mainImage.url;
          }
        }
        
        return {
          id: product._id.toString(),
          emagProductOfferId: product.emagProductOfferId,
          name: product.name,
          part_number: product.part_number || '',
          part_number_key: product.part_number_key || '',
          averagePrice: averagePrice,
          sold: soldCount,
          refunded: refundedCount,
          grossRevenue: grossRevenue,
          costOfGoods: actualCostOfGoods,
          emagCommission: commissionValue,
          profitMargin: fixedProfitMargin,
          profit: profit,
          shipping: shippingCost,
          image: imageUrl || 'https://marketplace-static.emag.ro/resources/000/028/686/967/28686967.png'
        };
      });
      
      console.log(`Processed ${processedProducts.length} total products`);
      
      // Sort by revenue (descending) for display
      processedProducts.sort((a, b) => b.grossRevenue - a.grossRevenue);
      
      // Use the full processed products list for the products table
      dashboardData.allProducts = processedProducts;
      
      // Take top 5 products by revenue for the chart
      const top5Products = processedProducts.slice(0, 5);
      console.log('Top 5 products by revenue:', top5Products);
      
      // Add to dashboard data
      dashboardData.productStats = top5Products;
    } catch (error) {
      console.error('Error calculating product performance data:', error);
      // Return empty array instead of mock data
      dashboardData.allProducts = [];
      dashboardData.productStats = [];
    }

    // If we don't have product data yet, add an empty array
    if (!dashboardData.allProducts) {
      dashboardData.allProducts = [];
    }
    if (!dashboardData.productStats) {
      dashboardData.productStats = [];
    }

    return NextResponse.json({ 
      success: true, 
      data: dashboardData
    });
  } catch (error: any) {
    console.error('Error fetching dashboard data:', error);
    
    // Return empty data on error
    return NextResponse.json({ 
      success: true, 
      data: {
        orderStats: {
          totalOrders: 0,
          grossRevenue: 0,
          shippingRevenue: 0,
          refundedOrders: 0,
          profitMargin: 0,
          costOfGoods: 0
        },
        deliveryMethodStats: {
          home: 0,
          locker: 0
        },
        paymentMethodStats: {
          card: 0,
          cod: 0,
          bank: 0
        },
        salesOverTime: [],
        salesByIntegration: [],
        productStats: [],
        allProducts: []
      }
    });
  }
} 