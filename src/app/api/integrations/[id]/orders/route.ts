import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Integration from '@/models/Integration';
import mongoose from 'mongoose';
import { decrypt } from '@/lib/utils/encryption';
import { encryptResponse } from '@/lib/utils/responseEncryption';
import { EmagApiService, EmagOrder, EmagOrdersResponse } from '@/lib/services/emagApiService';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid integration ID format' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find integration by ID using Mongoose
    const integration = await Integration.findById(id);

    if (!integration) {
      return NextResponse.json(
        { success: false, error: 'Integration not found' },
        { status: 404 }
      );
    }

    // Decrypt the password securely on the server
    let decryptedPassword;
    try {
      decryptedPassword = decrypt(integration.password);
    } catch (error) {
      console.error('Error decrypting password:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to decrypt integration credentials' },
        { status: 500 }
      );
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
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch order count from eMAG API' 
        },
        { status: 500 }
      );
    }
    
    // Extract the count
    const totalOrderCount = orderCountResults.noOfItems 
      ? parseInt(orderCountResults.noOfItems, 10) 
      : 0;
    
    // If there are no orders, return an empty array (not an error)
    if (totalOrderCount === 0) {
      return NextResponse.json({
        success: true,
        data: {
          integrationId: id,
          orderData: encryptResponse(JSON.stringify({
            orders: [],
            ordersCount: 0,
          })),
          lastUpdated: new Date().toISOString()
        }
      });
    }
    
    // Set items per page (maximum allowed by the API is 1000)
    const itemsPerPage = 1000;
    
    // Calculate total pages (using ceiling function to ensure we get all orders)
    const totalPages = Math.ceil(totalOrderCount / itemsPerPage);
    
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
      
      while (retryCount < maxRetries && !success) {
        // For tracking if we need to clear a timeout
        let timeoutId: NodeJS.Timeout | null = null;
        
        try {
          if (retryCount > 0) {
            console.log(`[API] Retry attempt ${retryCount} for page ${currentPage}`);
            // Add a delay before retrying that increases with each retry
            await new Promise(resolve => setTimeout(resolve, 3000 * retryCount));
          }
          
          // Set a timeout for this specific request (matching the 120s Axios timeout)
          // Store the timeout ID so we can clear it later
          const timeoutPromise = new Promise<never>((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error('Request timed out after 180 seconds')), 180000);
          });
          
          // Create the actual API request
          const apiRequestPromise = emagApi.getOrders({
            currentPage: currentPage,
            itemsPerPage: itemsPerPage
          });
          
          // Race the API request against the timeout
          ordersResponse = await Promise.race([apiRequestPromise, timeoutPromise]) as EmagOrdersResponse;
          
          // Cancel the timeout since we got a response
          if (timeoutId) clearTimeout(timeoutId);
          
          // Check if we got a valid response
          if (!ordersResponse) {
            throw new Error('Empty response received from getOrders()');
          }
          
          // Check for errors in response
          if (ordersResponse.isError) {
            const errorMsg = ordersResponse.messages.join(', ');
            console.log(`[API] Error in response: ${errorMsg}`);
            
            // Check if it's a timeout or temporary error that we should retry
            if ((errorMsg.includes('timeout') || 
                 errorMsg.includes('time-out') || 
                 errorMsg.includes('timing out') || 
                 errorMsg.includes('temporary')) && 
                retryCount < maxRetries - 1) {
              console.log(`[API] Temporary error detected, will retry`);
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
            integrationId: id
          }));
          
          allOrders = [...allOrders, ...ordersWithIntegrationId];
          
          // Mark as successful and continue to next page
          success = true;
          
        } catch (error: any) {
          // Make sure to cancel the timeout if there was an error
          if (timeoutId) clearTimeout(timeoutId);
          
          console.error(`[API] Error fetching page ${currentPage}:`, error.message);
          
          // Check if it's a timeout error that we should retry
          const isTimeout = error.message && (
            error.message.includes('timeout') || 
            error.message.includes('time-out') || 
            error.message.includes('timing out') ||
            error.code === 'ECONNABORTED'
          );
          
          if (isTimeout && retryCount < maxRetries - 1) {
            console.log(`[API] Timeout detected, will retry (attempt ${retryCount + 1} of ${maxRetries})`);
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
        console.log(`[API] Failed to fetch page ${currentPage} after ${retryCount} retries, stopping pagination`);
        break;
      }
    }
    
    // If there was an error during fetching, return error response
    if (hasError) {
      return NextResponse.json(
        { 
          success: false, 
          error: errorMessage 
        },
        { status: 500 }
      );
    }
    
    // If no orders were fetched despite the count indicating there should be some, return error
    if (allOrders.length === 0 && totalOrderCount > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch any orders despite count indicating orders exist' 
        },
        { status: 500 }
      );
    }

    // Return success response with data
    return NextResponse.json({
      success: true,
      data: {
        integrationId: id,
        orderData: encryptResponse(JSON.stringify({
          orders: allOrders,
          ordersCount: allOrders.length,
        })),
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'An unexpected error occurred while fetching orders' 
      },
      { status: 500 }
    );
  }
} 