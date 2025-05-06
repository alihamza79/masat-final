/**
 * Dashboard Service
 * Client-side service for fetching dashboard data
 */
import axios from 'axios';
import { decryptResponse } from '@/lib/utils/responseEncryption';
import { QueryClient } from '@tanstack/react-query';

// Define a query key for dashboard data
export const DASHBOARD_QUERY_KEY = ['dashboard-data'];

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
    bank: number;
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
    image?: string;
  }>;
  allProducts?: Array<{
    id: string;
    emagProductOfferId?: number | string;
    name: string;
    part_number: string;
    part_number_key: string;
    averagePrice: number;
    sold: number;
    refunded: number;
    grossRevenue: number;
    costOfGoods: number;
    emagCommission: number;
    profitMargin: number;
    profit: number;
    shipping: number;
    image?: string;
  }>;
  chartTotals?: {
    revenue: number;
    profit: number;
    costOfGoods: number;
  };
}

/**
 * Function to invalidate dashboard data queries when expenses change
 * Use this after expense operations to refresh dashboard calculations
 */
export const invalidateDashboardData = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
};

/**
 * Get dashboard data
 * @param startDate Start date in YYYY-MM-DD format
 * @param endDate End date in YYYY-MM-DD format
 * @param integrationIds Optional array of integration IDs to filter by
 */
export async function getDashboardData(
  startDate: string, 
  endDate: string,
  integrationIds?: string[]
): Promise<{
  success: boolean;
  data?: DashboardData;
  error?: string;
}> {
  try {
    // Build query parameters
    const params = new URLSearchParams();
    params.append('startDate', startDate);
    params.append('endDate', endDate);
    
    // Add integration IDs if provided
    if (integrationIds && integrationIds.length > 0) {
      integrationIds.forEach(id => params.append('integrationIds', id));
    }
    
    const response = await axios.get(`/api/dashboard?${params.toString()}`);
    
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
      totalOrders: 0,
      grossRevenue: 0,
      profitMargin: 0,
      costOfGoods: 0,
      refundedOrders: 0,
      shippingRevenue: 0
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
  };
}

export default {
  getDashboardData,
  getMockDashboardData,
  invalidateDashboardData
}; 