import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Integration from '@/models/Integration';
import mongoose from 'mongoose';
import { decrypt } from '@/lib/utils/encryption';
import { EmagApiService } from '@/lib/services/emagApiService';

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

    // Get order count - no parameters to get all orders count
    const orderCount = await emagApi.getOrderCount();

    // Return success response with data
    return NextResponse.json({
      success: true,
      data: {
        integrationId: id,
        orderCount,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Error fetching order count:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'An unexpected error occurred' 
      },
      { status: 500 }
    );
  }
} 