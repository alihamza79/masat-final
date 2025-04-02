import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Integration from '@/models/Integration';
import ProductOffer from '@/models/ProductOffer';
import { decrypt } from '@/lib/utils/encryption';
import axios from 'axios';

// Define CORS headers as a regular constant (not exported)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * API route to get eMAG commission estimates by product offer ID
 * This proxies requests to eMAG's API endpoint using authenticated credentials
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  // Note: param is still called categoryId in the URL for backward compatibility,
  // but it should actually be the eMAG product offer ID
  const productOfferId = params.categoryId;
  
  try {
    if (!productOfferId) {
      return NextResponse.json(
        { error: 'Product offer ID is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Connect to the database
    await connectToDatabase();

    // First, check if we already have the commission saved in the database
    const existingProduct = await ProductOffer.findOne({ emagProductOfferId: parseInt(productOfferId) });
    
    // If the product already has a commission value, return it without making an API call
    if (existingProduct && existingProduct.commission !== undefined && existingProduct.commission !== null) {
      return NextResponse.json({
        emagResponse: {
          code: 200,
          data: {
            value: existingProduct.commission
          }
        },
        status: 200,
        statusText: "OK",
        productOfferId: productOfferId,
        fromCache: true
      }, { 
        status: 200, 
        headers: corsHeaders 
      });
    }

    // Find the first active integration to use for authentication
    const integration = await Integration.findOne({});
    
    if (!integration) {
      return NextResponse.json({ 
        error: 'No integration found to authenticate with eMAG API'
      }, { status: 500, headers: corsHeaders });
    }

    // Decrypt the password
    let decryptedPassword;
    try {
      decryptedPassword = decrypt(integration.password);
    } catch (error) {
      return NextResponse.json({ 
        error: 'Error decrypting integration password'
      }, { status: 500, headers: corsHeaders });
    }

    // Create auth header
    const authHeader = `Basic ${Buffer.from(`${integration.username}:${decryptedPassword}`).toString('base64')}`;
    
    // Use the verified working URL format with product offer ID
    const apiUrl = `https://marketplace.emag.ro/api/v1/commission/estimate/${productOfferId}`;
    
    try {
      // Make the API call
      const response = await axios.get(apiUrl, {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 8000,
        validateStatus: () => true // Accept any status code to pass through
      });
      
      // If the API call was successful and returned a commission value, save it to the database
      if (response.status === 200 && 
          response.data && 
          response.data.code === 200 && 
          response.data.data && 
          response.data.data.value !== undefined) {
        
        // Extract commission value
        let commissionValue;
        if (typeof response.data.data.value === 'string') {
          commissionValue = parseFloat(response.data.data.value);
        } else {
          commissionValue = Number(response.data.data.value);
        }
        
        // Convert to percentage if needed
        const commissionPercentage = commissionValue > 1 ? commissionValue : commissionValue * 100;
        
        // Find and update the product in the database with the commission value
        if (existingProduct) {
          await ProductOffer.updateOne(
            { emagProductOfferId: parseInt(productOfferId) },
            { $set: { commission: commissionPercentage } }
          );
        }
      }
      
      // Return the raw response from eMAG with the same status code
      return NextResponse.json({
        emagResponse: response.data,
        status: response.status,
        statusText: response.statusText,
        productOfferId: productOfferId,
        fromCache: false
      }, { 
        status: response.status, 
        headers: corsHeaders 
      });
      
    } catch (error: any) {
      // Return the error information
      return NextResponse.json({
        error: error.message,
        productOfferId: productOfferId,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      }, { 
        status: error.response?.status || 500, 
        headers: corsHeaders 
      });
    }

  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message
    }, { status: 500, headers: corsHeaders });
  }
} 