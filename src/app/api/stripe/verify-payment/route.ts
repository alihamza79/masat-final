import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/app/lib/stripe';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Retrieve the checkout session from Stripe
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'payment_intent'],
    });

    if (!checkoutSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Verify that this session belongs to the current user
    const userId = checkoutSession.metadata?.userId;
    if (userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized access to this session' },
        { status: 403 }
      );
    }

    // Format the response
    const responseData = {
      id: checkoutSession.id,
      status: checkoutSession.status,
      plan: checkoutSession.metadata?.plan || 'Unknown',
      amount: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: checkoutSession.currency || 'USD',
      }).format((checkoutSession.amount_total || 0) / 100),
      customerEmail: checkoutSession.customer_details?.email || session.user.email,
      subscriptionStatus: checkoutSession.subscription 
        ? (checkoutSession.subscription as any).status 
        : null,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
} 