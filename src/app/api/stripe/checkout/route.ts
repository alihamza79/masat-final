import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/app/lib/stripe';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import mongoose from 'mongoose';

// Price to plan mapping for verification
const PRICE_TO_PLAN_MAPPING: Record<string, string> = {
  [process.env.STRIPE_PRICE_PREMIUM_MONTHLY as string]: 'premium', // Monthly Premium
  [process.env.STRIPE_PRICE_PREMIUM_YEARLY as string]: 'premium', // Yearly Premium
  [process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY as string]: 'professional', // Monthly Professional
  [process.env.STRIPE_PRICE_PROFESSIONAL_YEARLY as string]: 'professional', // Yearly Professional
};

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { priceId, plan, billingCycle = 'monthly' } = body;

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      );
    }

    // Verify that the price ID matches the requested plan
    const expectedPlan = PRICE_TO_PLAN_MAPPING[priceId as keyof typeof PRICE_TO_PLAN_MAPPING];
    if (expectedPlan !== plan) {
      return NextResponse.json(
        { error: 'Invalid price ID for the requested plan' },
        { status: 400 }
      );
    }
    
    // Log the session information for debugging
    console.log('Creating checkout session for user:', {
      userId: session.user.id,
      email: session.user.email,
      plan: plan,
      billingCycle: billingCycle,
      priceId: priceId
    });

    // Create a checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId: session.user.id,
        userEmail: session.user.email || 'unknown',
        plan: plan,
        billingCycle: billingCycle,
        priceId: priceId, // Add price ID to metadata for verification
      },
      subscription_data: {
        metadata: {
          plan: plan,
          billingCycle: billingCycle,
          priceId: priceId,
        },
      },
      success_url: `${process.env.NEXTAUTH_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/pricing`,
      customer_email: session.user.email || undefined,
    });
    
    console.log('Checkout session created:', {
      sessionId: checkoutSession.id,
      metadata: checkoutSession.metadata,
    });

    return NextResponse.json({ sessionId: checkoutSession.id, url: checkoutSession.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
} 