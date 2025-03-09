/**
 * API endpoint to validate eMAG integration credentials
 */
import { NextRequest, NextResponse } from 'next/server';
import { EmagApiService } from '@/lib/services/emagApiService';
import { connectToDatabase } from '@/lib/db/mongodb';
import { decrypt } from '@/lib/utils/encryption';
import Integration from '@/models/Integration';

export async function POST(request: NextRequest) {
  try {
    const { username, password, region, integrationId, accountName } = await request.json();
    
    if (!username || !region) {
      return NextResponse.json(
        { success: false, error: 'Username and region are required' },
        { status: 400 }
      );
    }

    let validationPassword = '';

    // If integrationId is provided, get the password from the database
    if (integrationId) {
      await connectToDatabase();
      
      // Find the integration using Mongoose
      const integration = await Integration.findById(integrationId);
      
      if (!integration) {
        return NextResponse.json(
          { success: false, error: 'Integration not found' },
          { status: 404 }
        );
      }

      validationPassword = decrypt(integration.password);
    } else if (password) {
      // Decode the base64 password
      validationPassword = Buffer.from(password, 'base64').toString();
    }

    // Check for duplicates when creating new integration
    if (accountName && !integrationId) {
      await connectToDatabase();
      
      // Check for existing account name or username
      const existingIntegration = await Integration.findOne({
        $or: [{ accountName }, { username }]
      });
      
      if (existingIntegration) {
        const field = existingIntegration.accountName === accountName ? 'account name' : 'username';
        return NextResponse.json(
          { success: false, error: `An integration with this ${field} already exists` },
          { status: 409 }
        );
      }
    }
    // Check for duplicates when updating existing integration
    else if (accountName && integrationId) {
      await connectToDatabase();
      
      // Check for duplicates excluding the current integration
      const duplicate = await Integration.findOne({
        _id: { $ne: integrationId },
        $or: [{ accountName }, { username }]
      });
      
      if (duplicate) {
        const field = duplicate.accountName === accountName ? 'account name' : 'username';
        return NextResponse.json(
          { success: false, error: `An integration with this ${field} already exists` },
          { status: 409 }
        );
      }
    }

    // Create eMAG API service instance
    const emagApi = new EmagApiService({ 
      username, 
      password: validationPassword, 
      region 
    });

    // Validate credentials
    const validationResult = await emagApi.validateCredentials();

    if (validationResult.valid) {
      return NextResponse.json({
        success: true,
        orderCount: validationResult.orderCount
      });
    } else {
      return NextResponse.json(
        { success: false, error: validationResult.error },
        { status: 401 }
      );
    }
  } catch (error: any) {
    console.error('Error validating eMAG credentials:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 