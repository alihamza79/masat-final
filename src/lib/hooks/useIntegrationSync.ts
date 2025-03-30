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
import { useIntegrationSyncStore } from '@/app/(DashboardLayout)/integrations/store/integrationSyncStore';

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
  
  // Get access to the integration sync store
  const { 
    startSyncing, 
    updateProgress, 
    stopSyncing, 
    isSyncing 
  } = useIntegrationSyncStore();

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
      // Start syncing in the store if status is loading/importing
      if (status === 'loading' || status === 'importing') {
        if (!isSyncing(integrationId)) {
          startSyncing(integrationId);
        }
        
        // For loading state, don't update DB counts - only update the store
        if (ordersCount !== undefined || productOffersCount !== undefined) {
          // Update the store with progress info
          updateProgress(integrationId, {
            ordersCount: ordersCount || 0,
            productOffersCount: productOffersCount || 0
          });
        }
        
        return;
      }
      
      // Only store 'success' or 'error' states in the database
      let dbStatus: 'success' | 'error';
      if (status === 'success' || status === 'completed') {
        dbStatus = 'success';
        stopSyncing(integrationId); // Stop syncing in the store
      } else if (status === 'error') {
        dbStatus = 'error';
        stopSyncing(integrationId); // Stop syncing in the store
      } else {
        return; // Don't update for other states
      }
      
      const payload: any = { status: dbStatus };
      
      if (error !== undefined) payload.error = error;
      
      // Only update order and product offer counts in the database after sync is complete
      if (ordersCount !== undefined) payload.ordersCount = ordersCount;
      if (productOffersCount !== undefined) payload.productOffersCount = productOffersCount;
      if (lastOrdersImport !== undefined) payload.lastOrdersImport = lastOrdersImport;
      if (lastProductOffersImport !== undefined) payload.lastProductOffersImport = lastProductOffersImport;
      
      const response = await axios.put(`/api/db/integrations/status?integrationId=${integrationId}`, payload);
      
      if (response.data.success) {
        console.log(`Successfully updated integration ${integrationId} status to ${status}`);
        
        // Invalidate the query for any status change
        queryClient.invalidateQueries({ queryKey: [INTEGRATION_DETAILS_KEY, integrationId] });
        queryClient.invalidateQueries({ queryKey: [INTEGRATIONS_STATUS_QUERY_KEY] });
      }
    } catch (error) {
      console.error(`Error updating integration status for ${integrationId}:`, error);
    }
  }, [queryClient, startSyncing, updateProgress, stopSyncing, isSyncing]);

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
      // Start syncing in the store if not already syncing
      if (!isSyncing(integrationId)) {
        startSyncing(integrationId);
      }
      
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
        
        // Calculate progress percentage
        const progress = Math.round((page / totalPages) * 100);
        console.log(`Orders import progress: ${progress}% (${allOrders.length} orders so far)`);
        
        // Update progress in the store ONLY - don't update DB count until fully saved
        updateProgress(integrationId, {
          ordersProgress: progress,
          ordersCount: allOrders.length
        });
        
        // Update status in DB but don't update counts
        await updateIntegrationStatus(
          integrationId, 
          'loading'
        );
      }
      
      console.log(`Completed fetching all ${allOrders.length} orders for integration ${integrationId}`);
      
      // Update final progress in store only
      updateProgress(integrationId, {
        ordersProgress: 100,
        ordersCount: allOrders.length
      });
      
      return allOrders;
    } catch (error) {
      console.error(`Error fetching orders for integration ${integrationId}:`, error);
      throw error;
    }
  }, [updateIntegrationStatus, startSyncing, isSyncing, updateProgress]);

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
      // Start syncing in the store if not already syncing
      if (!isSyncing(integrationId)) {
        startSyncing(integrationId);
      }
      
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
        
        // Calculate progress percentage
        const progress = Math.round((page / totalPages) * 100);
        console.log(`Product offers import progress: ${progress}% (${allProductOffers.length} product offers so far)`);
        
        // Update progress in the store ONLY - don't update DB count until fully saved
        updateProgress(integrationId, {
          productOffersProgress: progress,
          productOffersCount: allProductOffers.length
        });
        
        // Update status in DB but don't update counts
        await updateIntegrationStatus(
          integrationId, 
          'loading'
        );
      }
      
      console.log(`Completed fetching all ${allProductOffers.length} product offers for integration ${integrationId}`);
      
      // Update final progress in store only
      updateProgress(integrationId, {
        productOffersProgress: 100,
        productOffersCount: allProductOffers.length
      });
      
      return allProductOffers;
    } catch (error) {
      console.error(`Error fetching product offers for integration ${integrationId}:`, error);
      throw error;
    }
  }, [updateIntegrationStatus, startSyncing, isSyncing, updateProgress]);

  /**
   * Save orders to MongoDB
   */
  const saveOrdersToDb = useCallback(async (integrationId: string, orders: EmagOrder[]) => {
    try {
      if (!orders.length) {
        console.log(`No orders to save for integration ${integrationId}`);
        return 0; // Return 0 since no orders were saved
      }
      
      console.log(`Saving ${orders.length} orders to database for integration ${integrationId}...`);
      
      const response = await axios.post('/api/db/orders', {
        integrationId,
        orders
      });
      
      if (response.data.success) {
        console.log(`Successfully saved ${orders.length} orders to database`);
        // Get the actual count of orders saved from the API response
        const insertedCount = response.data.data?.results?.insertedCount || orders.length;
        console.log(`Successfully saved ${insertedCount} orders to database`);
        
        // Update the store with the accurate count
        updateProgress(integrationId, {
          ordersCount: insertedCount
        });
        
        // Invalidate orders query to refresh data
        queryClient.invalidateQueries({ queryKey: [INTEGRATION_ORDERS_KEY, integrationId] });
        
        return insertedCount;
      } else {
        throw new Error(response.data.error || 'Failed to save orders');
      }
    } catch (error) {
      console.error(`Error saving orders to DB for integration ${integrationId}:`, error);
      throw error;
    }
  }, [queryClient, updateProgress]);

  /**
   * Save product offers to MongoDB
   */
  const saveProductOffersToDb = useCallback(async (integrationId: string, productOffers: EmagProductOffer[]) => {
    try {
      if (!productOffers.length) {
        console.log(`No product offers to save for integration ${integrationId}`);
        return 0; // Return 0 since no product offers were saved
      }
      
      console.log(`Saving ${productOffers.length} product offers to database for integration ${integrationId}...`);
      
      const response = await axios.post('/api/db/product-offers', {
        integrationId,
        productOffers
      });
      
      if (response.data.success) {
        console.log(`Successfully saved ${productOffers.length} product offers to database`);
        // Get the actual count of product offers saved from the API response
        const insertedCount = response.data.data?.results?.insertedCount || productOffers.length;
        console.log(`Successfully saved ${insertedCount} product offers to database`);
        
        // Update the store with the accurate count
        updateProgress(integrationId, {
          productOffersCount: insertedCount
        });
        
        // Invalidate product offers query to refresh data
        queryClient.invalidateQueries({ queryKey: [INTEGRATION_PRODUCT_OFFERS_KEY, integrationId] });
        
        return insertedCount;
      } else {
        throw new Error(response.data.error || 'Failed to save product offers');
      }
    } catch (error) {
      console.error(`Error saving product offers to DB for integration ${integrationId}:`, error);
      throw error;
    }
  }, [queryClient, updateProgress]);

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
      let ordersCount = 0;
      try {
        console.log(`Fetching orders for integration ${integrationId}...`);
        orders = await fetchOrdersFromEmagApi(integration);
        
        // Save orders to DB and get the actual count
        ordersCount = await saveOrdersToDb(integrationId, orders);
        console.log(`Successfully imported ${ordersCount} orders for integration ${integrationId}`);
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
      let productOffersCount = 0;
      try {
        console.log(`Fetching product offers for integration ${integrationId}...`);
        productOffers = await fetchProductOffersFromEmagApi(integration);
        
        // Save product offers to DB and get the actual count
        productOffersCount = await saveProductOffersToDb(integrationId, productOffers);
        console.log(`Successfully imported ${productOffersCount} product offers for integration ${integrationId}`);
      } catch (error) {
        console.error(`Error importing product offers for integration ${integrationId}:`, error);
        await updateIntegrationStatus(
          integrationId, 
          'error', 
          `Error importing product offers: ${error instanceof Error ? error.message : String(error)}`
        );
        return;
      }
      
      // Update integration status to success with actual counts from DB insertion
      await updateIntegrationStatus(
        integrationId, 
        'success', 
        '', // Clear any previous errors
        ordersCount,
        productOffersCount,
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
   * Determine if an integration needs to be synced based on last import time and status
   */
  const shouldSyncIntegration = useCallback((integration: Integration, refetchIntervalMs: number = 3600000) => {
    // Check if the integration is already being synced in the store - don't start another sync
    if (isSyncing(String(integration._id))) {
      console.log(`Integration ${integration._id} is already being synced in this session, skipping duplicate sync`);
      return false;
    }
    
    // If status is error, always sync regardless of time threshold
    if (integration.importStatus === 'error') {
      console.log(`Integration ${integration._id} has error status, will attempt to sync`);
      return true;
    }
    
    // If no last import time, it should be synced
    if (!integration.lastOrdersImport && !integration.lastProductOffersImport) {
      return true;
    }
    
    // Only check time threshold if status is success
    if (integration.importStatus === 'success') {
      const now = new Date().getTime();
      const lastImport = Math.max(
        integration.lastOrdersImport ? new Date(integration.lastOrdersImport).getTime() : 0,
        integration.lastProductOffersImport ? new Date(integration.lastProductOffersImport).getTime() : 0
      );
      
      // Sync if more than refetchInterval has passed since last import
      return (now - lastImport) > refetchIntervalMs;
    }
    
    // Default: sync if not success and not already syncing
    return true;
  }, [isSyncing]);

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
      let ordersCount = 0;
      try {
        orders = await fetchOrdersFromEmagApi(integration);
        console.log(`Fetched ${orders.length} orders for integration: ${integrationId}`);
      } catch (error: any) {
        console.error(`Error fetching orders for integration ${integrationId}:`, error);
        // Continue with the process even if orders fetching fails
      }
      
      // Always store orders (even empty array) to clean up previous ones
      try {
        // Store orders and get the actual saved count
        ordersCount = await saveOrdersToDb(integrationId, orders);
        console.log(`Stored ${ordersCount} orders for integration: ${integrationId}`);
      } catch (error: any) {
        console.error(`Error storing orders for integration ${integrationId}:`, error);
        throw error;
      }
      
      // Then fetch and store product offers
      console.log(`Fetching product offers for integration: ${integrationId}`);
      
      let productOffers: EmagProductOffer[] = [];
      let productOffersCount = 0;
      try {
        productOffers = await fetchProductOffersFromEmagApi(integration);
        console.log(`Fetched ${productOffers.length} product offers for integration: ${integrationId}`);
      } catch (error: any) {
        console.error(`Error fetching product offers for integration ${integrationId}:`, error);
        // Continue with the process even if product offers fetching fails
      }
      
      // Always store product offers (even empty array) to clean up previous ones
      try {
        // Store product offers and get the actual saved count
        productOffersCount = await saveProductOffersToDb(integrationId, productOffers);
        console.log(`Stored ${productOffersCount} product offers for integration: ${integrationId}`);
      } catch (error: any) {
        console.error(`Error storing product offers for integration ${integrationId}:`, error);
        throw error;
      }
      
      // Update status to success with actual counts from DB insertion
      await updateIntegrationStatus(
        integrationId, 
        'success', 
        '', // Empty string to clear any previous errors
        ordersCount,
        productOffersCount,
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
  }, [updateIntegrationStatus, queryClient, fetchOrdersFromEmagApi, fetchProductOffersFromEmagApi, saveOrdersToDb, saveProductOffersToDb]);

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