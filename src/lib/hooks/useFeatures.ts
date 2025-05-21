import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Types } from 'mongoose';
import { useTranslation } from 'react-i18next';

export type FeatureStatus = 'Proposed' | 'Development';

export interface Feature {
  _id?: string;
  subject: string;
  body: string;
  status: FeatureStatus;
  userId?: Types.ObjectId | string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const FEATURES_QUERY_KEY = ['features'];

// API functions
const fetchFeatures = async (t?: any) => {
  const response = await axios.get('/api/features');
  if (!response.data.success) {
    throw new Error(response.data.error || (t ? t('features.toast.fetchError') : 'Failed to fetch features'));
  }
  return response.data.data.features;
};

const getFeature = async (id: string, t?: any) => {
  const response = await axios.get(`/api/features/${id}`);
  if (!response.data.success) {
    throw new Error(response.data.error || (t ? t('features.toast.fetchError') : 'Failed to fetch feature details'));
  }
  return response.data.data.feature;
};

const createFeature = async (feature: Omit<Feature, '_id'>) => {
  const response = await axios.post('/api/features', feature);
  if (!response.data.success) {
    throw new Error(response.data.error || 'Failed to create feature request');
  }
  return response.data.data.feature;
};

const updateFeature = async (feature: Feature, t?: any) => {
  // Ensure we send `id` instead of `_id` for the API
  const { _id, ...rest } = feature;
  if (!_id) {
    throw new Error(t ? t('features.toast.missingId') : 'Feature ID is required for update');
  }
  // Send `id` field for the PUT endpoint
  const response = await axios.put('/api/features', { id: _id, ...rest });
  if (!response.data.success) {
    throw new Error(response.data.error || (t ? t('features.toast.updateError') : 'Failed to update feature request'));
  }
  return response.data.data.feature;
};

const deleteFeature = async (id: string, t?: any) => {
  const response = await axios.delete(`/api/features?id=${id}`);
  if (!response.data.success) {
    throw new Error(response.data.error || (t ? t('features.toast.deleteError') : 'Failed to delete feature request'));
  }
  return true;
};

export const useFeatures = () => {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  // Query for fetching all features
  const { 
    data: features = [], 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: FEATURES_QUERY_KEY,
    queryFn: () => fetchFeatures(t),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Query for fetching a single feature by ID
  const getFeatureById = (id: string) => {
    return useQuery({
      queryKey: [...FEATURES_QUERY_KEY, id],
      queryFn: () => getFeature(id, t),
      staleTime: 1000 * 60 * 5, // 5 minutes
      enabled: !!id, // Only run if ID is provided
    });
  };

  // Mutation for creating features
  const createMutation = useMutation({
    mutationFn: createFeature,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FEATURES_QUERY_KEY });
      toast.success(t('features.toast.createSuccess') || 'Feature request created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || t('features.toast.createError') || 'Failed to create feature request');
    },
  });

  // Mutation for updating features
  const updateMutation = useMutation({
    mutationFn: (feature: Feature) => updateFeature(feature, t),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FEATURES_QUERY_KEY });
      toast.success(t('features.toast.updateSuccess') || 'Feature request updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || t('features.toast.updateError') || 'Failed to update feature request');
    },
  });

  // Mutation for deleting features
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFeature(id, t),
    onMutate: (id: string) => {
      setIsDeleting(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FEATURES_QUERY_KEY });
      toast.success(t('features.toast.deleteSuccess') || 'Feature request deleted successfully');
      setIsDeleting(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || t('features.toast.deleteError') || 'Failed to delete feature request');
      setIsDeleting(null);
    },
  });

  return {
    features,
    isLoading,
    error,
    refetch,
    getFeatureById,
    createFeature: createMutation.mutate,
    isCreating: createMutation.isPending,
    updateFeature: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deleteFeature: deleteMutation.mutate,
    isDeleting,
  };
};

export default useFeatures; 