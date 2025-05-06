import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { connectToDatabase } from '@/lib/db/mongodb';
import User from '@/models/User';
import Company from '@/models/Company';
import mongoose from 'mongoose';
import { uploadFileToS3, deleteFileFromS3 } from '@/utils/s3';

// Log the models
console.log('Imported models in route.ts:', { 
  User: typeof User, 
  Company: typeof Company,
  hasCompanyModel: !!Company,
  isMongooseModel: Company && Company.modelName ? true : false
});

/**
 * GET endpoint to fetch user profile information
 */
export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/user/profile: Request started');
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      console.log('GET /api/user/profile: No user session found');
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log(`GET /api/user/profile: Session user found with email ${session.user.email}`);
    await connectToDatabase();
    console.log('GET /api/user/profile: Connected to database');
    
    const user = await User.findOne({ email: session.user.email }).select('-password');
    if (!user) {
      console.log(`GET /api/user/profile: User not found with email ${session.user.email}`);
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    
    console.log(`GET /api/user/profile: User found with ID ${user._id}`);
    
    // Get company info if exists
    let company = null;
    try {
      // Check if Company model is properly imported
      if (!Company || typeof Company.findOne !== 'function') {
        console.error('GET /api/user/profile: Company model is not properly imported');
        throw new Error('Company model is not properly defined');
      }

      // Re-import it directly just in case
      const CompanyModel = mongoose.models.Company || mongoose.model('Company', new mongoose.Schema({
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        name: { type: String, required: true }
      }));
      
      // Try to find with both models
      company = await CompanyModel.findOne({ userId: user._id });
      console.log(`GET /api/user/profile: Company search result: ${company ? 'Found' : 'Not found'}`);
      // Add detailed logging of what's being returned
      console.log('GET /api/user/profile: Returning response with user data:', JSON.stringify({
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        companyFound: !!company,
        companyData: company ? {
          name: company.name,
          taxId: company.taxId,
          registrationNumber: company.registrationNumber
        } : null
      }));
    } catch (companyError: any) {
      console.error('GET /api/user/profile: Error finding company:', companyError);
      // We'll still return user data even if company lookup fails
    }
    
    return NextResponse.json({
      success: true,
      data: {
        user,
        company
      }
    });
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to fetch profile',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

/**
 * PUT endpoint to update user profile information
 * Body params:
 * - name: string (optional)
 * - phone: string (optional)
 * - company: object (optional)
 * - profileImage: base64 string (optional)
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    await connectToDatabase();
    
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    
    const body = await request.json();
    const { name, phone, company: companyData, profileImage } = body;
    
    // Update user fields
    if (name !== undefined) {
      user.name = name;
    }
    
    if (phone !== undefined) {
      user.phone = phone;
    }
    
    // Handle profile image if provided
    if (profileImage) {
      // Delete existing image if it's not from OAuth
      if (user.image && user.image.startsWith('products/')) {
        await deleteFileFromS3(user.image);
      }
      
      // Parse the base64 image data
      const matches = profileImage.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      
      if (matches && matches.length === 3) {
        const contentType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Upload to S3
        const filename = `user_${user._id}_${Date.now()}.jpg`;
        const { key, url } = await uploadFileToS3(buffer, contentType, filename);
        
        // Save S3 path to user
        user.image = key;
      }
    }
    
    await user.save();
    
    // Handle company data if provided
    if (companyData) {
      console.log('Company data received in PUT endpoint:', companyData);
      let company = await Company.findOne({ userId: user._id });
      
      // Check if we're only updating tax settings
      const onlyTaxSettings = 
        Object.keys(companyData).length <= 2 && 
        (companyData.taxRate !== undefined || companyData.isVatPayer !== undefined) &&
        !companyData.name;
        
      console.log('Only tax settings?', onlyTaxSettings);
      
      if (!company) {
        // Only create a new company record if ALL required fields are present
        if (companyData.name) {
          console.log('Creating new company record');
          // Create new company record if it doesn't exist and has name
          company = new Company({
            userId: user._id,
            name: companyData.name,
            // Copy other fields if provided
            ...(companyData.taxId && { taxId: companyData.taxId }),
            ...(companyData.registrationNumber && { registrationNumber: companyData.registrationNumber }),
            ...(companyData.address && { address: companyData.address }),
            ...(companyData.town && { town: companyData.town }),
            ...(companyData.country && { country: companyData.country }),
            ...(companyData.taxRate !== undefined && { taxRate: Number(companyData.taxRate) }),
            ...(companyData.isVatPayer !== undefined && { isVatPayer: Boolean(companyData.isVatPayer) })
          });
        } else {
          // Missing required fields
          console.log('Not creating company - missing required fields');
          return NextResponse.json({ 
            success: false, 
            error: 'Please enter company name and other required details to save tax settings' 
          }, { status: 400 });
        }
      } else {
        // Existing company record - update fields
        console.log('Updating existing company record');
        // Update company fields
        if (companyData.name !== undefined) company.name = companyData.name;
        if (companyData.taxId !== undefined) company.taxId = companyData.taxId;
        if (companyData.registrationNumber !== undefined) company.registrationNumber = companyData.registrationNumber;
        if (companyData.address !== undefined) company.address = companyData.address;
        if (companyData.town !== undefined) company.town = companyData.town;
        if (companyData.country !== undefined) company.country = companyData.country;
        if (companyData.taxRate !== undefined) company.taxRate = Number(companyData.taxRate);
        if (companyData.isVatPayer !== undefined) company.isVatPayer = Boolean(companyData.isVatPayer);
      }
      
      // Save the company data
      if (company) {
        await company.save();
      }
    }
    
    // Return updated data
    const updatedUser = await User.findById(user._id).select('-password');
    const updatedCompany = await Company.findOne({ userId: user._id });
    
    return NextResponse.json({
      success: true,
      data: {
        user: updatedUser,
        company: updatedCompany
      }
    });
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to update profile' }, { status: 500 });
  }
} 