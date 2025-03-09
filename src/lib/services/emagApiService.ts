/**
 * eMAG API Service
 * Handles communication with the eMAG Marketplace API
 */

import axios, { AxiosInstance } from 'axios';

export interface EmagApiConfig {
  username: string;
  password: string;
  region: string;
}

export interface EmagOrder {
  id: number;
  status: number;
  payment_mode_id: number;
  total_amount: number;
  created: string;
  details: any[];
  integrationId?: string; // Added to track which integration this order belongs to
}

export interface EmagOrdersResponse {
  isError: boolean;
  messages: string[];
  results: EmagOrder[];
  currentPage: number;
  totalPages: number;
  totalResults: number;
}

export interface EmagProductOffer {
  id: number;
  status: number;
  sale_price: number;
  recommended_price: number;
  general_stock: number;
  estimated_stock: number;
  characteristics: Array<{ id: number; value: string }>;
  warranty: number;
  integrationId?: string; // Added to track which integration this offer belongs to
}

export interface EmagProductOffersResponse {
  isError: boolean;
  messages: string[];
  results: EmagProductOffer[];
  currentPage: number;
  totalPages: number;
  totalResults: number;
}

export class EmagApiService {
  private authHeader: string;
  private baseURL: string;
  private axiosInstance: AxiosInstance;

  constructor({ username, password, region }: EmagApiConfig) {
    // Create Basic Auth header
    this.authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
    
    // Set base URL based on region
    switch (region) {
      case 'Romania':
        this.baseURL = 'https://marketplace-api.emag.ro/api-3';
        break;
      case 'Bulgaria':
        this.baseURL = 'https://marketplace-api.emag.bg/api-3';
        break;
      case 'Hungary':
        this.baseURL = 'https://marketplace-api.emag.hu/api-3';
        break;
      default:
        throw new Error(`Invalid region specified: ${region}`);
    }

    // Create axios instance with auth header
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': this.authHeader,
        'Content-Type': 'application/json',
      }
    });
  }

  /**
   * Get the count of orders from eMAG API
   * @param params Optional parameters to filter orders by date range
   * @returns Promise with the order count results object
   */
  async getOrderCount(params?: {
    createdBefore?: string;
    createdAfter?: string;
  }): Promise<{ noOfItems: string; noOfPages: string; itemsPerPage: string } | null> {
    try {
      // Use provided parameters or empty object for all orders
      const requestParams = params || {};
      
      const response = await this.axiosInstance.post('/order/count', requestParams);
      
      // Check if the response indicates an error
      if (response.data.isError) {
        console.error('eMAG API error:', response.data.messages);
        throw new Error(response.data.messages?.[0] || 'Unknown eMAG API error');
      }
      
      // The response format is:
      // { isError: false, messages: [], errors: [], results: { noOfItems: '797', noOfPages: '8', itemsPerPage: '100' } }
      if (response.data.results) {
        return response.data.results;
      }
      
      // If we can't find the results in the expected format, return null
      return null;
    } catch (error: any) {
      // Handle eMAG API specific error format
      if (error.response?.data?.isError) {
        const errorMessage = error.response.data.messages?.[0];
        if (errorMessage === 'You are not allowed to use this API.') {
          throw new Error('Invalid eMAG Account credentials');
        }
        if (errorMessage?.includes('Invalid vendor ip')) {
          throw new Error('Invalid vendor IP. Please whitelist your IP address in eMAG Marketplace settings.');
        }
        throw new Error(errorMessage || 'Unknown eMAG API error');
      }
      
      // Rethrow the error to be caught by the caller
      throw error;
    }
  }

  /**
   * Fetch orders from eMAG API
   * @param params Optional parameters for pagination
   * @returns Promise with the orders response
   */
  async getOrders(params: {
    currentPage?: number;
    itemsPerPage?: number;
  } = {}): Promise<EmagOrdersResponse> {
    try {
      // Set default parameters if not provided
      const requestParams = {
        currentPage: params.currentPage || 1,
        itemsPerPage: params.itemsPerPage || 100, // Maximum allowed by the API is 100
      };
      
      const response = await this.axiosInstance.post('/order/read', requestParams);
      
      return response.data;
    } catch (error: any) {
      // Handle eMAG API specific error format
      if (error.response?.data?.isError) {
        return {
          isError: true,
          messages: error.response.data.messages || ['Unknown eMAG API error'],
          results: [],
          currentPage: 1,
          totalPages: 1,
          totalResults: 0
        };
      }
      
      // Handle other types of errors
      return {
        isError: true,
        messages: [error.response?.data?.message || error.message || 'Failed to fetch orders'],
        results: [],
        currentPage: 1,
        totalPages: 1,
        totalResults: 0
      };
    }
  }

  /**
   * Fetch product offers from eMAG API
   * @param params Optional parameters for pagination
   * @returns Promise with the product offers response
   */
  async getProductOffers(params: {
    currentPage?: number;
    itemsPerPage?: number;
  } = {}): Promise<EmagProductOffersResponse> {
    try {
      // Set default parameters if not provided
      const requestParams = {
        currentPage: params.currentPage || 1,
        itemsPerPage: params.itemsPerPage || 100, // Maximum allowed by the API is 100
      };
      
      const response = await this.axiosInstance.post('/product_offer/read', requestParams);
      
      return response.data;
    } catch (error: any) {
      // Handle eMAG API specific error format
      if (error.response?.data?.isError) {
        return {
          isError: true,
          messages: error.response.data.messages || ['Unknown eMAG API error'],
          results: [],
          currentPage: 1,
          totalPages: 1,
          totalResults: 0
        };
      }
      
      // Handle other types of errors
      return {
        isError: true,
        messages: [error.response?.data?.message || error.message || 'Failed to fetch product offers'],
        results: [],
        currentPage: 1,
        totalPages: 1,
        totalResults: 0
      };
    }
  }

  /**
   * Get the count of product offers from eMAG API
   * @returns Promise with the product offers count results object
   */
  async getProductOffersCount(): Promise<{ noOfItems: string; noOfPages: string; itemsPerPage: string } | null> {
    try {
      // Use the product_offer/count endpoint to get the count
      const response = await this.axiosInstance.post('/product_offer/count');
      
      
      // Check if the response indicates an error
      if (response.data.isError) {
        console.error('eMAG API error:', response.data.messages);
        throw new Error(response.data.messages?.[0] || 'Unknown eMAG API error');
      }
      
      // The response format is:
      // { isError: false, messages: [], errors: [], results: { noOfItems: '38', noOfPages: '1', itemsPerPage: '100' } }
      if (response.data.results) {
        return response.data.results;
      }
      
      // If we can't find the results in the expected format, return null
      return null;
    } catch (error: any) {
      // Handle eMAG API specific error format
      if (error.response?.data?.isError) {
        const errorMessage = error.response.data.messages?.[0];
        if (errorMessage === 'You are not allowed to use this API.') {
          throw new Error('Invalid eMAG Account credentials');
        }
        if (errorMessage?.includes('Invalid vendor ip')) {
          throw new Error('Invalid vendor IP. Please whitelist your IP address in eMAG Marketplace settings.');
        }
        throw new Error(errorMessage || 'Unknown eMAG API error');
      }
      
      // Rethrow the error to be caught by the caller
      throw error;
    }
  }

  /**
   * Validate credentials by attempting to get order count
   * @returns Promise with validation result
   */
  async validateCredentials(): Promise<{ valid: boolean; orderCount?: number; error?: string }> {
    try {
      // Get yesterday's date for validation
      const yesterday = this.getYesterdayDateString().split(' ')[0]; // Get just the date part (YYYY-MM-DD)
      
      // For a specific day (yesterday), we need to set:
      // createdAfter = day before yesterday (YYYY-MM-DD)
      // createdBefore = day after yesterday (YYYY-MM-DD)
      
      // Create date objects for calculations
      const yesterdayDate = new Date(yesterday);
      
      // Day before yesterday
      const dayBeforeYesterday = new Date(yesterdayDate);
      dayBeforeYesterday.setDate(yesterdayDate.getDate() - 1);
      const dayBeforeYesterdayStr = dayBeforeYesterday.toISOString().split('T')[0];
      
      // Day after yesterday (today)
      const dayAfterYesterday = new Date(yesterdayDate);
      dayAfterYesterday.setDate(yesterdayDate.getDate() + 1);
      const dayAfterYesterdayStr = dayAfterYesterday.toISOString().split('T')[0];
      
      try {
        // Pass date range to getOrderCount
        const orderCountResults = await this.getOrderCount({
          createdAfter: dayBeforeYesterdayStr,
          createdBefore: dayAfterYesterdayStr
        });
        
        // Extract the count from the results object
        const orderCount = orderCountResults && orderCountResults.noOfItems 
          ? parseInt(orderCountResults.noOfItems, 10) 
          : 0;
        
        return { valid: true, orderCount };
      } catch (apiError: any) {
        // If there's an error from the API, return invalid with the error message
        return { valid: false, error: apiError.message || 'Failed to validate credentials with eMAG API' };
      }
    } catch (error: any) {
      // Handle eMAG API specific error format
      if (error.response?.data?.isError) {
        const errorMessage = error.response.data.messages?.[0];
        if (errorMessage === 'You are not allowed to use this API.') {
          return { valid: false, error: 'Invalid eMAG Account credentials' };
        }
        return { valid: false, error: errorMessage || 'Unknown eMAG API error' };
      }
      
      // Handle other types of errors
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      return { valid: false, error: errorMessage };
    }
  }

  /**
   * Get yesterday's date in the format required by eMAG API
   * @returns Date string in format YYYY-MM-DD 00:00:00
   */
  private getYesterdayDateString(): string {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const year = yesterday.getFullYear();
    const month = String(yesterday.getMonth() + 1).padStart(2, '0');
    const day = String(yesterday.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day} 00:00:00`;
  }

  /**
   * Get today's date in the format required by eMAG API
   * @returns Date string in format YYYY-MM-DD 23:59:59
   */
  private getTodayDateString(): string {
    const today = new Date();
    
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day} 23:59:59`;
  }
}

export default EmagApiService; 