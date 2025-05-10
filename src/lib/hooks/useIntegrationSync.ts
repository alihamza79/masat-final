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
import { INTEGRATIONS_QUERY_KEY } from './useIntegrations';

// Constants
export const INTEGRATIONS_STATUS_QUERY_KEY = 'integrations-status';
const ORDERS_PAGE_SIZE = 400;
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
   * Utility function to invalidate and refetch all relevant queries
   * @param mode 'specific' for a single integration, 'all' for all integrations
   * @param integrationId Optional integration ID for specific invalidation
   */
  const invalidateAndRefetchQueries = useCallback(async (mode: 'specific' | 'all' = 'specific', integrationId?: string) => {
    console.log(`Invalidating and refetching queries in ${mode} mode${integrationId ? ` for integration ${integrationId}` : ''}`);
    
    // Always invalidate and refetch main integrations list
    await queryClient.invalidateQueries({ queryKey: INTEGRATIONS_QUERY_KEY });
    await queryClient.refetchQueries({ queryKey: INTEGRATIONS_QUERY_KEY });
    
    // Always invalidate integrations status
    await queryClient.invalidateQueries({ queryKey: [INTEGRATIONS_STATUS_QUERY_KEY] });
    
    if (mode === 'specific' && integrationId) {
      // Invalidate and refetch specific integration data
      await queryClient.invalidateQueries({ queryKey: [INTEGRATION_DETAILS_KEY, integrationId] });
      await queryClient.refetchQueries({ queryKey: [INTEGRATION_DETAILS_KEY, integrationId] });
      await queryClient.invalidateQueries({ queryKey: [INTEGRATION_ORDERS_KEY, integrationId] });
      await queryClient.refetchQueries({ queryKey: [INTEGRATION_ORDERS_KEY, integrationId] });
      await queryClient.invalidateQueries({ queryKey: [INTEGRATION_PRODUCT_OFFERS_KEY, integrationId] });
      await queryClient.refetchQueries({ queryKey: [INTEGRATION_PRODUCT_OFFERS_KEY, integrationId] });
    } else if (mode === 'all') {
      // Invalidate and refetch all integration details, orders, and product offers
      await queryClient.invalidateQueries({ queryKey: [INTEGRATION_DETAILS_KEY] });
      await queryClient.refetchQueries({ queryKey: [INTEGRATION_DETAILS_KEY] });
      await queryClient.invalidateQueries({ queryKey: [INTEGRATION_ORDERS_KEY] });
      await queryClient.refetchQueries({ queryKey: [INTEGRATION_ORDERS_KEY] });
      await queryClient.invalidateQueries({ queryKey: [INTEGRATION_PRODUCT_OFFERS_KEY] });
      await queryClient.refetchQueries({ queryKey: [INTEGRATION_PRODUCT_OFFERS_KEY] });
    }
  }, [queryClient]);

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
      
      const response = await axios.put(`/api/db/integrations?integrationId=${integrationId}`, payload);
      
      if (response.data.success) {
        console.log(`Successfully updated integration ${integrationId} status to ${status}`);
        
        // Use the utility function to invalidate and refetch queries
        await invalidateAndRefetchQueries('specific', integrationId);
      }
    } catch (error) {
      console.error(`Error updating integration status for ${integrationId}:`, error);
    }
  }, [queryClient, startSyncing, updateProgress, stopSyncing, isSyncing, invalidateAndRefetchQueries]);

  /**
   * Fetches orders from eMAG API with parallel pagination
   */
  const fetchOrdersFromEmagApi = useCallback(async (integration: Integration): Promise<EmagOrder[]> => {
    const allOrders: EmagOrder[] = [];
    const BATCH_SIZE = 10; // Process 10 pages concurrently
    
    if (!integration._id) {
      throw new Error('Integration ID is required');
    }
    const integrationId = String(integration._id);
    
    if (!isSyncing(integrationId)) {
      startSyncing(integrationId);
    }

    // New: Get the latest order creation date from DB; use default if none exists
    let latestOrderDate = "1970-01-01 00:00:00";
    try {
      const latestResponse = await axios.get(`/api/db/orders?latest=true&integrationId=${integrationId}`);
      if (latestResponse.data.success) {
        latestOrderDate = latestResponse.data.data.latestOrderDate;
      }
    } catch (error) {
      console.error("Error fetching latest order date; using default.", error);
    }
    console.log(`Latest order date for integration ${integrationId}: ${latestOrderDate}`);

    // Get the count of new orders from eMAG API using createdAfter filter
    const orderCountResponse = await axios.get(`/api/integrations/${integrationId}/order-count?createdAfter=${encodeURIComponent(latestOrderDate)}`);
    if (!orderCountResponse.data.success) {
      throw new Error(orderCountResponse.data.error || 'Failed to fetch order count');
    }
    const orderCountResults = orderCountResponse.data.data.orderCount;
    const totalOrderCount = parseInt(orderCountResults?.noOfItems || '0', 10);
    const totalPages = Math.ceil(totalOrderCount / ORDERS_PAGE_SIZE);
    
    console.log(`Found ${totalOrderCount} new orders (${totalPages} pages) for integration ${integrationId} with createdAfter filter`);
    
    if (totalPages === 0) {
      console.log(`No new orders to fetch for integration ${integrationId}`);
      return [];
    }
    
    // Process pages in parallel batches from page 1 since filtering is handled by date
    for (let batchStart = 1; batchStart <= totalPages; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE - 1, totalPages);
      console.log(`Processing orders batch: pages ${batchStart}-${batchEnd} of ${totalPages}`);
      
      const pageNumbers = Array.from({ length: batchEnd - batchStart + 1 }, (_, i) => batchStart + i);
      
      // Fetch all pages in this batch concurrently using createdAfter filter
      const batchResults = await Promise.all(
        pageNumbers.map(async (page) => {
          console.log(`Fetching orders page ${page}/${totalPages} for integration ${integrationId} with createdAfter=${latestOrderDate}...`);
          try {
            const response = await axios.get(`/api/integrations/${integrationId}/orders?createdAfter=${encodeURIComponent(latestOrderDate)}&page=${page}&pageSize=${ORDERS_PAGE_SIZE}`);
            if (!response.data.success) {
              throw new Error(response.data.error || 'Failed to fetch orders');
            }
            const responseData = response.data.data;
            // Decrypt the response data before parsing
            const decryptedData = decryptResponse(responseData.orderData);
            const ordersData = JSON.parse(decryptedData);
            if (ordersData.orders && ordersData.orders.length > 0) {
              // Add integrationId to each order
              const ordersWithId = ordersData.orders.map((order: any) => ({
                ...order,
                integrationId
              }));
              console.log(`Fetched ${ordersWithId.length} orders from page ${page}/${totalPages}`);
              return ordersWithId;
            } else {
              console.log(`No orders found on page ${page}/${totalPages}`);
              return [];
            }
          } catch (error) {
            console.error(`Error fetching orders page ${page}:`, error);
            throw error;
          }
        })
      );
      
      // Flatten the batch results and add to allOrders
      const batchOrders = batchResults.flat();
      
      // Additional filtering step to ensure we only keep orders newer than the createdAfter date
      // This helps prevent duplicates that might slip through the API filtering
      const latestOrderDateObj = new Date(latestOrderDate);
      const filteredBatchOrders = batchOrders.filter(order => {
        const orderDate = new Date(order.date);
        return orderDate > latestOrderDateObj;
      });
      
      if (batchOrders.length !== filteredBatchOrders.length) {
        console.log(`Filtered out ${batchOrders.length - filteredBatchOrders.length} orders with dates <= ${latestOrderDate}`);
      }
      
      allOrders.push(...filteredBatchOrders);
      
      console.log('batchOrders after filtering', filteredBatchOrders);

      // Calculate progress as percentage of pages processed
      const progress = Math.round((batchEnd / totalPages) * 100);
      console.log(`Orders import progress: ${progress}% (${allOrders.length} new orders so far)`);
      updateProgress(integrationId, {
        ordersProgress: progress,
        ordersCount: allOrders.length
      });
      
      // Update status in DB after each batch
      await updateIntegrationStatus(integrationId, 'loading');
    }
    
    console.log(`Completed fetching ${allOrders.length} new orders for integration ${integrationId}`);
    updateProgress(integrationId, {
      ordersProgress: 100,
      ordersCount: allOrders.length
    });
    
    return allOrders;
  }, [updateIntegrationStatus, startSyncing, isSyncing, updateProgress]);

  /**
   * Fetches product offers from eMAG API with parallel pagination
   */
  const fetchProductOffersFromEmagApi = useCallback(async (integration: Integration): Promise<EmagProductOffer[]> => {
    const allProductOffers: EmagProductOffer[] = [];
    const BATCH_SIZE = 5; // Process 5 pages concurrently
    
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
      
      // Get the product offers count first
      const productOffersCountResponse = await axios.get(`/api/integrations/${integrationId}/product-offers?countOnly=true`);
      
      if (!productOffersCountResponse.data.success) {
        throw new Error(productOffersCountResponse.data.error || 'Failed to fetch product offers count');
      }
      
      const productOffersCountData = productOffersCountResponse.data.data;
      const totalCount = productOffersCountData.totalCount || 0;
      const totalPages = productOffersCountData.totalPages || 1;
      
      console.log(`Found ${totalCount} product offers (${totalPages} pages) for integration ${integrationId}`);
      
      if (totalPages === 0 || totalCount === 0) {
        console.log(`No product offers found for integration ${integrationId}`);
        return [];
      }
      
      // Process pages in parallel batches
      for (let batchStart = 1; batchStart <= totalPages; batchStart += BATCH_SIZE) {
        const batchEnd = Math.min(batchStart + BATCH_SIZE - 1, totalPages);
        console.log(`Processing product offers batch: pages ${batchStart}-${batchEnd} of ${totalPages}`);
        
        // Create an array of page numbers for this batch
        const pageNumbers = Array.from(
          { length: batchEnd - batchStart + 1 }, 
          (_, i) => batchStart + i
        );
        
        // Fetch all pages in this batch concurrently
        const batchResults = await Promise.all(
          pageNumbers.map(async (page) => {
            console.log(`Fetching product offers page ${page}/${totalPages} for integration ${integrationId}...`);
            
            try {
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
                return productOffersWithId;
              } else {
                console.log(`No product offers found on page ${page}/${totalPages}`);
                return [];
              }
            } catch (error) {
              console.error(`Error fetching product offers page ${page}:`, error);
              throw error;
            }
          })
        );
        
        // Flatten the batch results and add to the allProductOffers array
        const batchProductOffers = batchResults.flat();
        allProductOffers.push(...batchProductOffers);
        
        // Calculate progress percentage
        const progress = Math.round((batchEnd / totalPages) * 100);
        console.log(`Product offers import progress: ${progress}% (${allProductOffers.length} product offers so far)`);
        
        // Update progress in the store ONLY - don't update DB count until fully saved
        updateProgress(integrationId, {
          productOffersProgress: progress,
          productOffersCount: allProductOffers.length
        });
        
        // Update status in DB after each batch
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
      
      console.log(`Saving ${orders.length} new orders to database for integration ${integrationId}...`);
      
      // Save the new orders
      const response = await axios.post('/api/db/orders', {
        integrationId,
        orders
      });
      
      if (response.data.success) {
        // Get the number of newly inserted orders from the API response
        const insertedCount = response.data.data?.results?.insertedCount || 0;
        const skippedCount = response.data.data?.results?.skippedCount || 0;
        
        console.log(`Successfully saved ${insertedCount} new orders to database for integration ${integrationId}${skippedCount > 0 ? `, skipped ${skippedCount} duplicates` : ''}`);
        
        // Update the store with the newly inserted count (not the total)
        updateProgress(integrationId, {
          ordersProgress: 100
        });
        
        // Use the utility function to invalidate and refetch queries
        await invalidateAndRefetchQueries('specific', integrationId);
        
        return insertedCount; // Return only the count of newly inserted orders
      } else {
        throw new Error(response.data.error || 'Failed to save orders');
      }
    } catch (error) {
      console.error(`Error saving orders to DB for integration ${integrationId}:`, error);
      throw error;
    }
  }, [queryClient, updateProgress, invalidateAndRefetchQueries]);

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
        
        // Use the utility function to invalidate and refetch queries
        await invalidateAndRefetchQueries('specific', integrationId);
        
        return insertedCount;
      } else {
        throw new Error(response.data.error || 'Failed to save product offers');
      }
    } catch (error) {
      console.error(`Error saving product offers to DB for integration ${integrationId}:`, error);
      throw error;
    }
  }, [queryClient, updateProgress, invalidateAndRefetchQueries]);

  /**
   * Synchronize data for a specific integration
   * This function fetches data from eMAG API and stores it in MongoDB
   */
  const syncIntegrationData = useCallback(async (
    integration: Integration,
    syncOrders: boolean = true,
    syncProductOffers: boolean = true
  ) => {
    if (!integration._id) {
      console.error("Cannot sync integration without ID");
      return;
    }
    
    const integrationId = String(integration._id);
    console.log(`Starting data sync for integration ${integrationId}...`);
    console.log(`Sync plan: Orders=${syncOrders}, ProductOffers=${syncProductOffers}`);
    
    try {
      // Update status to loading
      await updateIntegrationStatus(integrationId, 'loading');
      
      // Track dates for last import - will only set them at the moment of success
      let lastOrdersImport: Date | undefined = undefined;
      let lastProductOffersImport: Date | undefined = undefined;
      
      // Fetch and save orders if needed
      let ordersCount = 0;
      if (syncOrders) {
        try {
          console.log(`Fetching orders for integration ${integrationId}...`);
          
          // Fetch new orders using date filtering
          const orders = await fetchOrdersFromEmagApi(integration);
          console.log(`Fetched ${orders.length} new orders for integration: ${integrationId}`);
          
          // Optionally, fetch current DB orders count to compute cumulative total
          const dbOrdersCountResponse = await axios.get(`/api/db/orders/count?integrationId=${integrationId}`);
          let dbOrdersCount = 0;
          if (dbOrdersCountResponse.data.success) {
            dbOrdersCount = dbOrdersCountResponse.data.data.count || 0;
            console.log(`Current orders count in database: ${dbOrdersCount}`);
          }
          
          // Save orders to DB and get the count of newly added orders
          const newOrdersCount = await saveOrdersToDb(integrationId, orders);
          
          // Calculate the total orders count (existing + newly added)
          ordersCount = dbOrdersCount + newOrdersCount;
          console.log(`Total orders count after import: ${ordersCount} (${dbOrdersCount} existing + ${newOrdersCount} new)`);
          
          // Set the timestamp at the moment of success
          lastOrdersImport = new Date();
        } catch (error: any) {
          console.error(`Error importing orders for integration ${integrationId}:`, error);
          const errMsg = error.response?.data?.error || (error instanceof Error ? error.message : String(error));
          await updateIntegrationStatus(
            integrationId, 
            'error', 
            `Error importing orders: ${errMsg}`
          );
          return;
        }
      } else {
        console.log(`Skipping orders sync for integration ${integrationId} (not due yet)`);
        // Keep the existing count from the integration document
        ordersCount = integration.ordersCount || 0;
      }
      
      // Fetch and save product offers if needed
      let productOffersCount = 0;
      if (syncProductOffers) {
        try {
          console.log(`Fetching product offers for integration ${integrationId}...`);
          const productOffers = await fetchProductOffersFromEmagApi(integration);
          
          // Save product offers to DB and get the actual count
          productOffersCount = await saveProductOffersToDb(integrationId, productOffers);
          console.log(`Successfully imported ${productOffersCount} product offers for integration ${integrationId}`);
          // Set the timestamp at the moment of success
          lastProductOffersImport = new Date();
        } catch (error) {
          console.error(`Error importing product offers for integration ${integrationId}:`, error);
          await updateIntegrationStatus(
            integrationId, 
            'error', 
            `Error importing product offers: ${error instanceof Error ? error.message : String(error)}`
          );
          return;
        }
      } else {
        console.log(`Skipping product offers sync for integration ${integrationId} (not due yet)`);
        // Keep the existing count from the integration document
        productOffersCount = integration.productOffersCount || 0;
      }
      
      // Update integration status to success with actual counts from DB insertion
      await updateIntegrationStatus(
        integrationId, 
        'success', 
        '', // Clear any previous errors
        ordersCount,
        productOffersCount,
        lastOrdersImport, // Only update if we actually synced orders
        lastProductOffersImport // Only update if we actually synced product offers
      );
      
      console.log(`Successfully completed import for integration ${integrationId} - status updated to success`);
      
      // Use the utility function to invalidate and refetch queries
      await invalidateAndRefetchQueries('specific', integrationId);
      
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
    invalidateAndRefetchQueries
  ]);

  /**
   * Determine if an integration needs to be synced based on last import time and status
   * This also indicates whether to sync orders, product offers, or both
   */
  const shouldSyncIntegration = useCallback((integration: Integration, defaultRefetchIntervalMs: number = 3600000) => {
    const ORDERS_REFETCH_INTERVAL = 5 * 60 * 1000; // 5 minutes for orders
    const PRODUCT_OFFERS_REFETCH_INTERVAL = 12 * 60 * 60 * 1000; // 12 hours for product offers
    
    if (!integration._id) return { shouldSync: false };
    const integrationId = String(integration._id);
    
    // Check if the integration is already being synced in the store - don't start another sync
    if (isSyncing(integrationId)) {
      console.log(`Integration ${integrationId} is already being synced in this session, skipping duplicate sync`);
      return { shouldSync: false };
    }
    

    
    // If no import times at all, sync everything
    if (!integration.lastOrdersImport && !integration.lastProductOffersImport) {
      return { shouldSync: true, syncOrders: true, syncProductOffers: true };
    }
    
    const now = new Date().getTime();
    const lastOrdersImport = integration.lastOrdersImport ? new Date(integration.lastOrdersImport).getTime() : 0;
    const lastProductOffersImport = integration.lastProductOffersImport ? new Date(integration.lastProductOffersImport).getTime() : 0;
    
    // Determine what needs to be synced
    const shouldSyncOrders = !lastOrdersImport || (now - lastOrdersImport) > ORDERS_REFETCH_INTERVAL;
    const shouldSyncProductOffers = !lastProductOffersImport || (now - lastProductOffersImport) > PRODUCT_OFFERS_REFETCH_INTERVAL;
    
    // If nothing needs syncing, return false
    if (!shouldSyncOrders && !shouldSyncProductOffers) {
      return { shouldSync: false };
    }
    
    // Otherwise, return what should be synced
    return { 
      shouldSync: true, 
      syncOrders: shouldSyncOrders, 
      syncProductOffers: shouldSyncProductOffers 
    };
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
      
      // Determine what needs to be synced based on last import times
      const syncInfo = shouldSyncIntegration(integration);
      const syncOrders = syncInfo.syncOrders !== undefined ? syncInfo.syncOrders : true;
      const syncProductOffers = syncInfo.syncProductOffers !== undefined ? syncInfo.syncProductOffers : true;
      
      console.log(`Sync plan for integration ${integrationId}: Orders=${syncOrders}, ProductOffers=${syncProductOffers}`);
      
      // Track dates for last import - will only set them at the moment of success
      let lastOrdersImport: Date | undefined = undefined;
      let lastProductOffersImport: Date | undefined = undefined;
      
      // Initialize counts from the existing integration
      let ordersCount = integration.ordersCount || 0;
      let productOffersCount = integration.productOffersCount || 0;
      
      // Fetch and save orders if needed
      if (syncOrders) {
        console.log(`Fetching orders for integration: ${integrationId}`);
        try {
          // Fetch new orders using date filtering
          const orders = await fetchOrdersFromEmagApi(integration);
          console.log(`Fetched ${orders.length} new orders for integration: ${integrationId}`);
          
          // Optionally, fetch current DB orders count to compute cumulative total
          const dbOrdersCountResponse = await axios.get(`/api/db/orders/count?integrationId=${integrationId}`);
          let dbOrdersCount = 0;
          if (dbOrdersCountResponse.data.success) {
            dbOrdersCount = dbOrdersCountResponse.data.data.count || 0;
            console.log(`Current orders count in database: ${dbOrdersCount}`);
          }
          
          // Save orders to DB and get the count of newly added orders
          const newOrdersCount = await saveOrdersToDb(integrationId, orders);
          
          // Calculate the total orders count (existing + newly added)
          ordersCount = dbOrdersCount + newOrdersCount;
          console.log(`Total orders count after import: ${ordersCount} (${dbOrdersCount} existing + ${newOrdersCount} new)`);
          
          // Create timestamp at the moment of successful save
          lastOrdersImport = new Date();
        } catch (error: any) {
          console.error(`Error fetching or storing orders for integration ${integrationId}:`, error);
          throw error;
        }
      } else {
        console.log(`Skipping orders sync for integration ${integrationId} (not due yet)`);
      }
      
      // Fetch and save product offers if needed
      if (syncProductOffers) {
        console.log(`Fetching product offers for integration: ${integrationId}`);
        try {
          const productOffers = await fetchProductOffersFromEmagApi(integration);
          console.log(`Fetched ${productOffers.length} product offers for integration: ${integrationId}`);
          
          // Always store product offers (even empty array) to clean up previous ones
          try {
            // Store product offers and get the actual saved count
            productOffersCount = await saveProductOffersToDb(integrationId, productOffers);
            console.log(`Stored ${productOffersCount} product offers for integration: ${integrationId}`);
            // Create timestamp at the moment of successful save
            lastProductOffersImport = new Date();
          } catch (error: any) {
            console.error(`Error storing product offers for integration ${integrationId}:`, error);
            throw error;
          }
        } catch (error: any) {
          console.error(`Error fetching product offers for integration ${integrationId}:`, error);
          throw error;
        }
      } else {
        console.log(`Skipping product offers sync for integration ${integrationId} (not due yet)`);
      }
      
      // Update status to success with actual counts from DB insertion
      // Only update lastOrdersImport and lastProductOffersImport if we actually synced them
      await updateIntegrationStatus(
        integrationId, 
        'success', 
        '', // Empty string to clear any previous errors
        ordersCount,
        productOffersCount,
        lastOrdersImport,
        lastProductOffersImport
      );
      
      // Use the utility function to invalidate and refetch queries
      await invalidateAndRefetchQueries('specific', integrationId);
      
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
  }, [updateIntegrationStatus, queryClient, fetchOrdersFromEmagApi, fetchProductOffersFromEmagApi, saveOrdersToDb, saveProductOffersToDb, shouldSyncIntegration, invalidateAndRefetchQueries]);

  /**
   * Sync all integrations that need refreshing
   */
  const syncAllIntegrations = useCallback(async (integrations: Integration[], refetchIntervalMs?: number) => {
    if (!integrations || integrations.length === 0) {
      console.log('No integrations to sync');
      return;
    }
    
    console.log(`Checking ${integrations.length} integrations for sync...`);
    
    let anySynced = false;
    let skippedCount = 0;
    
    for (const integration of integrations) {
      try {
        const syncInfo = shouldSyncIntegration(integration, refetchIntervalMs);
        if (syncInfo.shouldSync) {
          await syncIntegrationData(integration, syncInfo.syncOrders, syncInfo.syncProductOffers);
          anySynced = true;
        } else {
          console.log(`Integration ${integration._id} is up to date, skipping sync`);
          skippedCount++;
        }
      } catch (error) {
        console.error(`Error syncing integration ${integration._id}:`, error);
      }
    }
    
    console.log(`Checked ${integrations.length} integrations. Skipped ${skippedCount}, synced ${integrations.length - skippedCount}`);
    
    // If any integrations were synced, invalidate and refetch all queries
    if (anySynced) {
      // Use the utility function to invalidate and refetch all queries
      await invalidateAndRefetchQueries('all');
    }
    
    return { 
      totalChecked: integrations.length,
      skippedCount,
      syncedCount: integrations.length - skippedCount
    };
  }, [queryClient, shouldSyncIntegration, syncIntegrationData, invalidateAndRefetchQueries]);

  return {
    syncIntegrationData,
    syncIntegrationById,
    syncAllIntegrations,
    updateIntegrationStatus
  };
};

export default useIntegrationSync; 