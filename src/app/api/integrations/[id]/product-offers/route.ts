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

    // First, get the total product offers count to calculate total pages
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
    
    // If there are no product offers, return an empty array (not an error)
    if (totalProductOffersCount === 0) {
      return NextResponse.json({
        success: true,
        data: {
          integrationId: id,
          productOffersData: encryptResponse(JSON.stringify({
            productOffers: [],
            productOffersCount: 0,
          })),
          lastUpdated: new Date().toISOString()
        }
      });
    }
    
    // Set items per page to match the eMAG API's actual limit
    const itemsPerPage = 100;
    
    // Calculate total pages (using ceiling function to ensure we get all product offers)
    const totalPages = Math.ceil(totalProductOffersCount / itemsPerPage);
    
    // Fetch all product offers using pagination
    let allProductOffers: EmagProductOffer[] = [];
    let hasError = false;
    let errorMessage = '';
    
    // Iterate through all pages
    for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
      // Fetch product offers for the current page
      
      let retryCount = 0;
      const maxRetries = 3;
      let success = false;
      let productOffersResponse: EmagProductOffersResponse;
      
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
          const apiRequestPromise = emagApi.getProductOffers({
            currentPage: currentPage,
            itemsPerPage: itemsPerPage
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
            const errorMsg = productOffersResponse.messages.join(', ');
            console.log(`[API] Error in response: ${errorMsg}`);
            
            // Check if it's a timeout or temporary error that we should retry
            if ((errorMsg.includes('timeout') || 
                 errorMsg.includes('time-out') || 
                 errorMsg.includes('timing out') || 
                 errorMsg.includes('temporary')) && 
                retryCount < maxRetries - 1) {
              console.log(`[API] Temporary error detected, will retry (attempt ${retryCount + 1} of ${maxRetries})`);
              retryCount++;
              // Add a longer delay for timeout retries
              await new Promise(resolve => setTimeout(resolve, 5000 * retryCount));
              continue;
            }
            
            hasError = true;
            errorMessage = `Failed to fetch product offers: ${errorMsg}`;
            break;
          }          
          // Add product offers from this page to our collection
          const productOffersWithIntegrationId = productOffersResponse.results.map((offer: EmagProductOffer) => ({
            ...offer,
            integrationId: id
          }));
          
          // Filter out any EOL products (status=2) that might have slipped through
          const filteredProductOffers = productOffersWithIntegrationId.filter(offer => offer.status !== 2);
          
          allProductOffers = [...allProductOffers, ...filteredProductOffers];
          
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
    
    // If no product offers were fetched despite the count indicating there should be some, return error
    if (allProductOffers.length === 0 && totalProductOffersCount > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch any product offers despite count indicating product offers exist' 
        },
        { status: 500 }
      );
    }

    // Return success response with data
    return NextResponse.json({
      success: true,
      data: {
        integrationId: id,
        productOffersData: encryptResponse(JSON.stringify({
          productOffers: allProductOffers,
          productOffersCount: allProductOffers.length,
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