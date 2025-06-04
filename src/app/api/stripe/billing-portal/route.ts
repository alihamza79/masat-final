import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/app/lib/mongodb';
import User from '@/models/User';
import stripe from '@/app/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized access' },
        { status: 401 }
      );
    }
    
    // Connect to database
    await connectDB();
    
    // Find user
    const user = await User.findById(session.user.id);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if user has an active subscription
    if (!user.subscriptionId) {
      return NextResponse.json(
        { success: false, error: 'No active subscription found' },
        { status: 400 }
      );
    }
    
    // Get customer ID from Stripe
    let stripeCustomerId;
    
    // If we already have a subscription ID, we can retrieve the customer ID
    const subscription = await stripe.subscriptions.retrieve(user.subscriptionId);
    stripeCustomerId = typeof subscription.customer === 'string' 
      ? subscription.customer 
      : subscription.customer.id;
    
    // Create a billing portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${process.env.NEXTAUTH_URL}/subscriptions`,
    });
    
    // Return the URL
    return NextResponse.json({
      success: true,
      url: portalSession.url
    });
    
  } catch (error: any) {
    console.error('Error creating billing portal session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create billing portal session', details: error.message },
      { status: 500 }
    );
  }
} 