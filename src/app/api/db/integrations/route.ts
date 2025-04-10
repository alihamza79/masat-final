export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Integration from '@/models/Integration';
import mongoose from 'mongoose';

/**
 * GET endpoint to fetch integration statuses
 * Can be used to fetch all integrations or a specific one by ID
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const integrationId = searchParams.get('integrationId');
    
    await connectToDatabase();
    
    if (integrationId) {
      // Validate ID format
      if (!mongoose.Types.ObjectId.isValid(integrationId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid integration ID format' },
          { status: 400 }
        );
      }
      
      // Fetch a specific integration
      const integration = await Integration.findById(integrationId).select({
        _id: 1,
        accountName: 1,
        importStatus: 1,
        importError: 1,
        lastOrdersImport: 1,
        lastProductOffersImport: 1,
        ordersCount: 1,
        productOffersCount: 1
      });
      
      if (!integration) {
        return NextResponse.json(
          { success: false, error: 'Integration not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        data: integration
      });
    } else {
      // Fetch all integrations
      const integrations = await Integration.find().select({
        _id: 1,
        accountName: 1,
        importStatus: 1,
        importError: 1,
        lastOrdersImport: 1,
        lastProductOffersImport: 1,
        ordersCount: 1,
        productOffersCount: 1
      });
      
      return NextResponse.json({
        success: true,
        data: integrations
      });
    }
  } catch (error: any) {
    console.error('Error fetching integration status:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch integration status' },
      { status: 500 }
    );
  }
}

/**
 * PUT endpoint to update integration status
 * Requires integrationId as query parameter
 */
export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const integrationId = searchParams.get('integrationId');
    
    if (!integrationId) {
      return NextResponse.json(
        { success: false, error: 'Integration ID is required' },
        { status: 400 }
      );
    }
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(integrationId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid integration ID format' },
        { status: 400 }
      );
    }
    
    // Get request body
    const body = await request.json();
    
    // Create update object with only the fields that are provided
    const updateData: any = {};
    
    if (body.status !== undefined) updateData.importStatus = body.status;
    // Explicitly set importError to null when empty string is provided to clear previous errors
    if (body.error !== undefined) updateData.importError = body.error === '' ? null : body.error;
    if (body.ordersCount !== undefined) updateData.ordersCount = body.ordersCount;
    if (body.productOffersCount !== undefined) updateData.productOffersCount = body.productOffersCount;
    if (body.lastOrdersImport !== undefined) updateData.lastOrdersImport = body.lastOrdersImport;
    if (body.lastProductOffersImport !== undefined) updateData.lastProductOffersImport = body.lastProductOffersImport;
    
    await connectToDatabase();
    
    // Find and update the integration
    const updatedIntegration = await Integration.findByIdAndUpdate(
      integrationId,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedIntegration) {
      return NextResponse.json(
        { success: false, error: 'Integration not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        _id: updatedIntegration._id,
        accountName: updatedIntegration.accountName,
        importStatus: updatedIntegration.importStatus,
        importError: updatedIntegration.importError,
        lastOrdersImport: updatedIntegration.lastOrdersImport,
        lastProductOffersImport: updatedIntegration.lastProductOffersImport,
        ordersCount: updatedIntegration.ordersCount,
        productOffersCount: updatedIntegration.productOffersCount
      }
    });
  } catch (error: any) {
    console.error('Error updating integration status:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update integration status' },
      { status: 500 }
    );
  }
} 