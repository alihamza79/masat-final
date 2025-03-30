import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Integration from '@/models/Integration';
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
      
      // Return the raw response from eMAG with the same status code
      return NextResponse.json({
        emagResponse: response.data,
        status: response.status,
        statusText: response.statusText,
        productOfferId: productOfferId
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