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
  orderStats: OrderStats;
  productStats: ProductStats[];
  salesByIntegration: SalesByIntegration[];
  deliveryMethodStats: DeliveryMethodStats;
  paymentMethodStats: PaymentMethodStats;
  salesOverTime: SalesOverTime[];
}

export interface OrderStats {
  totalOrders: number;
  grossRevenue: number;
  profitMargin: number;
  costOfGoods: number;
  refundedOrders: number;
  shippingRevenue: number;
  percentChanges: {
    totalOrders: number;
    grossRevenue: number;
    profitMargin: number;
    costOfGoods: number;
    refundedOrders: number;
    shippingRevenue: number;
  };
}

export interface ProductStats {
  id: string;
  name: string;
  averagePrice: number;
  sold: number;
  refunded: number;
  grossRevenue: number;
  costOfGoods: number;
  emagCommission: number;
  profitMargin: number;
}

export interface SalesByIntegration {
  integrationName: string;
  ordersCount: number;
}

export interface DeliveryMethodStats {
  home: number;
  locker: number;
}

export interface PaymentMethodStats {
  card: number;
  cod: number;
}

export interface SalesOverTime {
  date: string;
  revenue: number;
  profit: number;
  costOfGoods: number;
}

/**
 * Fetch dashboard data for a specific time period
 * @param startDate Start date in YYYY-MM-DD format
 * @param endDate End date in YYYY-MM-DD format
 * @returns Promise with dashboard data
 */
export async function getDashboardData(startDate: string, endDate: string): Promise<{
  success: boolean;
  data?: DashboardData;
  error?: string;
}> {
  try {
    const response = await apiClient.get(`/api/dashboard?startDate=${startDate}&endDate=${endDate}`);
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch dashboard data');
    }

    // In a real implementation, we would decrypt the data here
    // const decryptedData = JSON.parse(decryptResponse(response.data.data));
    
    // For now, just return the data as is
    return {
      success: true,
      data: response.data.data
    };
  } catch (error: any) {
    console.error('Error fetching dashboard data:', error);
    
    // For auth errors, return empty data
    if (error.response?.status === 401) {
      return { 
        success: false, 
        error: 'Authentication error. Please log in again.'
      };
    }
    
    // For other errors, return error info
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to fetch dashboard data'
    };
  }
}

/**
 * This is a mock function that returns dummy data for testing
 * It should be removed in production
 */
export function getMockDashboardData(): DashboardData {
  return {
    orderStats: {
      totalOrders: 328,
      grossRevenue: 19452,
      profitMargin: 32.4,
      costOfGoods: 13150,
      refundedOrders: 18,
      shippingRevenue: 2380,
      percentChanges: {
        totalOrders: 12.5,
        grossRevenue: 8.7,
        profitMargin: 2.1,
        costOfGoods: 5.8,
        refundedOrders: -3.2,
        shippingRevenue: 9.6
      }
    },
    productStats: [
      {
        id: '1',
        name: 'Smart LED Light with Motion Sensor',
        averagePrice: 79.98,
        sold: 65,
        refunded: 3,
        grossRevenue: 5198.7,
        costOfGoods: 2080,
        emagCommission: 519.87,
        profitMargin: 49.9
      },
      {
        id: '2',
        name: 'USB Rechargeable Fan',
        averagePrice: 52.99,
        sold: 42,
        refunded: 1,
        grossRevenue: 2225.58,
        costOfGoods: 1176,
        emagCommission: 222.56,
        profitMargin: 37.1
      },
      {
        id: '3',
        name: 'Wireless Phone Charger',
        averagePrice: 89.90,
        sold: 38,
        refunded: 2,
        grossRevenue: 3416.2,
        costOfGoods: 1824,
        emagCommission: 341.62,
        profitMargin: 36.6
      },
      {
        id: '4',
        name: 'Bluetooth Headphones',
        averagePrice: 120.5,
        sold: 25,
        refunded: 0,
        grossRevenue: 3012.5,
        costOfGoods: 1750,
        emagCommission: 301.25,
        profitMargin: 31.9
      },
      {
        id: '5',
        name: 'Smart Watch',
        averagePrice: 199.99,
        sold: 18,
        refunded: 1,
        grossRevenue: 3599.82,
        costOfGoods: 2520,
        emagCommission: 359.98,
        profitMargin: 20.0
      }
    ],
    salesByIntegration: [
      { integrationName: 'eMAG Romania', ordersCount: 156 },
      { integrationName: 'eMAG Bulgaria', ordersCount: 94 },
      { integrationName: 'eMAG Hungary', ordersCount: 78 }
    ],
    deliveryMethodStats: {
      home: 186,
      locker: 142
    },
    paymentMethodStats: {
      card: 197,
      cod: 131
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
    ]
  };
}

export default {
  getDashboardData,
  getMockDashboardData
}; 