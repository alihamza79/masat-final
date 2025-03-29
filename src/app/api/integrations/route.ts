/**
 * API endpoints for managing integrations
 */
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { encrypt, decrypt } from '@/lib/utils/encryption';
import { encryptResponse } from '@/lib/utils/responseEncryption';
import { EmagApiService } from '@/lib/services/emagApiService';
import Integration from '@/models/Integration';
import mongoose from 'mongoose';

// GET - Retrieve all integrations
export async function GET() {
  try {
    await connectToDatabase();
    const integrations = await Integration.find({}, '-password');

    // Return encrypted response
    return NextResponse.json({
      success: true,
      data: {
        integrations: encryptResponse(JSON.stringify(integrations)),
        lastUpdated: new Date().toISOString()
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

// POST - Create a new integration
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { accountName, username, password, region, accountType } = body;

    // Validate required fields
    if (!accountName || !username || !password || !region || !accountType) {
      console.log('Missing required fields:', { accountName, username, password, region, accountType });
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Decode the base64 password
    const decodedPassword = Buffer.from(password, 'base64').toString();

    // Validate credentials with eMAG API
    const emagApi = new EmagApiService({ username, password: decodedPassword, region });
    const validationResult = await emagApi.validateCredentials();

    if (!validationResult.valid) {
      return NextResponse.json(
        { success: false, error: validationResult.error || 'Invalid credentials' },
        { status: 401 }
      );
    }

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

    // Create new integration
    const integration = new Integration({
      accountName,
      username,
      password: encrypt(decodedPassword),
      region,
      accountType
    });

    // Save to database
    await integration.save();

    // Return success response without sensitive data
    return NextResponse.json({
      success: true,
      integration: {
        _id: integration._id,
        accountName: integration.accountName,
        username: integration.username,
        region: integration.region,
        accountType: integration.accountType
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

// PUT - Update an existing integration
export async function PUT(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { _id, accountName, username, password, region, accountType } = body;

    // Validate required fields
    if (!_id || !accountName || !username || !region || !accountType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find the existing integration
    const existingIntegration = await Integration.findById(_id);
    if (!existingIntegration) {
      return NextResponse.json(
        { success: false, error: 'Integration not found' },
        { status: 404 }
      );
    }

    // Check for duplicate account name (excluding current integration)
    const duplicateAccountName = await Integration.findOne({
      _id: { $ne: _id },
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
      _id: { $ne: _id },
      username,
      region
    });
    
    if (duplicateUsernameAndRegion) {
      return NextResponse.json(
        { success: false, error: `An integration with this username and region already exists` },
        { status: 409 }
      );
    }

    // If password is provided, validate and encrypt
    let encryptedPassword = existingIntegration.password;
    if (password) {
      const decodedPassword = Buffer.from(password, 'base64').toString();
      
      // Validate credentials with eMAG API
      const emagApi = new EmagApiService({ username, password: decodedPassword, region });
      const validationResult = await emagApi.validateCredentials();

      if (!validationResult.valid) {
        return NextResponse.json(
          { success: false, error: validationResult.error || 'Invalid credentials' },
          { status: 401 }
        );
      }

      encryptedPassword = encrypt(decodedPassword);
    }

    // Update integration
    const updatedIntegration = await Integration.findByIdAndUpdate(
      _id,
      {
        accountName,
        username,
        password: encryptedPassword,
        region,
        accountType
      },
      { new: true, select: '-password' }
    );

    return NextResponse.json({
      success: true,
      integration: updatedIntegration
    });
  } catch (error: any) {
    console.error('Error updating integration:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// DELETE - Remove an integration
export async function DELETE(request: NextRequest) {
  try {
    // Get integration ID from URL
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Integration ID is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Delete the integration
    const result = await Integration.findByIdAndDelete(id);

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Integration not found' },
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