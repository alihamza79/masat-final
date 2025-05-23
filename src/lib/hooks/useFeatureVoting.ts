import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export const FEATURE_VOTE_QUERY_KEY = 'feature-vote';

const useFeatureVoting = (featureId: string) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isVoting, setIsVoting] = useState(false);
  const [isRemovingVote, setIsRemovingVote] = useState(false);

  // Check if user has voted for the feature
  const { 
    data: voteData,
    isLoading: isCheckingVote,
    error: voteError,
    refetch: refetchVote
  } = useQuery({
    queryKey: [FEATURE_VOTE_QUERY_KEY, featureId],
    queryFn: async () => {
      const response = await axios.get(`/api/features/vote-status?featureId=${featureId}`);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to check vote status');
      }
      return response.data.data;
    },
    enabled: !!featureId,
  });

  // Vote for a feature
  const addVote = async () => {
    if (isVoting) return;
    
    try {
      setIsVoting(true);
      const response = await axios.post('/api/features/vote', { featureId });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to vote for feature');
      }
      
      // Invalidate the vote query and features list to refresh data
      queryClient.invalidateQueries({
        queryKey: [FEATURE_VOTE_QUERY_KEY, featureId]
      });
      queryClient.invalidateQueries({
        queryKey: ['features']
      });
      
      toast.success(t('features.vote.voteSuccess') || 'Voted successfully');
      return response.data.data;
    } catch (error: any) {
      toast.error(error.message || t('features.vote.voteError') || 'Failed to vote');
      throw error;
    } finally {
      setIsVoting(false);
    }
  };

  // Remove vote from a feature
  const removeVote = async () => {
    if (isRemovingVote) return;
    
    try {
      setIsRemovingVote(true);
      const response = await axios.delete(`/api/features/vote?featureId=${featureId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to remove vote');
      }
      
      // Invalidate the vote query and features list to refresh data
      queryClient.invalidateQueries({
        queryKey: [FEATURE_VOTE_QUERY_KEY, featureId]
      });
      queryClient.invalidateQueries({
        queryKey: ['features']
      });
      
      toast.success(t('features.vote.unvoteSuccess') || 'Vote removed successfully');
      return response.data.data;
    } catch (error: any) {
      toast.error(error.message || t('features.vote.unvoteError') || 'Failed to remove vote');
      throw error;
    } finally {
      setIsRemovingVote(false);
    }
  };

  // Toggle vote status
  const toggleVote = async () => {
    if (voteData?.hasVoted) {
      return removeVote();
    } else {
      return addVote();
    }
  };

  return {
    hasVoted: voteData?.hasVoted || false,
    isLoading: isCheckingVote,
    isVoting,
    isRemovingVote,
    error: voteError,
    addVote,
    removeVote,
    toggleVote,
    refetchVote
  };
};

export default useFeatureVoting; 