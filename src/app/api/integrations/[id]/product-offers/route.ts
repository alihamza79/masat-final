import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import mongoose from 'mongoose';
import Integration from '@/models/Integration';
import { decrypt } from '@/lib/utils/encryption';
import { encryptResponse } from '@/lib/utils/responseEncryption';
import { EmagApiService, EmagProductOffer } from '@/lib/services/emagApiService';

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
    
    // Set items per page (maximum allowed by the API is 100)
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
      const productOffersResponse = await emagApi.getProductOffers({
        currentPage: currentPage,
        itemsPerPage: itemsPerPage
      });

      // Check for errors in response
      if (productOffersResponse.isError) {
        hasError = true;
        errorMessage = `Failed to fetch product offers: ${productOffersResponse.messages.join(', ')}`;
        break;
      }

      // Add product offers from this page to our collection
      const productOffersWithIntegrationId = productOffersResponse.results.map(offer => ({
        ...offer,
        integrationId: id
      }));
      
      allProductOffers = [...allProductOffers, ...productOffersWithIntegrationId];
      
      // If there are no results or we've reached the end, break the loop
      if (!productOffersResponse.results.length) {
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