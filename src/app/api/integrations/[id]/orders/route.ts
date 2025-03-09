import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Integration from '@/models/Integration';
import mongoose from 'mongoose';
import { decrypt } from '@/lib/utils/encryption';
import { encryptResponse } from '@/lib/utils/responseEncryption';
import { EmagApiService, EmagOrder } from '@/lib/services/emagApiService';

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
    
    // Set items per page (maximum allowed by the API is 100)
    const itemsPerPage = 1000;
    
    // Calculate total pages (using ceiling function to ensure we get all orders)
    const totalPages = Math.ceil(totalOrderCount / itemsPerPage);
    
    // Fetch all orders using pagination
    let allOrders: EmagOrder[] = [];
    let hasError = false;
    let errorMessage = '';
    
    // Iterate through all pages
    for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
      // Fetch orders for the current page
      const ordersResponse = await emagApi.getOrders({
        currentPage: currentPage,
        itemsPerPage: itemsPerPage
      });

      // Check for errors in response
      if (ordersResponse.isError) {
        hasError = true;
        errorMessage = `Failed to fetch orders: ${ordersResponse.messages.join(', ')}`;
        break;
      }

      // Add orders from this page to our collection
      const ordersWithIntegrationId = ordersResponse.results.map(order => ({
        ...order,
        integrationId: id
      }));
      
      allOrders = [...allOrders, ...ordersWithIntegrationId];
      
      // If there are no results or we've reached the end, break the loop
      if (!ordersResponse.results.length) {
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