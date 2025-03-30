import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import ProductOffer from '@/models/ProductOffer';
import mongoose from 'mongoose';

/**
 * GET endpoint to fetch ALL product offers
 * No filtering, returns all documents from the ProductOffer collection
 */
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    // Fetch all product offers, no filtering
    const productOffers = await ProductOffer.find().sort({ created: -1 });

    return NextResponse.json({ success: true, data: { productOffers } });
  } catch (error: any) {
    console.error('Error fetching product offers:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch product offers' }, { status: 500 });
  }
}

/**
 * POST endpoint to store product offers
 * Required body: integrationId, productOffers
 * This endpoint completely replaces existing product offers for the integration with the newly fetched data.
 */
export async function POST(request: NextRequest) {
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
    
    // Delete all existing product offers for this integration
    console.log(`Deleting all existing product offers for integration ${integrationId}...`);
    const deleteResult = await ProductOffer.deleteMany({ integrationId });
    console.log(`Deleted ${deleteResult.deletedCount || 0} existing product offers`);
    
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
    
    // Insert all new product offers in one go
    const insertedDocs = await ProductOffer.insertMany(formattedProductOffers);
    
    console.log(`Inserted ${insertedDocs.length} product offers for integration ${integrationId}`);
    
    return NextResponse.json({
      success: true,
      data: {
        insertedCount: insertedDocs.length,
        totalProcessed: productOffers.length
      }
    });
  } catch (error: any) {
    console.error('Error storing product offers:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to store product offers' },
      { status: 500 }
    );
  }
} 