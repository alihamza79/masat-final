import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { 
  EmagOrder, 
  EmagProductOffer,
  EmagApiService
} from '@/lib/services/emagApiService';
import { IIntegration as Integration } from '@/models/Integration';
import { INTEGRATION_DETAILS_KEY, INTEGRATION_ORDERS_KEY, INTEGRATION_PRODUCT_OFFERS_KEY } from './useIntegrationData';

// Constants for API page sizes
const ORDERS_PAGE_SIZE = 1000;
const PRODUCT_OFFERS_PAGE_SIZE = 100;

// Types for import status
export type ImportStatus = 'idle' | 'importing' | 'loading' | 'completed' | 'success' | 'error';

// Add the missing query key
export const INTEGRATIONS_STATUS_QUERY_KEY = 'integrations-status';

/**
 * Hook for synchronizing eMAG data with MongoDB
 * This handles fetching data from eMAG API and storing it in MongoDB
 */
export const useEmagDataSync = () => {
  const queryClient = useQueryClient();
  const [syncingIntegrations, setSyncingIntegrations] = useState<Set<string>>(new Set());

  /**
   * Updates the import status of an integration
   */
  const updateIntegrationStatus = async (
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
      // The schema uses: 'idle' | 'importing' | 'loading' | 'completed' | 'success' | 'error'
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
      
      await axios.put(`/api/db/integrations/status?integrationId=${integrationId}`, payload);
      
      // Only invalidate the query for major changes (completed, error) to prevent excessive refetches
      // For 'importing' or 'loading' states, we don't need to invalidate as frequently
      if (status === 'completed' || status === 'error' || ordersCount !== undefined || productOffersCount !== undefined) {
        queryClient.invalidateQueries({ queryKey: [INTEGRATION_DETAILS_KEY, integrationId] });
        queryClient.invalidateQueries({ queryKey: [INTEGRATIONS_STATUS_QUERY_KEY] });
      }
    } catch (error) {
      console.error(`Error updating integration status for ${integrationId}:`, error);
    }
  };

  /**
   * Saves orders to MongoDB
   */
  const saveOrdersToDb = async (integrationId: string, orders: EmagOrder[]) => {
    try {
      // Map the orders to match the expected schema format
      const formattedOrders = orders.map(order => {
        // Create a new object without the id field
        const { id, ...orderData } = order;
        
        // Return a formatted order with the proper emagOrderId field
        return {
          ...orderData,
          integrationId,
          emagOrderId: id, // Map id to emagOrderId for our schema
        };
      });
      
      const response = await axios.post('/api/db/orders', {
        integrationId,
        orders: formattedOrders
      });
      
      if (response.data.success) {
        // Invalidate the query for this integration's orders
        queryClient.invalidateQueries({ queryKey: [INTEGRATION_ORDERS_KEY, integrationId] });
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error(`Error saving orders for integration ${integrationId}:`, error);
      throw error;
    }
  };

  /**
   * Saves product offers to MongoDB
   */
  const saveProductOffersToDb = async (integrationId: string, productOffers: EmagProductOffer[]) => {
    try {
      // Map the product offers to match the expected schema format
      const formattedProductOffers = productOffers.map(offer => {
        // Create a new object without the id field
        const { id, ...offerData } = offer;
        
        // Return a formatted product offer with the proper emagProductOfferId field
        return {
          ...offerData,
          integrationId,
          emagProductOfferId: id, // Map id to emagProductOfferId for our schema
        };
      });
      
      const response = await axios.post('/api/db/product-offers', {
        integrationId,
        productOffers: formattedProductOffers,
        replaceAll: true
      });
      
      if (response.data.success) {
        // Invalidate the query for this integration's product offers
        queryClient.invalidateQueries({ queryKey: [INTEGRATION_PRODUCT_OFFERS_KEY, integrationId] });
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error(`Error saving product offers for integration ${integrationId}:`, error);
      throw error;
    }
  };

  /**
   * Fetches orders from eMAG API with pagination
   */
  const fetchOrdersFromEmagApi = async (integration: Integration): Promise<EmagOrder[]> => {
    const allOrders: EmagOrder[] = [];
    let page = 1;
    let totalPages = 1;
    
    // Ensure integration has a valid ID
    if (!integration._id) {
      throw new Error('Integration ID is required');
    }
    
    const integrationId = String(integration._id);
    
    try {
      // Create eMAG API service with proper credentials
      const emagApi = new EmagApiService({
        username: integration.username,
        password: integration.password, // Password should be decrypted by the service that provides the integration
        region: integration.region
      });
      
      // First, get the total count
      const orderCountResults = await emagApi.getOrderCount();
      
      if (orderCountResults) {
        totalPages = Math.ceil(parseInt(orderCountResults.noOfItems || '0', 10) / ORDERS_PAGE_SIZE);
      }
      
      console.log(`Found ${orderCountResults?.noOfItems || 0} orders (${totalPages} pages) for integration ${integrationId}`);
      
      // Fetch all pages
      for (page = 1; page <= totalPages; page++) {
        console.log(`Fetching orders page ${page}/${totalPages} for integration ${integrationId}...`);
        const response = await emagApi.getOrders({
          currentPage: page,
          itemsPerPage: ORDERS_PAGE_SIZE
        });

        
        if (response?.results) {
          // Add integrationId to each order
          const ordersWithId = response.results.map(order => ({
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
          'importing', 
          undefined, 
          allOrders.length,
          undefined,
          undefined,
          undefined
        );
      }
      
      console.log(`Completed fetching all ${allOrders.length} orders for integration ${integrationId}`);
      return allOrders;
    } catch (error) {
      console.error(`Error fetching orders from eMAG for integration ${integrationId}:`, error);
      throw error;
    }
  };

  /**
   * Fetches product offers from eMAG API with pagination
   */
  const fetchProductOffersFromEmagApi = async (integration: Integration): Promise<EmagProductOffer[]> => {
    const allProductOffers: EmagProductOffer[] = [];
    let page = 1;
    let totalPages = 1;
    
    // Ensure integration has a valid ID
    if (!integration._id) {
      throw new Error('Integration ID is required');
    }
    
    const integrationId = String(integration._id);
    
    try {
      // Create eMAG API service with proper credentials
      const emagApi = new EmagApiService({
        username: integration.username,
        password: integration.password, // Password should be decrypted by the service that provides the integration
        region: integration.region
      });
      
      // First, get the total count
      const productOffersCountResults = await emagApi.getProductOffersCount();
      
      if (productOffersCountResults) {
        totalPages = Math.ceil(parseInt(productOffersCountResults.noOfItems || '0', 10) / PRODUCT_OFFERS_PAGE_SIZE);
      }
      
      console.log(`Found ${productOffersCountResults?.noOfItems || 0} product offers (${totalPages} pages) for integration ${integrationId}`);
      
      // Fetch all pages
      for (page = 1; page <= totalPages; page++) {
        console.log(`Fetching product offers page ${page}/${totalPages} for integration ${integrationId}...`);
        const response = await emagApi.getProductOffers({
          currentPage: page,
          itemsPerPage: PRODUCT_OFFERS_PAGE_SIZE
        });
        
        if (response?.results) {
          // Add integrationId to each product offer
          const productOffersWithId = response.results.map(offer => ({
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
          'importing', 
          undefined, 
          undefined,
          allProductOffers.length,
          undefined,
          undefined
        );
      }
      
      console.log(`Completed fetching all ${allProductOffers.length} product offers for integration ${integrationId}`);
      return allProductOffers;
    } catch (error) {
      console.error(`Error fetching product offers from eMAG for integration ${integrationId}:`, error);
      throw error;
    }
  };

  /**
   * Synchronizes data for a single integration
   */
  const syncIntegrationData = async (integration: Integration) => {
    if (!integration._id) {
      console.error('Cannot sync integration with no ID');
      return;
    }
    
    const integrationId = String(integration._id);
    
    if (syncingIntegrations.has(integrationId)) {
      console.log(`Integration ${integrationId} is already syncing, skipping duplicate sync`);
      return;
    }
    
    try {
      // Mark this integration as currently syncing
      setSyncingIntegrations(prev => new Set(prev).add(integrationId));
      
      // Update status to importing
      await updateIntegrationStatus(integrationId, 'importing');
      console.log(`Starting data sync for integration ${integrationId}`);
      
      // Step 1: Fetch all data from eMAG API first
      console.log(`Fetching orders from eMAG for integration ${integrationId}...`);
      const orders = await fetchOrdersFromEmagApi(integration);
      console.log(`Successfully fetched ${orders.length} orders for integration ${integrationId}`);
      
      console.log(`Fetching product offers from eMAG for integration ${integrationId}...`);
      const productOffers = await fetchProductOffersFromEmagApi(integration);
      console.log(`Successfully fetched ${productOffers.length} product offers for integration ${integrationId}`);
      
      // Step 2: Save data to MongoDB
      console.log(`Saving ${orders.length} orders to database for integration ${integrationId}...`);
      const savedOrdersResult = await saveOrdersToDb(integrationId, orders);
      console.log(`Successfully saved orders to database for integration ${integrationId}`, savedOrdersResult);
      
      console.log(`Saving ${productOffers.length} product offers to database for integration ${integrationId}...`);
      const savedProductOffersResult = await saveProductOffersToDb(integrationId, productOffers);
      console.log(`Successfully saved product offers to database for integration ${integrationId}`, savedProductOffersResult);
      
      // Step 3: Update status to completed with final counts and timestamps
      const now = new Date();
      console.log(`Updating integration ${integrationId} status to completed with counts: orders=${orders.length}, productOffers=${productOffers.length}`);
      await updateIntegrationStatus(
        integrationId, 
        'completed', 
        undefined, 
        orders.length, 
        productOffers.length,
        now,
        now
      );
      
      console.log(`Data sync completed for integration ${integrationId}`);
    } catch (error) {
      console.error(`Error syncing data for integration ${integrationId}:`, error);
      
      // Update status to error
      await updateIntegrationStatus(
        integrationId, 
        'error', 
        error instanceof Error ? error.message : String(error)
      );
    } finally {
      // Remove this integration from the syncing set
      setSyncingIntegrations(prev => {
        const newSet = new Set(prev);
        newSet.delete(integrationId);
        return newSet;
      });
    }
  };

  /**
   * Checks if an integration needs to be synced based on its last import time and the refetch interval
   */
  const shouldSyncIntegration = (integration: Integration, refetchIntervalMs: number = 3600000) => {
    if (!integration.lastOrdersImport || !integration.lastProductOffersImport) {
      return true;
    }
    
    const now = new Date().getTime();
    const lastOrdersImportTime = new Date(integration.lastOrdersImport).getTime();
    const lastProductOffersImportTime = new Date(integration.lastProductOffersImport).getTime();
    
    // Check if either data type needs to be refreshed
    return (
      now - lastOrdersImportTime > refetchIntervalMs ||
      now - lastProductOffersImportTime > refetchIntervalMs
    );
  };

  /**
   * Triggers a sync for all integrations that need it
   */
  const syncAllIntegrations = async (integrations: Integration[], refetchIntervalMs?: number) => {
    for (const integration of integrations) {
      if (shouldSyncIntegration(integration, refetchIntervalMs)) {
        await syncIntegrationData(integration);
      }
    }
  };

  return {
    syncIntegrationData,
    syncAllIntegrations,
    shouldSyncIntegration,
    isSyncing: (integrationId: string) => syncingIntegrations.has(integrationId),
    syncingCount: syncingIntegrations.size
  };
}; 