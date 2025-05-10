import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import mongoose from 'mongoose';
import Integration from '@/models/Integration';
import { decrypt } from '@/lib/utils/encryption';
import { encryptResponse } from '@/lib/utils/responseEncryption';
import { EmagApiService, EmagProductOffer, EmagProductOffersResponse } from '@/lib/services/emagApiService';

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

    // For count-only requests, make just the count API call and return
    if (countOnly) {
      // Get the total product offers count
      const productOffersCountResults = await emagApi.getProductOffersCount();
      
      // Check if there was an error getting the product offers count
      if (!productOffersCountResults) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Failed to fetch product offers count from eMAG API' 
          },
          { status: 500 }
        );
      }
      
      // Extract the count
      const totalProductOffersCount = productOffersCountResults.noOfItems 
        ? parseInt(productOffersCountResults.noOfItems, 10) 
        : 0;
      
      // Calculate total pages
      const totalPages = Math.ceil(totalProductOffersCount / pageSize);
      
      // Return just the count info
      return NextResponse.json({
        success: true,
        data: {
          totalCount: totalProductOffersCount,
          totalPages: totalPages,
          pageSize: pageSize
        }
      });
    }
    
    // For regular data requests, fetch the product offers directly
    // Fetch product offers for the specified page with retry logic
    let retryCount = 0;
    const maxRetries = 3;
    let success = false;
    let productOffersResponse: EmagProductOffersResponse | undefined;
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
        const apiRequestPromise = emagApi.getProductOffers({
          currentPage: page,
          itemsPerPage: pageSize
        });
        
        // Race the API request against the timeout
        productOffersResponse = await Promise.race([apiRequestPromise, timeoutPromise]) as EmagProductOffersResponse;
        
        // Cancel the timeout since we got a response
        if (timeoutId) clearTimeout(timeoutId);
        
        // Check if we got a valid response
        if (!productOffersResponse) {
          throw new Error('Empty response received from eMAG API from getProductOffers()');
        }
        
        // Check for errors in response
        if (productOffersResponse.isError) {
          const errMsg = productOffersResponse.messages.join(', ');
          console.log(`[API] Error in response: ${errMsg}`);
          
          // Check if it's a timeout or temporary error that we should retry
          if ((errMsg.includes('timeout') || 
               errMsg.includes('time-out') || 
               errMsg.includes('timing out') || 
               errMsg.includes('temporary')) && 
              retryCount < maxRetries - 1) {
            console.log(`[API] Temporary error detected, will retry (attempt ${retryCount + 1} of ${maxRetries})`);
            retryCount++;
            // Add a longer delay for timeout retries
            await new Promise(resolve => setTimeout(resolve, 5000 * retryCount));
            continue;
          }
          
          errorMessage = `Failed to fetch product offers: ${errMsg}`;
          throw new Error(errorMessage);
        }
        
        // Add integration ID to each product offer
        const productOffersWithIntegrationId = productOffersResponse.results.map((offer: EmagProductOffer) => ({
          ...offer,
          integrationId: id
        }));
        
        // Filter out any EOL products (status=2) that might have slipped through
        const filteredProductOffers = productOffersWithIntegrationId.filter(offer => offer.status !== 2);
        
        // Replace the results with our filtered offers
        productOffersResponse.results = filteredProductOffers;
        
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
        const errMsg = error.response?.data?.error || error.message || `Error fetching page ${page}`;
        return NextResponse.json(
          { 
            success: false, 
            error: errMsg
          },
          { status: 500 }
        );
      }
    }
    
    // If we didn't succeed after all retries
    if (!success || !productOffersResponse) {
      return NextResponse.json(
        { 
          success: false, 
          error: errorMessage || `Failed to fetch page ${page} after ${retryCount} retries` 
        },
        { status: 500 }
      );
    }

    // Get count information from the response if available
    // The noOfItems property is available in the response even though TypeScript doesn't see it
    // We'll use bracket notation to access it as a dynamic property
    const totalProductOffersCount = productOffersResponse && (productOffersResponse as any)['noOfItems'] 
      ? parseInt((productOffersResponse as any)['noOfItems'], 10) 
      : productOffersResponse.results.length;
    const totalPages = Math.ceil(totalProductOffersCount / pageSize);

    // Return success response with data for this page
    return NextResponse.json({
      success: true,
      data: {
        integrationId: id,
        productOffersData: encryptResponse(JSON.stringify({
          productOffers: productOffersResponse.results,
          productOffersCount: totalProductOffersCount,
          currentPage: page,
          totalPages: totalPages,
          totalCount: totalProductOffersCount
        })),
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Error fetching product offers:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'An unexpected error occurred while fetching product offers' 
      },
      { status: 500 }
    );
  }
} 