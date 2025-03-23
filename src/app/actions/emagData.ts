'use server';

import { connectToDatabase } from '@/lib/db/mongodb';
import Integration from '@/models/Integration';
import mongoose from 'mongoose';
import { decrypt } from '@/lib/utils/encryption';
import { EmagApiService, EmagOrder, EmagProductOffer, EmagOrdersResponse } from '@/lib/services/emagApiService';

export interface EmagDataSummary {
  integrationId: string;
  orders: EmagOrder[];
  productOffers: EmagProductOffer[];
  ordersCount: number;
  productOffersCount: number;
  lastUpdated: string;
  error?: string;
}

export interface EmagOrdersData {
  integrationId: string;
  orders: EmagOrder[];
  ordersCount: number;
  lastUpdated: string;
  error?: string;
}

export interface EmagProductOffersData {
  integrationId: string;
  productOffers: EmagProductOffer[];
  productOffersCount: number;
  lastUpdated: string;
  error?: string;
}

// Fetch orders with robust pagination and retry logic
export async function fetchEmagOrders(integrationId: string): Promise<EmagOrdersData> {
  try {
    console.log(`[Action] Starting fetchEmagOrders for integration ${integrationId}`);
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(integrationId)) {
      throw new Error('Invalid integration ID format');
    }

    await connectToDatabase();

    // Find integration by ID using Mongoose
    const integration = await Integration.findById(integrationId);

    if (!integration) {
      throw new Error('Integration not found');
    }

    // Decrypt the password securely on the server
    let decryptedPassword;
    try {
      decryptedPassword = decrypt(integration.password);
    } catch (error) {
      console.error('Error decrypting password:', error);
      throw new Error('Failed to decrypt integration credentials');
    }

    // Create eMAG API service with decrypted password
    const emagApi = new EmagApiService({
      username: integration.username,
      password: decryptedPassword,
      region: integration.region
    });

    // First, get the total order count to calculate total pages
    const orderCountResults = await emagApi.getOrderCount();
    
    // Check if there was an error getting the order count
    if (!orderCountResults) {
      throw new Error('Failed to fetch order count from eMAG API');
    }
    
    // Extract the count
    const totalOrderCount = orderCountResults.noOfItems 
      ? parseInt(orderCountResults.noOfItems, 10) 
      : 0;
    
    console.log(`[Action] Total order count: ${totalOrderCount}`);
    
    // If there are no orders, return an empty array (not an error)
    if (totalOrderCount === 0) {
      return {
        integrationId,
        orders: [],
        ordersCount: 0,
        lastUpdated: new Date().toISOString()
      };
    }
    
    // Set items per page (maximum allowed by the API is 1000)
    const itemsPerPage = 1000;
    
    // Calculate total pages (using ceiling function to ensure we get all orders)
    const totalPages = Math.ceil(totalOrderCount / itemsPerPage);
    
    console.log(`[Action] Will fetch ${totalPages} pages of orders, ${itemsPerPage} items per page`);
    
    // Fetch all orders using pagination
    let allOrders: EmagOrder[] = [];
    let hasError = false;
    let errorMessage = '';
    
    // Iterate through all pages with robust error handling and retries
    for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
      // Fetch orders for the current page with retry logic
      
      let retryCount = 0;
      const maxRetries = 3;
      let success = false;
      let ordersResponse: EmagOrdersResponse;
      
      console.log(`[Action] Fetching page ${currentPage} of ${totalPages}`);
      
      while (retryCount < maxRetries && !success) {
        try {
          if (retryCount > 0) {
            console.log(`[Action] Retry attempt ${retryCount} for page ${currentPage}`);
            // Add a delay before retrying that increases with each retry
            await new Promise(resolve => setTimeout(resolve, 3000 * retryCount));
          }
          
          // Fetch orders for the current page
          ordersResponse = await emagApi.getOrders({
            currentPage: currentPage,
            itemsPerPage: itemsPerPage
          });
          
          // Check if we got a valid response
          if (!ordersResponse) {
            throw new Error('Empty response received from getOrders()');
          }
          
          // Check for errors in response
          if (ordersResponse.isError) {
            const errorMsg = ordersResponse.messages.join(', ');
            console.log(`[Action] Error in response: ${errorMsg}`);
            
            // Check if it's a timeout or temporary error that we should retry
            if ((errorMsg.includes('timeout') || 
                 errorMsg.includes('time-out') || 
                 errorMsg.includes('timing out') || 
                 errorMsg.includes('temporary')) && 
                retryCount < maxRetries - 1) {
              console.log(`[Action] Temporary error detected, will retry`);
              retryCount++;
              continue;
            }
            
            hasError = true;
            errorMessage = `Failed to fetch orders: ${errorMsg}`;
            break;
          }
                    
          // Add orders from this page to our collection
          const ordersWithIntegrationId = ordersResponse.results.map((order: EmagOrder) => ({
            ...order,
            integrationId
          }));
          
          console.log(`[Action] Successfully fetched ${ordersWithIntegrationId.length} orders from page ${currentPage}`);
          
          allOrders = [...allOrders, ...ordersWithIntegrationId];
          
          // Mark as successful and continue to next page
          success = true;
          
        } catch (error: any) {
          console.error(`[Action] Error fetching page ${currentPage}:`, error.message);
          
          // Check if it's a timeout error that we should retry
          const isTimeout = error.message && (
            error.message.includes('timeout') || 
            error.message.includes('time-out') || 
            error.message.includes('timing out') ||
            error.code === 'ECONNABORTED'
          );
          
          if (isTimeout && retryCount < maxRetries - 1) {
            console.log(`[Action] Timeout detected, will retry (attempt ${retryCount + 1} of ${maxRetries})`);
            retryCount++;
            // Add a longer delay for timeout retries
            await new Promise(resolve => setTimeout(resolve, 5000 * retryCount));
            continue;
          }
          
          // If we've exhausted retries or it's not a timeout error, mark as failed
          hasError = true;
          errorMessage = error.message || `Error fetching page ${currentPage}`;
          break;
        }
      }
      
      // If we couldn't successfully fetch this page after all retries, break the pagination loop
      if (!success) {
        console.log(`[Action] Failed to fetch page ${currentPage} after ${retryCount} retries, stopping pagination`);
        break;
      }
    }
    
    // If there was an error during fetching, decide whether to throw or return partial results
    if (hasError) {
      if (allOrders.length === 0) {
        // If we couldn't fetch any orders, throw an error
        throw new Error(errorMessage);
      } else {
        // If we fetched some orders but encountered an error later, log it but return partial results
        console.warn(`[Action] Partial results: ${errorMessage}, but returning ${allOrders.length} orders`);
      }
    }
    
    // If no orders were fetched despite the count indicating there should be some, return error
    if (allOrders.length === 0 && totalOrderCount > 0) {
      throw new Error('Failed to fetch any orders despite count indicating orders exist');
    }

    console.log(`[Action] Successfully fetched a total of ${allOrders.length} orders`);

    // Return all fetched orders
    return {
      integrationId,
      orders: allOrders,
      ordersCount: allOrders.length,
      lastUpdated: new Date().toISOString()
    };
  } catch (error: any) {
    console.error('[Action] Error fetching eMAG orders:', error);
    return {
      integrationId,
      orders: [],
      ordersCount: 0,
      lastUpdated: new Date().toISOString(),
      error: error.message || 'An unexpected error occurred'
    };
  }
}

// Fetch product offers with robust pagination and retry logic
export async function fetchEmagProductOffers(integrationId: string): Promise<EmagProductOffersData> {
  try {
    console.log(`[Action] Starting fetchEmagProductOffers for integration ${integrationId}`);
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(integrationId)) {
      throw new Error('Invalid integration ID format');
    }

    await connectToDatabase();

    // Find integration by ID using Mongoose
    const integration = await Integration.findById(integrationId);

    if (!integration) {
      throw new Error('Integration not found');
    }

    // Decrypt the password securely on the server
    let decryptedPassword;
    try {
      decryptedPassword = decrypt(integration.password);
    } catch (error) {
      console.error('Error decrypting password:', error);
      throw new Error('Failed to decrypt integration credentials');
    }

    // Create eMAG API service with decrypted password
    const emagApi = new EmagApiService({
      username: integration.username,
      password: decryptedPassword,
      region: integration.region
    });

    // First, get the total product offers count to calculate total pages
    const productOffersCountResults = await emagApi.getProductOffersCount();
    
    // Check if there was an error getting the product offers count
    if (!productOffersCountResults) {
      throw new Error('Failed to fetch product offers count from eMAG API');
    }
    
    // Extract the count
    const totalProductOffersCount = productOffersCountResults.noOfItems 
      ? parseInt(productOffersCountResults.noOfItems, 10) 
      : 0;
    
    console.log(`[Action] Total product offers count: ${totalProductOffersCount}`);
    
    // If there are no product offers, return an empty array (not an error)
    if (totalProductOffersCount === 0) {
      return {
        integrationId,
        productOffers: [],
        productOffersCount: 0,
        lastUpdated: new Date().toISOString()
      };
    }
    
    // Set items per page (maximum allowed by the API is 100)
    const itemsPerPage = 100;
    
    // Calculate total pages (using ceiling function to ensure we get all product offers)
    const totalPages = Math.ceil(totalProductOffersCount / itemsPerPage);
    
    console.log(`[Action] Will fetch ${totalPages} pages of product offers, ${itemsPerPage} items per page`);
    
    // Fetch all product offers using pagination
    let allProductOffers: EmagProductOffer[] = [];
    let hasError = false;
    let errorMessage = '';
    
    // Iterate through all pages with robust error handling and retries
    for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
      // Fetch product offers for the current page with retry logic
      
      let retryCount = 0;
      const maxRetries = 3;
      let success = false;
      let productOffersResponse;
      
      console.log(`[Action] Fetching page ${currentPage} of ${totalPages}`);
      
      while (retryCount < maxRetries && !success) {
        try {
          if (retryCount > 0) {
            console.log(`[Action] Retry attempt ${retryCount} for page ${currentPage}`);
            // Add a delay before retrying that increases with each retry
            await new Promise(resolve => setTimeout(resolve, 3000 * retryCount));
          }
          
          // Fetch product offers for the current page
          productOffersResponse = await emagApi.getProductOffers({
            currentPage: currentPage,
            itemsPerPage: itemsPerPage
          });
          
          // Check if we got a valid response
          if (!productOffersResponse) {
            throw new Error('Empty response received from getProductOffers()');
          }
          
          // Check for errors in response
          if (productOffersResponse.isError) {
            const errorMsg = productOffersResponse.messages.join(', ');
            console.log(`[Action] Error in response: ${errorMsg}`);
            
            // Check if it's a timeout or temporary error that we should retry
            if ((errorMsg.includes('timeout') || 
                 errorMsg.includes('time-out') || 
                 errorMsg.includes('timing out') || 
                 errorMsg.includes('temporary')) && 
                retryCount < maxRetries - 1) {
              console.log(`[Action] Temporary error detected, will retry`);
              retryCount++;
              continue;
            }
            
            hasError = true;
            errorMessage = `Failed to fetch product offers: ${errorMsg}`;
            break;
          }
                    
          // Add product offers from this page to our collection
          const productOffersWithIntegrationId = productOffersResponse.results.map((offer: EmagProductOffer) => ({
            ...offer,
            integrationId
          }));
          
          // Filter out any EOL products (status=2) that might have slipped through
          const filteredProductOffers = productOffersWithIntegrationId.filter(offer => offer.status !== 2);
          
          console.log(`[Action] Successfully fetched ${filteredProductOffers.length} product offers from page ${currentPage}`);
          
          allProductOffers = [...allProductOffers, ...filteredProductOffers];
          
          // Mark as successful and continue to next page
          success = true;
          
        } catch (error: any) {
          console.error(`[Action] Error fetching page ${currentPage}:`, error.message);
          
          // Check if it's a timeout error that we should retry
          const isTimeout = error.message && (
            error.message.includes('timeout') || 
            error.message.includes('time-out') || 
            error.message.includes('timing out') ||
            error.code === 'ECONNABORTED'
          );
          
          if (isTimeout && retryCount < maxRetries - 1) {
            console.log(`[Action] Timeout detected, will retry (attempt ${retryCount + 1} of ${maxRetries})`);
            retryCount++;
            // Add a longer delay for timeout retries
            await new Promise(resolve => setTimeout(resolve, 5000 * retryCount));
            continue;
          }
          
          // If we've exhausted retries or it's not a timeout error, mark as failed
          hasError = true;
          errorMessage = error.message || `Error fetching page ${currentPage}`;
          break;
        }
      }
      
      // If we couldn't successfully fetch this page after all retries, break the pagination loop
      if (!success) {
        console.log(`[Action] Failed to fetch page ${currentPage} after ${retryCount} retries, stopping pagination`);
        break;
      }
    }
    
    // If there was an error during fetching, decide whether to throw or return partial results
    if (hasError) {
      if (allProductOffers.length === 0) {
        // If we couldn't fetch any product offers, throw an error
        throw new Error(errorMessage);
      } else {
        // If we fetched some product offers but encountered an error later, log it but return partial results
        console.warn(`[Action] Partial results: ${errorMessage}, but returning ${allProductOffers.length} product offers`);
      }
    }
    
    // If no product offers were fetched despite the count indicating there should be some, return error
    if (allProductOffers.length === 0 && totalProductOffersCount > 0) {
      throw new Error('Failed to fetch any product offers despite count indicating product offers exist');
    }

    console.log(`[Action] Successfully fetched a total of ${allProductOffers.length} product offers`);

    // Return all fetched product offers
    return {
      integrationId,
      productOffers: allProductOffers,
      productOffersCount: allProductOffers.length,
      lastUpdated: new Date().toISOString()
    };
  } catch (error: any) {
    console.error('[Action] Error fetching eMAG product offers:', error);
    return {
      integrationId,
      productOffers: [],
      productOffersCount: 0,
      lastUpdated: new Date().toISOString(),
      error: error.message || 'An unexpected error occurred'
    };
  }
} 