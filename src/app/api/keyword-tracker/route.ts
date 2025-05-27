import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import KeywordTrackedProduct, { IKeywordTrackedProduct } from '@/models/KeywordTrackedProduct';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic'; // Disable caching for this route

/**
 * GET endpoint to fetch tracked products or a specific tracked product
 */
export async function GET(request: NextRequest) {
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
    
    const userId = new mongoose.Types.ObjectId(session.user.id);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    await connectToDatabase();
    
    if (id) {
      // Fetch a specific tracked product
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json(
          { success: false, error: 'Invalid tracked product ID format' },
          { status: 400 }
        );
      }
      
      const trackedProduct = await KeywordTrackedProduct.findOne({ 
        _id: new mongoose.Types.ObjectId(id), 
        userId 
      });
      
      if (!trackedProduct) {
        return NextResponse.json(
          { success: false, error: 'Tracked product not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        data: { trackedProduct }
      });
    } else {
      // Fetch all tracked products for this user
      const trackedProducts = await KeywordTrackedProduct.find({ userId }).sort({ createdAt: -1 });
      
      return NextResponse.json({
        success: true,
        data: { trackedProducts }
      });
    }
  } catch (error: any) {
    console.error('Error fetching tracked products:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint to create a new tracked product
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
    
    const userId = new mongoose.Types.ObjectId(session.user.id);
    const body = await request.json();
    const { 
      productId, 
      productName, 
      productImage, 
      productSKU, 
      productPNK, 
      keywords 
    } = body;
    
    // Validate required fields
    if (!productId || typeof productId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Valid product ID is required' },
        { status: 400 }
      );
    }
    
    if (!productName || typeof productName !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Product name is required' },
        { status: 400 }
      );
    }
    
    if (!Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one keyword is required' },
        { status: 400 }
      );
    }
    
    // Validate keywords array
    const validKeywords = keywords.filter(keyword => 
      typeof keyword === 'string' && keyword.trim().length > 0
    ).map(keyword => keyword.trim());
    
    if (validKeywords.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one valid keyword is required' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Check if this product is already being tracked by this user
    const existingTracking = await KeywordTrackedProduct.findOne({ 
      userId, 
      productId 
    });
    
    if (existingTracking) {
      return NextResponse.json(
        { success: false, error: 'This product is already being tracked' },
        { status: 409 }
      );
    }
    
    // Create new tracked product
    const trackedProduct = new KeywordTrackedProduct({
      userId,
      productId,
      productName,
      productImage: productImage || null,
      productSKU: productSKU || null,
      productPNK: productPNK || null,
      keywords: validKeywords,
      organicTop10: 0,
      organicTop50: 0,
      sponsoredTop10: 0,
      sponsoredTop50: 0
    });
    
    await trackedProduct.save();
    
    return NextResponse.json({
      success: true,
      data: { trackedProduct }
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Error creating tracked product:', error);
    
    // Handle duplicate key error (shouldn't happen due to our pre-check, but just in case)
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'This product is already being tracked' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * PUT endpoint to update an existing tracked product
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
    
    const userId = new mongoose.Types.ObjectId(session.user.id);
    const body = await request.json();
    const { id, keywords } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Tracked product ID is required' },
        { status: 400 }
      );
    }
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid tracked product ID format' },
        { status: 400 }
      );
    }
    
    if (!Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one keyword is required' },
        { status: 400 }
      );
    }
    
    // Validate keywords array
    const validKeywords = keywords.filter(keyword => 
      typeof keyword === 'string' && keyword.trim().length > 0
    ).map(keyword => keyword.trim());
    
    if (validKeywords.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one valid keyword is required' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Find and update the tracked product
    const trackedProduct = await KeywordTrackedProduct.findOneAndUpdate(
      { 
        _id: new mongoose.Types.ObjectId(id), 
        userId 
      },
      { 
        keywords: validKeywords,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!trackedProduct) {
      return NextResponse.json(
        { success: false, error: 'Tracked product not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: { trackedProduct }
    });
    
  } catch (error: any) {
    console.error('Error updating tracked product:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * DELETE endpoint to delete a tracked product
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
    
    const userId = new mongoose.Types.ObjectId(session.user.id);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Tracked product ID is required' },
        { status: 400 }
      );
    }
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid tracked product ID format' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Find and delete the tracked product
    const deletedTrackedProduct = await KeywordTrackedProduct.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(id),
      userId
    });
    
    if (!deletedTrackedProduct) {
      return NextResponse.json(
        { success: false, error: 'Tracked product not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: { message: 'Tracked product deleted successfully' }
    });
    
  } catch (error: any) {
    console.error('Error deleting tracked product:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 