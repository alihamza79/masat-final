export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import ProductOffer from '@/models/ProductOffer';
import Integration from '@/models/Integration';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';

/**
 * GET endpoint to fetch product offers for the current user's integrations
 * Filters by the current user's integration IDs
 */
export async function GET(request: NextRequest) {
  try {
    // Get the user's session
    const session = await getServerSession(authOptions);
    
    // DEBUGGING - Log session details
    console.log('Session in product-offers API:', JSON.stringify({
      exists: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id || 'none',
      userEmail: session?.user?.email || 'none'
    }));
    
    // Check if the user is authenticated
    if (!session || !session.user || !session.user.id) {
      console.log('Authentication failed - missing session or user ID');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    await connectToDatabase();

    // Parse query params for filtering
    const url = new URL(request.url);
    const integrationId = url.searchParams.get('integrationId');
    const pageStr = url.searchParams.get('page');
    const pageSizeStr = url.searchParams.get('pageSize');
    const search = url.searchParams.get('search');
    
    // Default pagination values
    const page = pageStr ? parseInt(pageStr, 10) : 1;
    const pageSize = pageSizeStr ? parseInt(pageSizeStr, 10) : 100;
    const skip = (page - 1) * pageSize;
    
    // Build query object
    let query: any = {};
    
    if (integrationId) {
      // If specific integrationId is provided, use it
      if (!mongoose.Types.ObjectId.isValid(integrationId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid integration ID format' },
          { status: 400 }
        );
      }
      query.integrationId = integrationId;
    } else {
      // Otherwise, get all integrations for the current user
      const userIntegrations = await Integration.find({ userId });
      
      if (!userIntegrations || userIntegrations.length === 0) {
        // User has no integrations, return empty array
        console.log(`No integrations found for user ${userId}`);
        return NextResponse.json({ 
          success: true, 
          data: { 
            productOffers: [],
            count: 0,
            message: 'No integrations found for user' 
          } 
        });
      }
      
      // Extract the integration IDs
      const integrationIds = userIntegrations.map(integration => integration._id);
      console.log(`Found ${integrationIds.length} integrations for user ${userId}`);
      
      // Add integrationIds to query
      query.integrationId = { $in: integrationIds };
    }
    
    // Add text search if provided
    if (search) {
      query.$text = { $search: search };
    }
    
    console.log('Product offers query:', JSON.stringify(query));
    
    // Fetch product offers that belong to the user's integrations
    const productOffers = await ProductOffer.find(query)
      .limit(pageSize)
      .skip(skip)
      .sort({ updatedAt: -1 })
      .populate('integrationId', 'name type platformId shopId');
    
    // Count total documents for pagination
    const totalCount = await ProductOffer.countDocuments(query);
    const totalPages = Math.ceil(totalCount / pageSize);
    
    console.log(`Found ${productOffers.length} product offers out of ${totalCount} total`);

    return NextResponse.json({ 
      success: true, 
      data: { 
        productOffers,
        count: productOffers.length,
        totalCount,
        totalPages,
        page,
        pageSize
      } 
    });
  } catch (error: any) {
    console.error('Error fetching product offers:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to fetch product offers' 
    }, { status: 500 });
  }
}

/**
 * POST endpoint to store product offers
 * Required body: integrationId, productOffers
 * This endpoint completely replaces existing product offers for the integration with the newly fetched data.
 * Uses MongoDB transactions for atomicity - either all operations succeed or none do.
 */
export async function POST(request: NextRequest) {
  // We'll need this to track the session for cleanup in finally block
  let session = null;
  
  try {
    const body = await request.json();
    const { integrationId, productOffers } = body;
    
    if (!integrationId) {
      return NextResponse.json(
        { success: false, error: 'Integration ID is required' },
        { status: 400 }
      );
    }
    
    if (!productOffers || !Array.isArray(productOffers)) {
      return NextResponse.json(
        { success: false, error: 'Product offers must be provided as an array' },
        { status: 400 }
      );
    }
    
    // Validate integrationId format
    if (!mongoose.Types.ObjectId.isValid(integrationId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid integration ID format' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Map the product offers; for each offer, remove the 'id' field and set 'emagProductOfferId' to that value,
    // and include integrationId
    const formattedProductOffers = productOffers.map(offer => {
      const { id, ...offerData } = offer;
      return {
        ...offerData,
        integrationId,
        emagProductOfferId: id
      };
    });
    
    // Start a MongoDB session and transaction
    session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Delete all existing product offers for this integration within the transaction
      console.log(`Deleting all existing product offers for integration ${integrationId} in transaction...`);
      const deleteResult = await ProductOffer.deleteMany(
        { integrationId }, 
        { session }
      );
      console.log(`Deleted ${deleteResult.deletedCount || 0} existing product offers`);
      
      // Insert all new product offers in one go within the same transaction
      const insertedDocs = await ProductOffer.insertMany(
        formattedProductOffers,
        { session }
      );
      
      console.log(`Inserted ${insertedDocs.length} product offers for integration ${integrationId}`);
      
      // Commit the transaction if both operations succeeded
      await session.commitTransaction();
      console.log(`Transaction committed successfully for integration ${integrationId}`);
      
      return NextResponse.json({
        success: true,
        data: {
          results: {
            deletedCount: deleteResult.deletedCount,
            insertedCount: insertedDocs.length
          },
          totalProcessed: productOffers.length
        }
      });
    } catch (transactionError) {
      // If any operation fails, abort the transaction to roll back all changes
      await session.abortTransaction();
      console.error(`Transaction aborted for integration ${integrationId}:`, transactionError);
      throw transactionError; // Re-throw to be caught by outer catch block
    }
  } catch (error: any) {
    console.error('Error storing product offers:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to store products offers' },
      { status: 500 }
    );
  } finally {
    // Always end the session, even if there was an error
    if (session) {
      session.endSession();
    }
  }
} 