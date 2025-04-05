import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import SavedCalculation from '@/app/models/SavedCalculation';
import { uploadFileToS3, generatePresignedUrl, deleteFileFromS3 } from '@/utils/s3';

// Set export configuration for Next.js
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET handler to retrieve a specific calculation by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await connectToDatabase();
    
    const calculation = await SavedCalculation.findById(id);
    
    if (!calculation) {
      return NextResponse.json(
        { success: false, message: 'Calculation not found' },
        { status: 404 }
      );
    }
    
    // Convert to plain object
    const calcObj = calculation.toObject();
    
    // Generate fresh presigned URL for the image if it's from S3
    if (calcObj.image && calcObj.image.startsWith('products/')) {
      try {
        calcObj.image = await generatePresignedUrl(calcObj.image);
      } catch (urlError) {
        console.error('Error generating presigned URL:', urlError);
        // Keep the original image path if URL generation fails
      }
    }
    
    return NextResponse.json({ success: true, data: calcObj });
  } catch (error) {
    console.error('Error fetching calculation:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch calculation' },
      { status: 500 }
    );
  }
}

// PUT handler to update an existing calculation
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Get FormData from the request
    const formData = await request.formData();
    
    // Extract values from formData
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const calculatorStateJson = formData.get('calculatorState') as string;
    const imageFile = formData.get('image') as File | null;
    
    // Parse calculatorState from JSON string
    const calculatorState = JSON.parse(calculatorStateJson);

    if (!title || !calculatorState) {
      return NextResponse.json(
        { success: false, message: 'Title and calculator state are required' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    
    const calculation = await SavedCalculation.findById(id);
    
    if (!calculation) {
      return NextResponse.json(
        { success: false, message: 'Calculation not found' },
        { status: 404 }
      );
    }
    
    // Store the old image key in case we need to delete it
    const oldImageKey = calculation.image && calculation.image.startsWith('products/') 
      ? calculation.image 
      : null;
    
    // Handle image upload if a new image file was provided
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
        
        // Update the image URL in the calculation
        calculation.image = uploadResult.key;
        
        // Delete the old image if it exists and is different from the default
        if (oldImageKey) {
          await deleteFileFromS3(oldImageKey);
        }
      } catch (uploadError) {
        console.error('Error uploading image:', uploadError);
        // Continue with the existing image if upload fails
      }
    }
    
    // Update the calculation
    calculation.title = title;
    calculation.description = description;
    calculation.calculatorState = calculatorState;
    
    await calculation.save();
    
    // Generate a fresh presigned URL for the response
    const responseData = calculation.toObject();
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
  } catch (error) {
    console.error('Error updating calculation:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update calculation' },
      { status: 500 }
    );
  }
}

// DELETE handler to delete a calculation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await connectToDatabase();
    
    // First, find the calculation to get its image path
    const calculation = await SavedCalculation.findById(id);
    
    if (!calculation) {
      return NextResponse.json(
        { success: false, message: 'Calculation not found' },
        { status: 404 }
      );
    }
    
    // Delete the associated image file from S3 if it exists
    if (calculation.image && calculation.image.startsWith('products/')) {
      try {
        await deleteFileFromS3(calculation.image);
      } catch (deleteError) {
        console.error('Error deleting image from S3:', deleteError);
        // Continue with deletion even if removing the image fails
      }
    }
    
    // Now delete the calculation from the database
    await SavedCalculation.findByIdAndDelete(id);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Calculation and associated image deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting calculation:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete calculation' },
      { status: 500 }
    );
  }
} 