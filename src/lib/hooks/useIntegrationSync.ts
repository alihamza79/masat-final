import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { 
  EmagOrder, 
  EmagProductOffer,
  EmagApiService
} from '@/lib/services/emagApiService';
import { IIntegration as Integration } from '@/models/Integration';
import { decrypt } from '@/lib/utils/encryption';
import { decryptResponse } from '@/lib/utils/responseEncryption';
import { INTEGRATION_DETAILS_KEY, INTEGRATION_ORDERS_KEY, INTEGRATION_PRODUCT_OFFERS_KEY } from './useIntegrationData';

// Constants
export const INTEGRATIONS_STATUS_QUERY_KEY = 'integrations-status';
const ORDERS_PAGE_SIZE = 1000;
const PRODUCT_OFFERS_PAGE_SIZE = 100;

// Types
export type ImportStatus = 'idle' | 'loading' | 'importing' | 'completed' | 'success' | 'error';

/**
 * Hook for synchronizing eMAG data with MongoDB
 * This handles fetching data from eMAG API and storing it in MongoDB
 */
export const useIntegrationSync = () => {
  const queryClient = useQueryClient();

  /**
   * Updates the import status of an integration
   */
  const updateIntegrationStatus = useCallback(async (
    integrationId: string,
    status: ImportStatus,
    error?: string,
    ordersCount?: number,
    productOffersCount?: number,
    lastOrdersImport?: Date,
    lastProductOffersImport?: Date
  ) => {
    try {
      // Map our ImportStatus to match the schema's importStatus enum
      let dbStatus: ImportStatus = status;
      if (status === 'completed') {
        // Map 'completed' to 'success' to match schema expectations
        dbStatus = 'success' as ImportStatus;
      }
      
      const payload: any = { status: dbStatus };
      
      if (error !== undefined) payload.error = error;
      if (ordersCount !== undefined) payload.ordersCount = ordersCount;
      if (productOffersCount !== undefined) payload.productOffersCount = productOffersCount;
      if (lastOrdersImport !== undefined) payload.lastOrdersImport = lastOrdersImport;
      if (lastProductOffersImport !== undefined) payload.lastProductOffersImport = lastProductOffersImport;
      
      const response = await axios.put(`/api/db/integrations/status?integrationId=${integrationId}`, payload);
      
      if (response.data.success) {
        console.log(`Successfully updated integration ${integrationId} status to ${status}`);
        
        // Only invalidate the query for major changes
        if (status === 'completed' || status === 'success' || status === 'error' || 
            ordersCount !== undefined || productOffersCount !== undefined) {
          queryClient.invalidateQueries({ queryKey: [INTEGRATION_DETAILS_KEY, integrationId] });
          queryClient.invalidateQueries({ queryKey: [INTEGRATIONS_STATUS_QUERY_KEY] });
        }
      }
    } catch (error) {
      console.error(`Error updating integration status for ${integrationId}:`, error);
    }
  }, [queryClient]);

  /**
   * Fetches orders from eMAG API with pagination
   */
  const fetchOrdersFromEmagApi = useCallback(async (integration: Integration): Promise<EmagOrder[]> => {
    const allOrders: EmagOrder[] = [];
    let page = 1;
    let totalPages = 1;
    
    // Ensure integration has a valid ID
    if (!integration._id) {
      throw new Error('Integration ID is required');
    }
    
    const integrationId = String(integration._id);
    
    try {
      // Instead of calling eMAG API directly, use our server-side API endpoint
      // Get the order count first
      const orderCountResponse = await axios.get(`/api/integrations/${integrationId}/order-count`);
      
      if (!orderCountResponse.data.success) {
        throw new Error(orderCountResponse.data.error || 'Failed to fetch order count');
      }
      
      const orderCountResults = orderCountResponse.data.data.orderCount;
      
      if (orderCountResults) {
        totalPages = Math.ceil(parseInt(orderCountResults.noOfItems || '0', 10) / ORDERS_PAGE_SIZE);
      }
      
      console.log(`Found ${orderCountResults?.noOfItems || 0} orders (${totalPages} pages) for integration ${integrationId}`);
      
      // Fetch all pages through our server endpoint
      for (page = 1; page <= totalPages; page++) {
        console.log(`Fetching orders page ${page}/${totalPages} for integration ${integrationId}...`);
        
        const response = await axios.get(
          `/api/integrations/${integrationId}/orders?page=${page}&pageSize=${ORDERS_PAGE_SIZE}`
        );
        
        if (!response.data.success) {
          throw new Error(response.data.error || 'Failed to fetch orders');
        }
        
        const responseData = response.data.data;
        // Decrypt the response data before parsing
        const decryptedData = decryptResponse(responseData.orderData);
        const ordersData = JSON.parse(decryptedData);
        
        if (ordersData.orders && ordersData.orders.length > 0) {
          // Add integrationId to each order (should already be there, but ensuring it)
          const ordersWithId = ordersData.orders.map((order: any) => ({
            ...order,
            integrationId
          }));
          
          console.log(`Fetched ${ordersWithId.length} orders from page ${page}/${totalPages}`);
          allOrders.push(...ordersWithId);
        } else {
          console.log(`No orders found on page ${page}/${totalPages}`);
        }
        
        // Update status with progress
        const progress = Math.round((page / totalPages) * 100);
        console.log(`Orders import progress: ${progress}% (${allOrders.length} orders so far)`);
        await updateIntegrationStatus(
          integrationId, 
          'loading', 
          undefined, 
          allOrders.length
        );
      }
      
      console.log(`Completed fetching all ${allOrders.length} orders for integration ${integrationId}`);
      return allOrders;
    } catch (error) {
      console.error(`Error fetching orders for integration ${integrationId}:`, error);
      throw error;
    }
  }, [updateIntegrationStatus]);

  /**
   * Fetches product offers from eMAG API with pagination
   */
  const fetchProductOffersFromEmagApi = useCallback(async (integration: Integration): Promise<EmagProductOffer[]> => {
    const allProductOffers: EmagProductOffer[] = [];
    let page = 1;
    let totalPages = 1;
    
    // Ensure integration has a valid ID
    if (!integration._id) {
      throw new Error('Integration ID is required');
    }
    
    const integrationId = String(integration._id);
    
    try {
      // Instead of calling eMAG API directly, use our server-side API endpoint
      // Get the product offers count first
      const productOffersCountResponse = await axios.get(`/api/integrations/${integrationId}/product-offers?countOnly=true`);
      
      if (!productOffersCountResponse.data.success) {
        throw new Error(productOffersCountResponse.data.error || 'Failed to fetch product offers count');
      }
      
      const productOffersCountData = productOffersCountResponse.data.data;
      totalPages = productOffersCountData.totalPages || 1;
      
      console.log(`Found ${productOffersCountData.totalCount || 0} product offers (${totalPages} pages) for integration ${integrationId}`);
      
      // Fetch all pages through our server endpoint
      for (page = 1; page <= totalPages; page++) {
        console.log(`Fetching product offers page ${page}/${totalPages} for integration ${integrationId}...`);
        
        const response = await axios.get(
          `/api/integrations/${integrationId}/product-offers?page=${page}&pageSize=${PRODUCT_OFFERS_PAGE_SIZE}`
        );
        
        if (!response.data.success) {
          throw new Error(response.data.error || 'Failed to fetch product offers');
        }
        
        const responseData = response.data.data;
        // Decrypt the response data before parsing
        const decryptedData = decryptResponse(responseData.productOffersData);
        const productOffersData = JSON.parse(decryptedData);
        
        if (productOffersData.productOffers && productOffersData.productOffers.length > 0) {
          // Add integrationId to each product offer (should already be there, but ensuring it)
          const productOffersWithId = productOffersData.productOffers.map((offer: any) => ({
            ...offer,
            integrationId
          }));
          
          console.log(`Fetched ${productOffersWithId.length} product offers from page ${page}/${totalPages}`);
          allProductOffers.push(...productOffersWithId);
        } else {
          console.log(`No product offers found on page ${page}/${totalPages}`);
        }
        
        // Update status with progress
        const progress = Math.round((page / totalPages) * 100);
        console.log(`Product offers import progress: ${progress}% (${allProductOffers.length} product offers so far)`);
        await updateIntegrationStatus(
          integrationId, 
          'loading', 
          undefined,
          undefined, 
          allProductOffers.length
        );
      }
      
      console.log(`Completed fetching all ${allProductOffers.length} product offers for integration ${integrationId}`);
      return allProductOffers;
    } catch (error) {
      console.error(`Error fetching product offers for integration ${integrationId}:`, error);
      throw error;
    }
  }, [updateIntegrationStatus]);

  /**
   * Save orders to MongoDB
   */
  const saveOrdersToDb = useCallback(async (integrationId: string, orders: EmagOrder[]) => {
    try {
      if (!orders.length) {
        console.log(`No orders to save for integration ${integrationId}`);
        return;
      }
      
      console.log(`Saving ${orders.length} orders to database for integration ${integrationId}...`);
      
      const response = await axios.post('/api/db/orders', {
        integrationId,
        orders
      });
      
      if (response.data.success) {
        console.log(`Successfully saved ${orders.length} orders to database`);
        
        // Get the actual count of orders saved in DB
        const countResponse = await axios.get(`/api/db/orders/count?integrationId=${integrationId}`);
        const actualOrderCount = countResponse.data.success ? countResponse.data.data.totalCount : orders.length;
        
        // Update the integration with the actual count from DB
        await updateIntegrationStatus(
          integrationId, 
          'loading', 
          undefined, 
          actualOrderCount
        );
        
        // Invalidate orders query to refresh data
        queryClient.invalidateQueries({ queryKey: [INTEGRATION_ORDERS_KEY, integrationId] });
      } else {
        throw new Error(response.data.error || 'Failed to save orders');
      }
    } catch (error) {
      console.error(`Error saving orders to DB for integration ${integrationId}:`, error);
      throw error;
    }
  }, [queryClient, updateIntegrationStatus]);

  /**
   * Save product offers to MongoDB
   */
  const saveProductOffersToDb = useCallback(async (integrationId: string, productOffers: EmagProductOffer[]) => {
    try {
      if (!productOffers.length) {
        console.log(`No product offers to save for integration ${integrationId}`);
        return;
      }
      
      console.log(`Saving ${productOffers.length} product offers to database for integration ${integrationId}...`);
      
      const response = await axios.post('/api/db/product-offers', {
        integrationId,
        productOffers
      });
      
      if (response.data.success) {
        console.log(`Successfully saved ${productOffers.length} product offers to database`);
        
        // Get the actual count of product offers saved in DB
        const countResponse = await axios.get(`/api/db/product-offers/count?integrationId=${integrationId}`);
        const actualProductOffersCount = countResponse.data.success ? countResponse.data.data.totalCount : productOffers.length;
        
        // Update the integration with the actual count from DB
        await updateIntegrationStatus(
          integrationId, 
          'loading', 
          undefined, 
          undefined,
          actualProductOffersCount
        );
        
        // Invalidate product offers query to refresh data
        queryClient.invalidateQueries({ queryKey: [INTEGRATION_PRODUCT_OFFERS_KEY, integrationId] });
      } else {
        throw new Error(response.data.error || 'Failed to save product offers');
      }
    } catch (error) {
      console.error(`Error saving product offers to DB for integration ${integrationId}:`, error);
      throw error;
    }
  }, [queryClient, updateIntegrationStatus]);

  /**
   * Synchronize data for a specific integration
   * This function fetches data from eMAG API and stores it in MongoDB
   */
  const syncIntegrationData = useCallback(async (integration: Integration) => {
    if (!integration._id) {
      console.error("Cannot sync integration without ID");
      return;
    }
    
    const integrationId = String(integration._id);
    console.log(`Starting data sync for integration ${integrationId}...`);
    
    try {
      // Update status to loading
      await updateIntegrationStatus(integrationId, 'loading');
      
      // Fetch orders from eMAG API
      let orders: EmagOrder[] = [];
      try {
        console.log(`Fetching orders for integration ${integrationId}...`);
        orders = await fetchOrdersFromEmagApi(integration);
        
        // Save orders to DB
        await saveOrdersToDb(integrationId, orders);
        console.log(`Successfully imported ${orders.length} orders for integration ${integrationId}`);
      } catch (error) {
        console.error(`Error importing orders for integration ${integrationId}:`, error);
        await updateIntegrationStatus(
          integrationId, 
          'error', 
          `Error importing orders: ${error instanceof Error ? error.message : String(error)}`
        );
        return;
      }
      
      // Fetch product offers from eMAG API
      let productOffers: EmagProductOffer[] = [];
      try {
        console.log(`Fetching product offers for integration ${integrationId}...`);
        productOffers = await fetchProductOffersFromEmagApi(integration);
        
        // Save product offers to DB
        await saveProductOffersToDb(integrationId, productOffers);
        console.log(`Successfully imported ${productOffers.length} product offers for integration ${integrationId}`);
      } catch (error) {
        console.error(`Error importing product offers for integration ${integrationId}:`, error);
        await updateIntegrationStatus(
          integrationId, 
          'error', 
          `Error importing product offers: ${error instanceof Error ? error.message : String(error)}`
        );
        return;
      }
      
      // Update integration status to success
      await updateIntegrationStatus(
        integrationId, 
        'success', 
        '', // Clear any previous errors
        orders.length,
        productOffers.length,
        new Date(),
        new Date()
      );
      
      console.log(`Successfully completed import for integration ${integrationId} - status updated to success`);
      
      // Invalidate relevant queries to refresh UI data
      queryClient.invalidateQueries({ queryKey: [INTEGRATION_DETAILS_KEY, integrationId] });
      queryClient.invalidateQueries({ queryKey: [INTEGRATIONS_STATUS_QUERY_KEY] });
    } catch (error) {
      console.error(`Error syncing data for integration ${integrationId}:`, error);
      await updateIntegrationStatus(
        integrationId, 
        'error', 
        `Error syncing data: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }, [
    fetchOrdersFromEmagApi,
    fetchProductOffersFromEmagApi,
    saveOrdersToDb,
    saveProductOffersToDb,
    updateIntegrationStatus,
    queryClient
  ]);

  /**
   * Determine if an integration needs to be synced based on last import time
   */
  const shouldSyncIntegration = useCallback((integration: Integration, refetchIntervalMs: number = 3600000) => {
    // If no last import time, it should be synced
    if (!integration.lastOrdersImport && !integration.lastProductOffersImport) {
      return true;
    }
    
    const now = new Date().getTime();
    const lastImport = Math.max(
      integration.lastOrdersImport ? new Date(integration.lastOrdersImport).getTime() : 0,
      integration.lastProductOffersImport ? new Date(integration.lastProductOffersImport).getTime() : 0
    );
    
    // Sync if more than refetchInterval has passed since last import
    return (now - lastImport) > refetchIntervalMs;
  }, []);

  /**
   * Sync data for a specific integration by ID
   */
  const syncIntegrationById = useCallback(async (integrationId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log(`Starting sync for integration: ${integrationId}`);
      
      // First update status to loading
      await updateIntegrationStatus(integrationId, 'loading');
      
      // Fetch the integration details
      const response = await axios.get(`/api/integrations/${integrationId}`);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch integration details');
      }
      
      const integration = response.data.integration;
      
      // First fetch and store orders
      console.log(`Fetching orders for integration: ${integrationId}`);
      
      let orders: EmagOrder[] = [];
      try {
        orders = await fetchOrdersFromEmagApi(integration);
        console.log(`Fetched ${orders.length} orders for integration: ${integrationId}`);
      } catch (error: any) {
        console.error(`Error fetching orders for integration ${integrationId}:`, error);
        // Continue with the process even if orders fetching fails
      }
      
      // Always store orders (even empty array) to clean up previous ones
      try {
        await axios.post('/api/db/orders', {
          integrationId,
          orders
        });
        console.log(`Stored ${orders.length} orders for integration: ${integrationId}`);
      } catch (error: any) {
        console.error(`Error storing orders for integration ${integrationId}:`, error);
        throw error;
      }
      
      // Then fetch and store product offers
      console.log(`Fetching product offers for integration: ${integrationId}`);
      
      let productOffers: EmagProductOffer[] = [];
      try {
        productOffers = await fetchProductOffersFromEmagApi(integration);
        console.log(`Fetched ${productOffers.length} product offers for integration: ${integrationId}`);
      } catch (error: any) {
        console.error(`Error fetching product offers for integration ${integrationId}:`, error);
        // Continue with the process even if product offers fetching fails
      }
      
      // Always store product offers (even empty array) to clean up previous ones
      try {
        await axios.post('/api/db/product-offers', {
          integrationId,
          productOffers
        });
        console.log(`Stored ${productOffers.length} product offers for integration: ${integrationId}`);
      } catch (error: any) {
        console.error(`Error storing product offers for integration ${integrationId}:`, error);
        throw error;
      }
      
      // Update status to success
      await updateIntegrationStatus(
        integrationId, 
        'success', 
        '', // Empty string to clear any previous errors
        orders.length,
        productOffers.length,
        new Date(),
        new Date()
      );
      
      // Invalidate queries for this integration to ensure fresh data is displayed
      queryClient.invalidateQueries({ queryKey: [INTEGRATION_DETAILS_KEY, integrationId] });
      queryClient.invalidateQueries({ queryKey: [INTEGRATION_ORDERS_KEY, integrationId] });
      queryClient.invalidateQueries({ queryKey: [INTEGRATION_PRODUCT_OFFERS_KEY, integrationId] });
      
      console.log(`Completed sync for integration: ${integrationId}`);
      
      return { success: true };
    } catch (error: any) {
      console.error(`Error syncing integration ${integrationId}:`, error);
      
      // Update status to error
      await updateIntegrationStatus(
        integrationId, 
        'error', 
        error.message || 'An unexpected error occurred during synchronization'
      );
      
      return { success: false, error: error.message || 'Failed to sync integration' };
    }
  }, [updateIntegrationStatus, queryClient, fetchOrdersFromEmagApi, fetchProductOffersFromEmagApi]);

  /**
   * Sync all integrations that need refreshing
   */
  const syncAllIntegrations = useCallback(async (integrations: Integration[], refetchIntervalMs?: number) => {
    if (!integrations || integrations.length === 0) {
      console.log('No integrations to sync');
      return;
    }
    
    console.log(`Checking ${integrations.length} integrations for sync...`);
    
    for (const integration of integrations) {
      try {
        if (shouldSyncIntegration(integration, refetchIntervalMs)) {
          await syncIntegrationData(integration);
        } else {
          console.log(`Integration ${integration._id} is up to date, skipping sync`);
        }
      } catch (error) {
        console.error(`Error syncing integration ${integration._id}:`, error);
      }
    }
  }, [shouldSyncIntegration, syncIntegrationData]);

  return {
    syncIntegrationData,
    syncIntegrationById,
    syncAllIntegrations,
    updateIntegrationStatus
  };
};

export default useIntegrationSync; 