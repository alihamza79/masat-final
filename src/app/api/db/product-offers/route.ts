import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import ProductOffer from '@/models/ProductOffer';
import mongoose from 'mongoose';

/**
 * GET endpoint to fetch product offers with pagination
 * Required query parameters: integrationId
 * Optional query parameters: page, pageSize, search
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const integrationId = searchParams.get('integrationId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '100', 10);
    const search = searchParams.get('search') || '';
    
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
    
    await connectToDatabase();
    
    // Create base query
    const query: any = { integrationId };
    
    // Add search conditions if search parameter is provided
    if (search) {
      // Use the text index for search if possible, otherwise use regex
      query.$text = { $search: search };
    }
    
    // Get total count for pagination
    const totalCount = await ProductOffer.countDocuments(query);
    const totalPages = Math.ceil(totalCount / pageSize);
    
    // Validate page parameter
    if (page < 1 || (totalCount > 0 && page > totalPages)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid page number. Valid range is 1-${totalPages || 1}` 
        },
        { status: 400 }
      );
    }
    
    // Prepare aggregation pipeline
    const pipeline: any[] = [
      { $match: query },
      { $sort: { id: 1 } } // Sort by ID
    ];
    
    // If text search is being used, add score sorting
    if (search && query.$text) {
      pipeline.unshift({ $addFields: { score: { $meta: "textScore" } } });
      pipeline[1].$sort = { score: { $meta: "textScore" } };
    }
    
    // Add pagination
    pipeline.push(
      { $skip: (page - 1) * pageSize },
      { $limit: pageSize }
    );
    
    // Execute aggregation
    const productOffers = await ProductOffer.aggregate(pipeline);
    
    return NextResponse.json({
      success: true,
      data: {
        productOffers,
        totalCount,
        totalPages,
        currentPage: page,
        pageSize
      }
    });
  } catch (error: any) {
    console.error('Error fetching product offers:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch product offers' },
      { status: 500 }
    );
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