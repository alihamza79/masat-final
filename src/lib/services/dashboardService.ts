/**
 * Dashboard Service
 * Client-side service for fetching dashboard data
 */
import axios from 'axios';
import { decryptResponse } from '@/lib/utils/responseEncryption';

// Create an HTTP client with response interceptor for auth errors
const apiClient = axios.create();

// Add a response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log authentication errors
    if (error.response && error.response.status === 401) {
      console.error('Authentication error:', error.response.data);
    }
    return Promise.reject(error);
  }
);

// Types for dashboard data
export interface DashboardData {
  orderStats: {
    totalOrders: number;
    grossRevenue: number;
    shippingRevenue: number;
    refundedOrders: number;
    profitMargin: number;
    costOfGoods: number;
  };
  deliveryMethodStats: {
    home: number;
    locker: number;
  };
  paymentMethodStats: {
    card: number;
    cod: number;
  };
  salesOverTime: Array<{
    date: string;
    revenue: number;
    profit: number;
    costOfGoods: number;
  }>;
  salesByIntegration: Array<{
    integrationName: string;
    ordersCount: number;
  }>;
  productStats: Array<{
    id: string;
    name: string;
    averagePrice: number;
    sold: number;
    refunded: number;
    grossRevenue: number;
    costOfGoods: number;
    emagCommission: number;
    profitMargin: number;
  }>;
}

/**
 * Get dashboard data
 * @param startDate Start date in YYYY-MM-DD format
 * @param endDate End date in YYYY-MM-DD format
 */
export async function getDashboardData(startDate: string, endDate: string): Promise<{
  success: boolean;
  data?: DashboardData;
  error?: string;
}> {
  try {
    const response = await axios.get(`/api/dashboard?startDate=${startDate}&endDate=${endDate}`);
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch dashboard data');
    }
    
    return {
      success: true,
      data: response.data.data
    };
  } catch (error: any) {
    console.error('Error fetching dashboard data:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching dashboard data'
    };
  }
}

/**
 * Get mock dashboard data for development and testing
 */
export function getMockDashboardData(): DashboardData {
  return {
    orderStats: {
      totalOrders: 83,
      grossRevenue: 23680,
      profitMargin: 15.2,
      costOfGoods: 16520,
      refundedOrders: 7,
      shippingRevenue: 1640
    },
    deliveryMethodStats: {
      home: 34,
      locker: 12
    },
    paymentMethodStats: {
      card: 28,
      cod: 18
    },
    salesOverTime: [
      { date: '2023-01-01', revenue: 12500, profit: 3750, costOfGoods: 7500 },
      { date: '2023-01-02', revenue: 11000, profit: 3300, costOfGoods: 6600 },
      { date: '2023-01-03', revenue: 15000, profit: 4500, costOfGoods: 9000 },
      { date: '2023-01-04', revenue: 16800, profit: 5040, costOfGoods: 10080 },
      { date: '2023-01-05', revenue: 14200, profit: 4260, costOfGoods: 8520 },
      { date: '2023-01-06', revenue: 19500, profit: 5850, costOfGoods: 11700 },
      { date: '2023-01-07', revenue: 21000, profit: 6300, costOfGoods: 12600 },
      { date: '2023-01-08', revenue: 18200, profit: 5460, costOfGoods: 10920 },
      { date: '2023-01-09', revenue: 17900, profit: 5370, costOfGoods: 10740 },
      { date: '2023-01-10', revenue: 22500, profit: 6750, costOfGoods: 13500 }
    ],
    salesByIntegration: [
      { integrationName: 'eMAG Romania', ordersCount: 156 },
      { integrationName: 'eMAG Bulgaria', ordersCount: 94 },
      { integrationName: 'eMAG Hungary', ordersCount: 78 }
    ],
    productStats: [
      {
        id: 'PROD-1',
        name: 'Baby Carrier Ergonomic',
        averagePrice: 320,
        sold: 14,
        refunded: 1,
        grossRevenue: 4480,
        costOfGoods: 2800,
        emagCommission: 358,
        profitMargin: 29.5
      },
      {
        id: 'PROD-2',
        name: 'Baby Monitor Smart',
        averagePrice: 450,
        sold: 10,
        refunded: 0,
        grossRevenue: 4500,
        costOfGoods: 2700,
        emagCommission: 360,
        profitMargin: 32.0
      },
      {
        id: 'PROD-3',
        name: 'Silicon Feeding Set',
        averagePrice: 89,
        sold: 28,
        refunded: 2,
        grossRevenue: 2492,
        costOfGoods: 1400,
        emagCommission: 199,
        profitMargin: 35.8
      },
      {
        id: 'PROD-4',
        name: 'Baby Crib Premium',
        averagePrice: 780,
        sold: 6,
        refunded: 1,
        grossRevenue: 4680,
        costOfGoods: 3000,
        emagCommission: 374,
        profitMargin: 28.0
      },
      {
        id: 'PROD-5',
        name: 'Stroller Compact Foldable',
        averagePrice: 520,
        sold: 8,
        refunded: 1,
        grossRevenue: 4160,
        costOfGoods: 2800,
        emagCommission: 333,
        profitMargin: 24.7
      }
    ]
  };
}

export default {
  getDashboardData,
  getMockDashboardData
}; 