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
    const { username, password, region, integrationId, accountName, accountType } = await request.json();
    
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
      
      // Check for existing account name (must be unique regardless of region)
      const existingAccountName = await Integration.findOne({ accountName });
      if (existingAccountName) {
        return NextResponse.json(
          { success: false, error: `An integration with this account name already exists` },
          { status: 409 }
        );
      }
      
      // Check for existing username AND region combination
      const existingUsernameAndRegion = await Integration.findOne({ 
        username, 
        region 
      });
      
      if (existingUsernameAndRegion) {
        return NextResponse.json(
          { success: false, error: `An integration with this username and region already exists` },
          { status: 409 }
        );
      }
    }
    // Check for duplicates when updating existing integration
    else if (accountName && integrationId) {
      await connectToDatabase();
      
      // Check for duplicate account name (excluding current integration)
      const duplicateAccountName = await Integration.findOne({
        _id: { $ne: integrationId },
        accountName
      });
      
      if (duplicateAccountName) {
        return NextResponse.json(
          { success: false, error: `An integration with this account name already exists` },
          { status: 409 }
        );
      }
      
      // Check for duplicate username AND region combination (excluding current integration)
      const duplicateUsernameAndRegion = await Integration.findOne({
        _id: { $ne: integrationId },
        username,
        region
      });
      
      if (duplicateUsernameAndRegion) {
        return NextResponse.json(
          { success: false, error: `An integration with this username and region already exists` },
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