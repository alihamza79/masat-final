import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

// Define types for the API responses
export interface Payment {
  _id: string;
  userId: string;
  stripeSessionId: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripeInvoiceId?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  plan: string;
  billingCycle: 'monthly' | 'yearly';
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: any;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface PaymentResponse {
  payments: Payment[];
  pagination: Pagination;
}

export interface Subscription {
  plan: string;
  status: string | null;
  createdAt: string | null;
  expiresAt: string | null;
  id: string | null;
}

// Define query keys
export const SUBSCRIPTION_QUERY_KEY = ['subscription'];
export const PAYMENT_HISTORY_QUERY_KEY = ['payment-history'];

// API functions
const fetchUserSubscription = async (t?: any) => {
  try {
    const response = await axios.get('/api/user/profile');
    if (!response.data.user) {
      throw new Error(t ? t('subscription.errors.fetchProfile') : 'Failed to fetch user profile');
    }
    
    const user = response.data.user;
    return {
      plan: user.subscriptionPlan || 'free',
      status: user.subscriptionStatus,
      createdAt: user.subscriptionCreatedAt,
      expiresAt: user.subscriptionExpiresAt,
      id: user.subscriptionId,
    } as Subscription;
  } catch (error: any) {
    throw new Error(error.message || (t ? t('subscription.errors.fetchProfile') : 'Failed to fetch user profile'));
  }
};

const fetchPaymentHistory = async (page: number, limit: number, t?: any) => {
  try {
    const response = await axios.get(`/api/stripe/payment-history?page=${page}&limit=${limit}`);
    return response.data as PaymentResponse;
  } catch (error: any) {
    throw new Error(error.message || (t ? t('subscription.errors.fetchPayments') : 'Failed to fetch payment history'));
  }
};

const openBillingPortal = async (t?: any) => {
  try {
    const response = await axios.post('/api/stripe/billing-portal', {}, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.data.url) {
      throw new Error(t ? t('subscription.errors.noBillingUrl') : 'No billing portal URL received');
    }
    
    return response.data.url as string;
  } catch (error: any) {
    throw new Error(error.message || (t ? t('subscription.errors.billingPortal') : 'Failed to access billing portal'));
  }
};

export const useSubscription = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  // Query for fetching subscription data
  const { 
    data: subscription,
    isLoading: isSubscriptionLoading,
    error: subscriptionError,
    refetch: refetchSubscription
  } = useQuery({
    queryKey: SUBSCRIPTION_QUERY_KEY,
    queryFn: () => fetchUserSubscription(t),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Mutation for opening the billing portal
  const billingPortalMutation = useMutation({
    mutationFn: () => openBillingPortal(t),
    onSuccess: (url) => {
      window.location.href = url;
    },
    onError: (error: Error) => {
      toast.error(error.message || t('subscription.errors.billingPortal'));
    },
  });

  return {
    subscription,
    isSubscriptionLoading,
    subscriptionError,
    refetchSubscription,
    openBillingPortal: billingPortalMutation.mutate,
    isBillingPortalLoading: billingPortalMutation.isPending
  };
};

export const usePaymentHistory = (initialPage = 1, initialLimit = 10) => {
  const { t } = useTranslation();
  
  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery<PaymentResponse>({
    queryKey: [...PAYMENT_HISTORY_QUERY_KEY, initialPage, initialLimit],
    queryFn: () => fetchPaymentHistory(initialPage, initialLimit, t),
    staleTime: 1000 * 60 * 5, // 5 minutes
    placeholderData: (previousData) => previousData,
  });

  return {
    payments: data?.payments || [],
    pagination: data?.pagination || { total: 0, page: initialPage, limit: initialLimit, pages: 0 },
    isLoading,
    error,
    refetch
  };
};

export default useSubscription; 