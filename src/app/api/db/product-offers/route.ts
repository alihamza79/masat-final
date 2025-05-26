export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import ProductOffer from '@/models/ProductOffer';
import Integration from '@/models/Integration';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

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
    const search = url.searchParams.get('search');
    
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
      .sort({ updatedAt: -1 })
      .populate('integrationId', 'name type platformId shopId');
    
    console.log(`Fetched all ${productOffers.length} product offers for the user`);

    return NextResponse.json({ 
      success: true, 
      data: { 
        productOffers,
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
      // Use explicit field mapping to ensure all fields are saved
      return {
        // Required fields
        integrationId,
        emagProductOfferId: id,
        status: offer.status || 0,
        sale_price: offer.sale_price || 0,
        recommended_price: offer.recommended_price || 0,
        general_stock: offer.general_stock || 0,
        estimated_stock: offer.estimated_stock || 0,
        characteristics: offer.characteristics || [],
        warranty: offer.warranty || 0,
        
        // Explicitly mapped fields from the eMAG API
        attachments: offer.attachments || [],
        auto_translated: offer.auto_translated || 0,
        availability: offer.availability || [],
        barcode: offer.barcode || [],
        best_offer_recommended_price: offer.best_offer_recommended_price || 0,
        best_offer_sale_price: offer.best_offer_sale_price || 0,
        brand: offer.brand || null,
        brand_name: offer.brand_name || null,
        buy_button_rank: offer.buy_button_rank || 0,
        category_id: offer.category_id || 0,
        commission: offer.commission !== undefined ? offer.commission : null,
        content_details: offer.content_details || null,
        currency: offer.currency || null,
        currency_type: offer.currency_type || null,
        description: offer.description || null,
        ean: offer.ean || [],
        eu_representative: offer.eu_representative || false,
        family: offer.family || null,
        genius_eligibility: offer.genius_eligibility || 0,
        genius_eligibility_type: offer.genius_eligibility_type || 0,
        handling_time: offer.handling_time || [],
        has_smart_deals_badge: offer.has_smart_deals_badge || false,
        id: id, // Store the original ID as well
        images: offer.images || [],
        manufacturer: offer.manufacturer || false,
        max_sale_price: offer.max_sale_price || 0,
        min_sale_price: offer.min_sale_price || 0,
        name: offer.name || null,
        number_of_offers: offer.number_of_offers || 0,
        offer_details: offer.offer_details || null,
        offer_price_other_currency: offer.offer_price_other_currency || null,
        offer_properties: offer.offer_properties || [],
        offer_validation_status: offer.offer_validation_status || null,
        ownership: offer.ownership || false,
        part_number: offer.part_number || null,
        part_number_key: offer.part_number_key || null,
        recycleWarranties: offer.recycleWarranties || 0,
        rrp_guidelines: offer.rrp_guidelines || null,
        safety_information: offer.safety_information || null,
        start_date: offer.start_date || [],
        start_date_other_currency: offer.start_date_other_currency || [],
        stock: offer.stock || [],
        translation_validation_status: offer.translation_validation_status || [],
        url: offer.url || null,
        validation_status: offer.validation_status || [],
        vat_id: offer.vat_id || 0,
        vendor_category_id: offer.vendor_category_id || null
      };
    });
    
    // Add debug logging for a sample product offer
    if (formattedProductOffers.length > 0) {
      console.log('Sample formatted product offer:', JSON.stringify(formattedProductOffers[0], null, 2));
    }
    
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