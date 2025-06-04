import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/app/lib/stripe';
import { headers } from 'next/headers';
import User from '@/models/User';
import mongoose from 'mongoose';
import Payment from '@/models/Payment';
import Stripe from 'stripe';

// This is your Stripe webhook secret for testing your endpoint locally.
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Helper functions to consolidate duplicate logic
async function ensureDbConnection() {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI as string);
  }
}

async function findUserBySubscription(subscriptionId: string) {
  await ensureDbConnection();
  const user = await User.findOne({ subscriptionId });
  if (!user) {
    console.error(`❌ No user found with subscription ID: ${subscriptionId}`);
    return null;
  }
  return user;
}

async function checkPaymentExists(invoiceId: string | undefined): Promise<boolean> {
  if (!invoiceId) {
    console.log('⚠️ No invoice ID provided to check for existing payment');
    return false;
  }
  
  try {
    await ensureDbConnection();
    const existingPayment = await Payment.findOne({ stripeInvoiceId: invoiceId });
    return !!existingPayment;
  } catch (error) {
    console.error(`❌ Error checking for existing payment: ${error}`);
    return false;
  }
}

async function createPaymentRecord(paymentData: {
  userId: any;
  stripeInvoiceId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  amount: number;
  currency: string;
  status: string;
  plan: string;
  billingCycle: string;
  metadata: Record<string, any>;
}) {
  if (!paymentData.stripeInvoiceId) {
    console.log('⚠️ Missing invoice ID, cannot create payment record');
    return null;
  }
  
  try {
    const exists = await checkPaymentExists(paymentData.stripeInvoiceId);
    if (exists) {
      console.log(`⚠️ Payment record already exists for invoice ${paymentData.stripeInvoiceId}, skipping creation`);
      return null;
    }
    
    await ensureDbConnection();
    const payment = new Payment(paymentData);
    await payment.save({ validateBeforeSave: false });
    
    console.log(`💖 Payment record created for user ${paymentData.userId} - Amount: ${paymentData.amount} ${paymentData.currency}`);
    return payment;
  } catch (error) {
    console.error(`❌ Error creating payment record: ${error}`);
    console.error(`💔 Payment creation error details:
      User ID: ${paymentData.userId}
      Invoice ID: ${paymentData.stripeInvoiceId}
      Error: ${error instanceof Error ? error.stack : String(error)}
    `);
    return null;
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = headers().get('stripe-signature');

  if (!sig || !endpointSecret) {
    return NextResponse.json(
      { error: 'Missing signature or endpoint secret' },
      { status: 400 }
    );
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: any) {
    console.error(`❌ Webhook Error: ${err.message}`);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  try {
    console.log(`💖 Received webhook event: ${event.type}`);
    
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;
      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error(`❌ Error processing webhook: ${error}`);
    return NextResponse.json(
      { error: 'Error processing webhook' },
      { status: 500 }
    );
  }
}

// Helper function to determine plan from price ID
async function getPlanDetailsFromSubscription(subscription: Stripe.Subscription) {
  if (!subscription.items.data || subscription.items.data.length === 0) {
    return { plan: null, billingCycle: null as 'monthly' | 'yearly' | null, priceId: null };
  }

  const priceId = subscription.items.data[0].price.id;
  const interval = subscription.items.data[0].price.recurring?.interval;
  
  // Map price IDs to plan names using environment variables
  const priceToPlannMap: Record<string, string> = {
    [process.env.STRIPE_PRICE_PREMIUM_MONTHLY as string]: 'premium', // Monthly Premium
    [process.env.STRIPE_PRICE_PREMIUM_YEARLY as string]: 'premium', // Yearly Premium
    [process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY as string]: 'professional', // Monthly Professional
    [process.env.STRIPE_PRICE_PROFESSIONAL_YEARLY as string]: 'professional', // Yearly Professional
  };

  const billingCycle = interval === 'month' ? 'monthly' as const : 
                       interval === 'year' ? 'yearly' as const : 
                       null;

  return {
    plan: priceToPlannMap[priceId] || 'unknown',
    billingCycle: billingCycle,
    priceId: priceId
  };
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log(`💖 Processing checkout.session.completed event`);
  
  const { metadata } = session;
  
  if (!metadata || !metadata.userId) {
    console.error(`❌ Missing metadata or userId in session`);
    return;
  }

  try {
    await ensureDbConnection();
    
    const user = await User.findById(metadata.userId);
    
    if (!user) {
      console.error(`❌ User not found: ${metadata.userId}`);
      return;
    }
    
    if (!session.subscription || typeof session.subscription !== 'string') {
      console.error(`❌ No subscription ID found in session`);
      return;
    }
    
    const subscription = await stripe.subscriptions.retrieve(session.subscription);
    const planDetails = await getPlanDetailsFromSubscription(subscription);
    
    const statusMap: Record<string, 'active' | 'canceled' | 'past_due' | 'trialing' | 'unpaid' | 'incomplete' | null> = {
      'active': 'active',
      'canceled': 'canceled',
      'past_due': 'past_due',
      'trialing': 'trialing',
      'unpaid': 'unpaid',
      'incomplete': 'incomplete',
      'incomplete_expired': 'incomplete'
    };
    
    // Update user with subscription details
    user.subscriptionStatus = statusMap[subscription.status] || null;
    user.subscriptionPlan = planDetails.plan || (metadata.plan as string);
    user.subscriptionId = subscription.id;
    user.subscriptionCreatedAt = new Date(subscription.created * 1000);
    
    // Make sure billingCycle is properly typed
    const billingCycle = planDetails.billingCycle || 
      (metadata.billingCycle === 'monthly' ? 'monthly' as const : 
       metadata.billingCycle === 'yearly' ? 'yearly' as const : null);
       
    user.subscriptionBillingCycle = billingCycle;
    user.stripePriceId = planDetails.priceId; // Store current price ID
    
    if (subscription.items.data && subscription.items.data.length > 0) {
      const subscriptionItem = subscription.items.data[0];
      user.subscriptionExpiresAt = new Date(subscriptionItem.current_period_end * 1000);
    }
    
    await user.save();
    
    // Create payment record
    const paymentData = {
      userId: metadata.userId,
      stripeSessionId: session.id,
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: session.subscription,
      stripeInvoiceId: session.invoice as string || `checkout-${session.id}`,
      amount: (session.amount_total || 0) / 100,
      currency: session.currency || 'usd',
      status: 'succeeded',
      plan: planDetails.plan || (metadata.plan as string),
      billingCycle: billingCycle || 'monthly',
      metadata: { 
        ...metadata,
        source: 'checkout_completed'
      }
    };
    
    await createPaymentRecord(paymentData);
    
    console.log(`💖 Subscription activated for user ${metadata.userId} - Plan: ${planDetails.plan}, Billing: ${billingCycle}`);
  } catch (error) {
    console.error(`❌ Error handling checkout completed: ${error}`);
    throw error;
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log(`💖 Processing customer.subscription.updated event`);
  
  try {
    const user = await findUserBySubscription(subscription.id);
    if (!user) return;
    
    const statusMap: Record<string, 'active' | 'canceled' | 'past_due' | 'trialing' | 'unpaid' | 'incomplete' | null> = {
      'active': 'active',
      'canceled': 'canceled',
      'past_due': 'past_due',
      'trialing': 'trialing',
      'unpaid': 'unpaid',
      'incomplete': 'incomplete',
      'incomplete_expired': 'incomplete'
    };
    
    // Get current plan details from subscription
    const planDetails = await getPlanDetailsFromSubscription(subscription);
    
    // Check if the plan or billing cycle has changed
    const planChanged = user.subscriptionPlan !== planDetails.plan;
    const billingCycleChanged = user.subscriptionBillingCycle !== planDetails.billingCycle;
    
    // Check if this is a period renewal (recurring payment)
    const oldExpiresAt = user.subscriptionExpiresAt;
    const newExpiresAt = subscription.items.data && subscription.items.data.length > 0 
      ? new Date(subscription.items.data[0].current_period_end * 1000)
      : null;
    
    const isPeriodRenewal = oldExpiresAt && newExpiresAt && newExpiresAt > oldExpiresAt;
    
    if (planChanged || billingCycleChanged) {
      console.log(`💖 Subscription change detected - Old Plan: ${user.subscriptionPlan}, New Plan: ${planDetails.plan}`);
      console.log(`💖 Billing cycle change: ${user.subscriptionBillingCycle} → ${planDetails.billingCycle}`);
    }
    
    if (isPeriodRenewal) {
      console.log(`💖 Recurring payment detected - Period renewed until: ${newExpiresAt}`);
    }
    
    // Update subscription details
    user.subscriptionStatus = statusMap[subscription.status] || null;
    
    // Update plan information (crucial for plan changes)
    if (planDetails.plan && planDetails.plan !== 'unknown') {
      user.subscriptionPlan = planDetails.plan;
      user.stripePriceId = planDetails.priceId;
    }
    
    if (planDetails.billingCycle) {
      user.subscriptionBillingCycle = planDetails.billingCycle;
    }
    
    // Update expiration date
    if (newExpiresAt) {
      user.subscriptionExpiresAt = newExpiresAt;
    }
    
    await user.save();
    
    // Create a payment record for:
    // 1. Plan or billing cycle changes
    // 2. Period renewals (recurring payments)
    if ((planChanged || billingCycleChanged || isPeriodRenewal) && subscription.latest_invoice) {
      try {
        // Fetch the latest invoice to get payment details
        const latestInvoice = typeof subscription.latest_invoice === 'string' 
          ? await stripe.invoices.retrieve(subscription.latest_invoice)
          : subscription.latest_invoice;
          
        if (latestInvoice && latestInvoice.status === 'paid') {
          // Determine the source/reason for this payment
          let paymentSource = 'subscription_updated';
          if (isPeriodRenewal && !planChanged && !billingCycleChanged) {
            paymentSource = 'recurring_payment';
          } else if (planChanged || billingCycleChanged) {
            paymentSource = 'plan_change';
          }
          
          // Create payment record
          const paymentData = {
            userId: user._id,
            stripeInvoiceId: latestInvoice.id || `sub-update-${Date.now()}`,
            stripeCustomerId: subscription.customer as string,
            stripeSubscriptionId: subscription.id,
            amount: (latestInvoice.amount_paid || 0) / 100,
            currency: latestInvoice.currency || 'usd',
            status: 'succeeded',
            plan: planDetails.plan || 'unknown',
            billingCycle: planDetails.billingCycle || 'monthly',
            metadata: { 
              source: paymentSource,
              planChanged: planChanged ? 'true' : 'false',
              billingCycleChanged: billingCycleChanged ? 'true' : 'false',
              isPeriodRenewal: isPeriodRenewal ? 'true' : 'false',
              oldPlan: user.subscriptionPlan || 'unknown',
              newPlan: planDetails.plan || 'unknown',
              periodStart: (subscription as any).current_period_start ? 
                new Date((subscription as any).current_period_start * 1000).toISOString() : 
                new Date().toISOString(),
              periodEnd: (subscription as any).current_period_end ? 
                new Date((subscription as any).current_period_end * 1000).toISOString() : 
                new Date().toISOString()
            }
          };
          
          await createPaymentRecord(paymentData);
        } else {
          console.log(`⚠️ No payment record created - Invoice status: ${latestInvoice?.status || 'unknown'}`);
        }
      } catch (error) {
        console.error(`❌ Error creating payment record for subscription update: ${error}`);
        // Log detailed error information to help diagnose the issue
        console.error(`💔 Payment creation error details:
          User ID: ${user._id}
          Subscription ID: ${subscription.id}
          Invoice ID: ${typeof subscription.latest_invoice === 'string' ? subscription.latest_invoice : subscription.latest_invoice?.id}
          Error: ${error instanceof Error ? error.stack : String(error)}
        `);
      }
    }
    
    console.log(`💖 Updated subscription for user ${user._id}: 
      Status: ${subscription.status}
      Plan: ${planDetails.plan}
      Billing: ${planDetails.billingCycle}
      ${isPeriodRenewal ? 'RECURRING PAYMENT PROCESSED' : ''}`);
      
  } catch (error) {
    console.error(`❌ Error handling subscription updated: ${error}`);
    throw error;
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log(`💖 Processing customer.subscription.deleted event`);
  
  try {
    const user = await findUserBySubscription(subscription.id);
    if (!user) return;
    
    // Clear subscription data
    user.subscriptionStatus = 'canceled';
    user.subscriptionId = null;
    user.subscriptionPlan = null;
    user.subscriptionBillingCycle = null;
    user.stripePriceId = null;
    user.subscriptionExpiresAt = null;
    
    await user.save();
    console.log(`💖 Subscription deleted for user ${user._id}`);
  } catch (error) {
    console.error(`❌ Error handling subscription deleted: ${error}`);
    throw error;
  }
}

async function handleInvoicePaymentSucceeded(invoice: any) {
  console.log(`💖 Processing invoice.payment_succeeded event`);
  
  // Use type assertion since Stripe types might not include subscription on Invoice
  const subscriptionId = invoice.subscription as string | null;
  if (!subscriptionId) return;
  
  try {
    const user = await findUserBySubscription(subscriptionId);
    if (!user) return;
    
    // Create payment record for successful payment
    const paymentData = {
      userId: user._id,
      stripeInvoiceId: invoice.id || `invoice-${Date.now()}`,
      stripeCustomerId: invoice.customer as string,
      stripeSubscriptionId: subscriptionId,
      amount: (invoice.amount_paid || 0) / 100,
      currency: invoice.currency || 'usd',
      status: 'succeeded',
      plan: user.subscriptionPlan || 'unknown',
      billingCycle: user.subscriptionBillingCycle || 'monthly',
      metadata: { 
        invoiceId: invoice.id,
        source: 'invoice_payment_succeeded'
      }
    };
    
    await createPaymentRecord(paymentData);
  } catch (error) {
    console.error(`❌ Error handling invoice payment succeeded: ${error}`);
    throw error;
  }
}

async function handleInvoicePaymentFailed(invoice: any) {
  console.log(`💖 Processing invoice.payment_failed event`);
  
  // Use type assertion since Stripe types might not include subscription on Invoice
  const subscriptionId = invoice.subscription as string | null;
  if (!subscriptionId) return;
  
  try {
    const user = await findUserBySubscription(subscriptionId);
    if (!user) return;
    
    // You might want to send an email notification here
    console.log(`⚠️ Payment failed for user ${user._id}`);
    
    // Optionally create a failed payment record
    const paymentData = {
      userId: user._id,
      stripeInvoiceId: invoice.id || `failed-${Date.now()}`,
      stripeCustomerId: invoice.customer as string,
      stripeSubscriptionId: subscriptionId,
      amount: (invoice.amount_due || 0) / 100,
      currency: invoice.currency || 'usd',
      status: 'failed',
      plan: user.subscriptionPlan || 'unknown',
      billingCycle: user.subscriptionBillingCycle || 'monthly',
      metadata: { 
        invoiceId: invoice.id, 
        reason: 'payment_failed',
        source: 'invoice_payment_failed'
      }
    };
    
    await createPaymentRecord(paymentData);
    
    console.log(`💔 Failed payment recorded for user ${user._id} - Amount: ${(invoice.amount_due || 0) / 100} ${invoice.currency}`);
    
  } catch (error) {
    console.error(`❌ Error handling invoice payment failed: ${error}`);
    throw error;
  }
}