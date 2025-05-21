import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export const FEATURE_SUBSCRIPTION_QUERY_KEY = 'feature-subscription';

const useFeatureSubscription = (featureId: string) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isUnsubscribing, setIsUnsubscribing] = useState(false);

  // Check if user is subscribed to the feature
  const { 
    data: subscriptionData,
    isLoading: isCheckingSubscription,
    error: subscriptionError,
    refetch: refetchSubscription
  } = useQuery({
    queryKey: [FEATURE_SUBSCRIPTION_QUERY_KEY, featureId],
    queryFn: async () => {
      const response = await axios.get(`/api/features/subscription-status?featureId=${featureId}`);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to check subscription status');
      }
      return response.data.data;
    },
    enabled: !!featureId,
  });

  // Subscribe to a feature
  const subscribe = async () => {
    if (isSubscribing) return;
    
    try {
      setIsSubscribing(true);
      const response = await axios.post('/api/features/subscribe', { featureId });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to subscribe to feature');
      }
      
      // Invalidate the subscription query to refresh data
      queryClient.invalidateQueries({
        queryKey: [FEATURE_SUBSCRIPTION_QUERY_KEY, featureId]
      });
      
      toast.success(t('features.subscription.subscribeSuccess') || 'Subscribed successfully');
      return response.data.data;
    } catch (error: any) {
      toast.error(error.message || t('features.subscription.subscribeError') || 'Failed to subscribe');
      throw error;
    } finally {
      setIsSubscribing(false);
    }
  };

  // Unsubscribe from a feature
  const unsubscribe = async () => {
    if (isUnsubscribing) return;
    
    try {
      setIsUnsubscribing(true);
      const response = await axios.delete(`/api/features/subscribe?featureId=${featureId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to unsubscribe from feature');
      }
      
      // Invalidate the subscription query to refresh data
      queryClient.invalidateQueries({
        queryKey: [FEATURE_SUBSCRIPTION_QUERY_KEY, featureId]
      });
      
      toast.success(t('features.subscription.unsubscribeSuccess') || 'Unsubscribed successfully');
      return response.data.data;
    } catch (error: any) {
      toast.error(error.message || t('features.subscription.unsubscribeError') || 'Failed to unsubscribe');
      throw error;
    } finally {
      setIsUnsubscribing(false);
    }
  };

  // Toggle subscription status
  const toggleSubscription = async () => {
    if (subscriptionData?.isSubscribed) {
      return unsubscribe();
    } else {
      return subscribe();
    }
  };

  return {
    isSubscribed: subscriptionData?.isSubscribed || false,
    isLoading: isCheckingSubscription,
    isSubscribing,
    isUnsubscribing,
    error: subscriptionError,
    subscribe,
    unsubscribe,
    toggleSubscription,
    refetchSubscription
  };
};

export default useFeatureSubscription; 