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
    
    // Get page and pageSize from query params
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '100', 10);
    
    // For count-only requests (used to determine total count/pages)
    const countOnly = searchParams.get('countOnly') === 'true';
    
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

    // Get the total order count
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
    
    // Calculate total pages
    const totalPages = Math.ceil(totalOrderCount / pageSize);
    
    // If count-only request, return just the count info
    if (countOnly) {
      return NextResponse.json({
        success: true,
        data: {
          totalCount: totalOrderCount,
          totalPages: totalPages,
          pageSize: pageSize
        }
      });
    }
    
    // If there are no orders, return an empty array (not an error)
    if (totalOrderCount === 0) {
      return NextResponse.json({
        success: true,
        data: {
          integrationId: id,
          orderData: encryptResponse(JSON.stringify({
            orders: [],
            ordersCount: 0,
            currentPage: page,
            totalPages: 0,
            totalCount: 0
          })),
          lastUpdated: new Date().toISOString()
        }
      });
    }
    
    // Validate page parameter
    if (page < 1 || page > totalPages) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid page number. Valid range is 1-${totalPages}` 
        },
        { status: 400 }
      );
    }

    // Fetch orders for the specified page with retry logic
    let retryCount = 0;
    const maxRetries = 3;
    let success = false;
    let ordersResponse: EmagOrdersResponse | undefined;
    let errorMessage = '';
    
    while (retryCount < maxRetries && !success) {
      // For tracking if we need to clear a timeout
      let timeoutId: NodeJS.Timeout | null = null;
      
      try {
        if (retryCount > 0) {
          console.log(`[API] Retry attempt ${retryCount} for page ${page}`);
          // Add a delay before retrying that increases with each retry
          await new Promise(resolve => setTimeout(resolve, 3000 * retryCount));
        }
        
        // Set a timeout for this specific request
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Request timed out after 180 seconds')), 180000);
        });
        
        // Create the actual API request
        const apiRequestPromise = emagApi.getOrders({
          currentPage: page,
          itemsPerPage: pageSize
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
          const errMsg = ordersResponse.messages.join(', ');
          console.log(`[API] Error in response: ${errMsg}`);
          
          // Check if it's a timeout or temporary error that we should retry
          if ((errMsg.includes('timeout') || 
               errMsg.includes('time-out') || 
               errMsg.includes('timing out') || 
               errMsg.includes('temporary')) && 
              retryCount < maxRetries - 1) {
            console.log(`[API] Temporary error detected, will retry`);
            retryCount++;
            continue;
          }
          
          errorMessage = `Failed to fetch orders: ${errMsg}`;
          throw new Error(errorMessage);
        }
                  
        // Add integration ID to each order
        const ordersWithIntegrationId = ordersResponse.results.map((order: EmagOrder) => ({
          ...order,
          integrationId: id
        }));
        
        // Replace the results with our modified orders
        ordersResponse.results = ordersWithIntegrationId;
        
        // Mark as successful
        success = true;
        
      } catch (error: any) {
        // Make sure to cancel the timeout if there was an error
        if (timeoutId) clearTimeout(timeoutId);
        
        console.error(`[API] Error fetching page ${page}:`, error.message);
        
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
        
        // If we've exhausted retries or it's not a timeout error, return error
        return NextResponse.json(
          { 
            success: false, 
            error: error.message || `Error fetching page ${page}` 
          },
          { status: 500 }
        );
      }
    }
    
    // If we didn't succeed after all retries
    if (!success || !ordersResponse) {
      return NextResponse.json(
        { 
          success: false, 
          error: errorMessage || `Failed to fetch page ${page} after ${retryCount} retries` 
        },
        { status: 500 }
      );
    }
    
    // Return success response with data for this page
    return NextResponse.json({
      success: true,
      data: {
        integrationId: id,
        orderData: encryptResponse(JSON.stringify({
          orders: ordersResponse.results,
          ordersCount: totalOrderCount,
          currentPage: page,
          totalPages: totalPages,
          totalCount: totalOrderCount
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