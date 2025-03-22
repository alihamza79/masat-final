import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import SavedCalculation from '@/app/models/SavedCalculation';
import { uploadFileToS3, generatePresignedUrl } from '@/utils/s3';

// Set export configuration for Next.js
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET handler to retrieve all saved calculations
export async function GET() {
  try {
    await connectDB();
    const calculations = await SavedCalculation.find({}).sort({ createdAt: -1 });
    
    // Generate fresh presigned URLs for images
    const calculationsWithPresignedUrls = await Promise.all(
      calculations.map(async (calculation) => {
        const calcObj = calculation.toObject();
        
        // Only generate presigned URL if the image is from S3 (starts with 'products/')
        if (calcObj.image && calcObj.image.startsWith('products/')) {
          try {
            // Generate a fresh presigned URL for the image
            calcObj.image = await generatePresignedUrl(calcObj.image);
          } catch (urlError) {
            console.error('Error generating presigned URL:', urlError);
            // Keep the original image path if URL generation fails
          }
        }
        
        return calcObj;
      })
    );
    
    return NextResponse.json({ success: true, data: calculationsWithPresignedUrls });
  } catch (error) {
    console.error('Error fetching calculations:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch calculations' },
      { status: 500 }
    );
  }
}

// POST handler to save a new calculation
export async function POST(request: NextRequest) {
  try {
    // Get FormData from the request
    const formData = await request.formData();
    
    // Extract values from formData
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const calculatorStateJson = formData.get('calculatorState') as string;
    const imageFile = formData.get('image') as File | null;
    
    // Parse calculatorState from JSON string
    const calculatorState = JSON.parse(calculatorStateJson);
    
    // Get emagProduct if it exists
    const emagProductJson = formData.get('emagProduct') as string | null;
    const emagProduct = emagProductJson ? JSON.parse(emagProductJson) : null;

    // Validate based on calculation type
    if (emagProduct) {
      // For eMAG products, we need the emagProduct data and calculatorState
      if (!emagProduct.productId || !emagProduct.integrationId || !calculatorState) {
        return NextResponse.json(
          { success: false, message: 'eMAG product ID, integration ID, and calculator state are required' },
          { status: 400 }
        );
      }
    } else {
      // For created products, we need title and calculatorState
      if (!title || !calculatorState) {
        return NextResponse.json(
          { success: false, message: 'Title and calculator state are required' },
          { status: 400 }
        );
      }
    }

    await connectDB();

    // Handle image upload if an image file was provided
    let imagePath = '/products/default.jpg'; // Default image path
    if (imageFile) {
      try {
        // Convert ArrayBuffer to Buffer before uploading
        const arrayBuffer = await imageFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Upload to S3 using the updated function that returns both key and url
        const uploadResult = await uploadFileToS3(
          buffer, 
          imageFile.type, 
          imageFile.name
        );
        
        // Store the S3 key so we can generate fresh presigned URLs when needed
        imagePath = uploadResult.key;
      } catch (uploadError) {
        console.error('Error uploading image:', uploadError);
        // Continue with default image if upload fails
      }
    }
    
    // Check if there's already a saved calculation for this eMAG product
    if (emagProduct) {
      const existingCalculation = await SavedCalculation.findOne({
        'emagProduct.integrationId': emagProduct.integrationId,
        'emagProduct.productId': emagProduct.productId
      });
      
      if (existingCalculation) {
        // Update the existing calculation
        existingCalculation.calculatorState = calculatorState;
        
        // Only update image if a new one was uploaded
        if (imageFile) {
          existingCalculation.image = imagePath;
        }
        
        await existingCalculation.save();
        
        // Generate a presigned URL for the response
        const responseData = existingCalculation.toObject();
        if (responseData.image && responseData.image.startsWith('products/')) {
          try {
            responseData.image = await generatePresignedUrl(responseData.image);
          } catch (urlError) {
            console.error('Error generating presigned URL:', urlError);
            // Keep the original image path if URL generation fails
          }
        }
        
        return NextResponse.json({ 
          success: true, 
          message: 'Calculation updated successfully', 
          data: responseData
        });
      }
    }
    
    // Create a new calculation
    const newCalculation = await SavedCalculation.create({
      title,
      description,
      image: imagePath, // Use the S3 key or default path
      emagProduct,
      calculatorState
    });

    // Generate a presigned URL for the response
    const responseData = newCalculation.toObject();
    if (responseData.image && responseData.image.startsWith('products/')) {
      try {
        responseData.image = await generatePresignedUrl(responseData.image);
      } catch (urlError) {
        console.error('Error generating presigned URL:', urlError);
        // Keep the original image path if URL generation fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Calculation saved successfully', 
      data: responseData
    });
  } catch (error) {
    console.error('Error saving calculation:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to save calculation' },
      { status: 500 }
    );
  }
} 