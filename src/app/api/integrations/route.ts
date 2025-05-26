/**
 * API endpoints for managing integrations
 */
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { encrypt, decrypt } from '@/lib/utils/encryption';
import { encryptResponse } from '@/lib/utils/responseEncryption';
import { EmagApiService } from '@/lib/services/emagApiService';
import Integration, { IIntegration } from '@/models/Integration';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

/**
 * GET endpoint to fetch integrations for the current user
 */
export async function GET() {
  try {
    // Get the user's session
    const session = await getServerSession(authOptions);
    
    // Check if the user is authenticated
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    await connectToDatabase();
    
    // Find all integrations for this user
    const integrations = await Integration.find({ userId });
    
    // Map integrations to remove sensitive data
    const mappedIntegrations = integrations.map(integration => {
      // Convert Mongoose document to plain object
      const integrationObj = integration.toObject();
      
      // Don't return the actual password in the response
      delete integrationObj.password;
      
      return integrationObj;
    });
    
    // Encrypt the integrations array
    const encryptedData = encryptResponse(JSON.stringify(mappedIntegrations));
    
    return NextResponse.json({
      success: true,
      data: {
        integrations: encryptedData
      }
    });
  } catch (error: any) {
    console.error('Error fetching integrations:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint to create a new integration
 * Required body: accountName, username, password, region
 */
export async function POST(request: NextRequest) {
  try {
    // Get the user's session
    const session = await getServerSession(authOptions);
    
    // Check if the user is authenticated
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const body = await request.json();
    const { accountName, username, password, region, accountType } = body;
    
    // Validate required fields
    if (!accountName || !username || !password || !region) {
      return NextResponse.json(
        { success: false, error: 'All fields (accountName, username, password, region) are required' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Check for existing account name for this user (must be unique per user)
    const existingAccountName = await Integration.findOne({ 
      userId,
      accountName 
    });
    
    if (existingAccountName) {
      return NextResponse.json(
        { success: false, error: 'An integration with this account name already exists for your account' },
        { status: 409 }
      );
    }
    
    // Check for existing username AND region combination for this user
    const existingUsernameAndRegion = await Integration.findOne({ 
      userId,
      username, 
      region 
    });
    
    if (existingUsernameAndRegion) {
      return NextResponse.json(
        { success: false, error: 'An integration with this username and region already exists for your account' },
        { status: 409 }
      );
    }
    
    // Decode the base64 password from the client
    const decodedPassword = Buffer.from(password, 'base64').toString();
    
    // Create eMAG API service with provided credentials
    const emagApi = new EmagApiService({
      username,
      password: decodedPassword,
      region
    });
    
    // Validate credentials with eMAG API
    const validationResult = await emagApi.validateCredentials();
    if (!validationResult.valid) {
      return NextResponse.json(
        { success: false, error: validationResult.error || 'Invalid eMAG credentials' },
        { status: 401 }
      );
    }
    
    // Create a new integration with encrypted password
    const newIntegration = new Integration({
      userId,
      accountName,
      username,
      password: encrypt(decodedPassword),
      region,
      accountType: accountType || 'Non-FBE',
      ordersCount: 0,
      productOffersCount: 0,
      lastOrdersImport: null,
      lastProductOffersImport: null,
      importStatus: 'idle'
    });
    
    await newIntegration.save();
    
    return NextResponse.json({
      success: true,
      integration: {
        _id: newIntegration._id,
        userId: newIntegration.userId,
        accountName: newIntegration.accountName,
        username: newIntegration.username,
        region: newIntegration.region,
        accountType: newIntegration.accountType,
        importStatus: newIntegration.importStatus,
        ordersCount: newIntegration.ordersCount,
        productOffersCount: newIntegration.productOffersCount,
        lastOrdersImport: newIntegration.lastOrdersImport,
        lastProductOffersImport: newIntegration.lastProductOffersImport
      }
    });
  } catch (error: any) {
    console.error('Error creating integration:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * PUT endpoint to update an existing integration
 * Required body: _id, accountName (and optionally password if it needs to be updated)
 */
export async function PUT(request: NextRequest) {
  try {
    // Get the user's session
    const session = await getServerSession(authOptions);
    
    // Check if the user is authenticated
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const body = await request.json();
    const { _id, accountName, password } = body;
    
    if (!_id || !accountName) {
      return NextResponse.json(
        { success: false, error: 'Integration ID and account name are required' },
        { status: 400 }
      );
    }
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid integration ID format' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Find the integration and ensure it belongs to the current user
    const integration = await Integration.findOne({ _id, userId });
    
    if (!integration) {
      return NextResponse.json(
        { success: false, error: 'Integration not found or you do not have permission to update it' },
        { status: 404 }
      );
    }
    
    // Check for duplicate account name (excluding current integration)
    const duplicateAccountName = await Integration.findOne({
      _id: { $ne: _id },
      userId,
      accountName
    });
    
    if (duplicateAccountName) {
      return NextResponse.json(
        { success: false, error: 'An integration with this account name already exists for your account' },
        { status: 409 }
      );
    }
    
    // Update fields
    integration.accountName = accountName;
    
    // Only update password if provided
    if (password) {
      // Decode the base64 password
      const decodedPassword = Buffer.from(password, 'base64').toString();
      
      // Validate the new password with eMAG API
      const emagApi = new EmagApiService({
        username: integration.username,
        password: decodedPassword,
        region: integration.region
      });
      
      const validationResult = await emagApi.validateCredentials();
      if (!validationResult.valid) {
        return NextResponse.json(
          { success: false, error: validationResult.error || 'Invalid eMAG credentials' },
          { status: 401 }
        );
      }
      
      // Update password with encrypted version
      integration.password = encrypt(decodedPassword);
    }
    
    // Save changes
    await integration.save();
    
    return NextResponse.json({
      success: true,
      integration: {
        _id: integration._id,
        userId: integration.userId,
        accountName: integration.accountName,
        username: integration.username,
        region: integration.region,
        accountType: integration.accountType,
        importStatus: integration.importStatus,
        ordersCount: integration.ordersCount,
        productOffersCount: integration.productOffersCount,
        lastOrdersImport: integration.lastOrdersImport,
        lastProductOffersImport: integration.lastProductOffersImport
      }
    });
  } catch (error: any) {
    console.error('Error updating integration:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * DELETE endpoint to remove an integration
 * Required query parameter: id
 */
export async function DELETE(request: NextRequest) {
  try {
    // Get the user's session
    const session = await getServerSession(authOptions);
    
    // Check if the user is authenticated
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Get integration ID from query parameters
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Integration ID is required' },
        { status: 400 }
      );
    }
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid integration ID format' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Find and delete integration, ensuring it belongs to the current user
    const result = await Integration.findOneAndDelete({ _id: id, userId });
    
    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Integration not found or you do not have permission to delete it' },
        { status: 404 }
      );
    }

    // Also delete associated orders and product offers
    // Import the models
    const Order = mongoose.models.Order;
    const ProductOffer = mongoose.models.ProductOffer;
    
    if (Order) {
      await Order.deleteMany({ integrationId: id });
    }
    
    if (ProductOffer) {
      await ProductOffer.deleteMany({ integrationId: id });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting integration:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 