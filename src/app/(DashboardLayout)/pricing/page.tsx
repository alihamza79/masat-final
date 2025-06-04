'use client'

import React, { useState } from 'react';
import { Grid, Box } from '@mui/material';
import PageContainer from '@/app/components/container/PageContainer';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import useCurrentUser from '@/lib/hooks/useCurrentUser';

// Import components
import PricingCard from './components/PricingCard';
import PricingHeader from './components/PricingHeader';
import SubscriptionDialog from './components/SubscriptionDialog';

// Import pricing data
import pricingData from '@/data/pricingData.json';

const Pricing = () => {
  const [showYearly, setShowYearly] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const { data: session } = useSession();
  const { user, isLoading: userLoading } = useCurrentUser();
  const router = useRouter();
  const [portalLoading, setPortalLoading] = useState(false);

  // Function to determine if this is the user's current plan
  const isCurrentPlan = (planName: string): boolean => {
    if (!user || !user.subscriptionPlan) return planName.toLowerCase() === 'free';
    return user.subscriptionPlan.toLowerCase() === planName.toLowerCase();
  };

  // Function to get button text based on subscription status
  const getButtonText = (planName: string): string => {
    if (isCurrentPlan(planName)) {
      if (user?.subscriptionStatus === 'active') {
        return 'Current Plan';
      } else if (user?.subscriptionStatus === 'canceled') {
        return 'Reactivate Plan';
      }
      return 'Current Plan';
    }
    return `Choose ${planName}`;
  };

  const handleSubscription = async (plan: string) => {
    if (!session) {
      // Redirect to login if user is not authenticated
      router.push('/auth/auth1/login');
      return;
    }

    // Skip payment process for free plan
    if (plan.toLowerCase() === 'free') {
      toast.success('You have successfully subscribed to the Free plan!');
      return;
    }

    // If user already has an active paid subscription, show warning dialog
    if (user?.subscriptionStatus === 'active' && 
        user?.subscriptionPlan && 
        user.subscriptionPlan !== 'free' && 
        plan.toLowerCase() !== user.subscriptionPlan.toLowerCase()) {
      setSelectedPlan(plan);
      setDialogOpen(true);
      return;
    }

    // Otherwise proceed with subscription
    proceedWithSubscription(plan);
  };

  const proceedWithSubscription = async (plan: string) => {
    try {
      setLoading(plan);
      
      // Use environment variables for price IDs
      const priceIds = {
        premium: {
          monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM_MONTHLY || "price_1RW8oGHs3TKfjUbMx0qbfnyV",
          yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM_YEARLY || 'price_1RW8rUHs3TKfjUbMZIKyGGJM'
        },
        professional: {
          monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL_MONTHLY || 'price_1RW8slHs3TKfjUbMMEOXyNXn',
          yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL_YEARLY || 'price_1RW8tVHs3TKfjUbMDKg5dbt9'
        }
      };
      
      // Get the appropriate price ID based on the plan and billing cycle
      const planKey = plan.toLowerCase() as keyof typeof priceIds;
      const priceId = showYearly ? priceIds[planKey]?.yearly : priceIds[planKey]?.monthly;
      const billingCycle = showYearly ? 'yearly' : 'monthly';
      
      if (!priceId) {
        toast.error('Invalid plan selected');
        setLoading(null);
        return;
      }

      console.log('Creating checkout session with:', {
        priceId,
        plan: plan.toLowerCase(),
        billingCycle
      });

      // Call our API to create a checkout session
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          plan: plan.toLowerCase(),
          billingCycle,
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.url) {
        console.log('Redirecting to checkout URL:', data.url);
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        console.error('Checkout session error:', data.error || 'Unknown error');
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  // Function to open Stripe billing portal
  const handleGoToSubscription = async () => {
    if (!user?.subscriptionPlan || user.subscriptionPlan === 'free') {
      toast.error('No active subscription to manage');
      setDialogOpen(false);
      return;
    }

    try {
      setPortalLoading(true);
      const response = await fetch('/api/stripe/billing-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to access billing portal');
      }
      
      // Redirect to Stripe billing portal
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No billing portal URL received');
      }
          
    } catch (err: any) {
      console.error('Error accessing billing portal:', err);
      toast.error(err.message || 'Failed to access billing portal');
      setDialogOpen(false);
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <PageContainer title="Pricing" description="this is Pricing">
      {/* Pricing Header with Toggle */}
      <PricingHeader 
        showYearly={showYearly} 
        onToggle={() => setShowYearly(!showYearly)} 
      />
      
      {/* Pricing Cards */}
      <Grid container spacing={3} mt={5}>
        {pricingData.pricing.map((price, i) => (
          <Grid item xs={12} lg={4} sm={6} key={i}>
            <PricingCard
              {...price}
              isCurrentPlan={isCurrentPlan(price.package)}
              buttonText={getButtonText(price.package)}
              loading={loading}
              showYearly={showYearly}
              onSubscribe={handleSubscription}
            />
          </Grid>
        ))}
      </Grid>

      {/* Subscription Dialog */}
      <SubscriptionDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onManageSubscription={handleGoToSubscription}
        user={user || null}
        portalLoading={portalLoading}
      />
    </PageContainer>
  );
};

export default Pricing; 