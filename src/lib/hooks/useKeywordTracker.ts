import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Types } from 'mongoose';
import { useTranslation } from 'react-i18next';

export interface KeywordTrackedProduct {
  _id?: string;
  userId?: Types.ObjectId | string;
  productId: string;
  productName: string;
  productImage?: string;
  productSKU?: string;
  productPNK?: string;
  keywords: string[];
  organicTop10: number;
  organicTop50: number;
  sponsoredTop10: number;
  sponsoredTop50: number;
  createdAt?: string;
  updatedAt?: string;
}

export const KEYWORD_TRACKER_QUERY_KEY = ['keywordTracker'];

// API functions
const fetchKeywordTrackedProducts = async (t?: any) => {
  const response = await axios.get('/api/keyword-tracker');
  if (!response.data.success) {
    throw new Error(response.data.error || (t ? t('keywordTracker.toast.fetchError') : 'Failed to fetch tracked products'));
  }
  return response.data.data.trackedProducts;
};

const getKeywordTrackedProduct = async (id: string, t?: any) => {
  const response = await axios.get(`/api/keyword-tracker?id=${id}`);
  if (!response.data.success) {
    throw new Error(response.data.error || (t ? t('keywordTracker.toast.fetchError') : 'Failed to fetch tracked product details'));
  }
  return response.data.data.trackedProduct;
};

const createKeywordTrackedProduct = async (trackedProduct: Omit<KeywordTrackedProduct, '_id'>) => {
  const response = await axios.post('/api/keyword-tracker', trackedProduct);
  if (!response.data.success) {
    throw new Error(response.data.error || 'Failed to create tracked product');
  }
  return response.data.data.trackedProduct;
};

const updateKeywordTrackedProduct = async (trackedProduct: KeywordTrackedProduct, t?: any) => {
  const { _id, ...rest } = trackedProduct;
  if (!_id) {
    throw new Error(t ? t('keywordTracker.toast.missingId') : 'Tracked product ID is required for update');
  }
  
  const response = await axios.put('/api/keyword-tracker', { id: _id, ...rest });
  if (!response.data.success) {
    throw new Error(response.data.error || (t ? t('keywordTracker.toast.updateError') : 'Failed to update tracked product'));
  }
  return response.data.data.trackedProduct;
};

const deleteKeywordTrackedProduct = async (id: string, t?: any) => {
  const response = await axios.delete(`/api/keyword-tracker?id=${id}`);
  if (!response.data.success) {
    throw new Error(response.data.error || (t ? t('keywordTracker.toast.deleteError') : 'Failed to delete tracked product'));
  }
  return true;
};

export const useKeywordTracker = () => {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  // Query for fetching all tracked products
  const { 
    data: trackedProducts = [], 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: KEYWORD_TRACKER_QUERY_KEY,
    queryFn: () => fetchKeywordTrackedProducts(t),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Query for fetching a single tracked product by ID
  const getTrackedProductById = (id: string) => {
    return useQuery({
      queryKey: [...KEYWORD_TRACKER_QUERY_KEY, id],
      queryFn: () => getKeywordTrackedProduct(id, t),
      staleTime: 5 * 60 * 1000, // 5 minutes
      enabled: !!id, // Only run if ID is provided
    });
  };

  // Mutation for creating tracked products
  const createMutation = useMutation({
    mutationFn: createKeywordTrackedProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYWORD_TRACKER_QUERY_KEY });
      toast.success(t('keywordTracker.toast.createSuccess') || 'Product tracking added successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || t('keywordTracker.toast.createError') || 'Failed to add product tracking');
    },
  });

  // Mutation for updating tracked products
  const updateMutation = useMutation({
    mutationFn: (trackedProduct: KeywordTrackedProduct) => updateKeywordTrackedProduct(trackedProduct, t),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYWORD_TRACKER_QUERY_KEY });
      toast.success(t('keywordTracker.toast.updateSuccess') || 'Keywords updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || t('keywordTracker.toast.updateError') || 'Failed to update keywords');
    },
  });

  // Mutation for deleting tracked products
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteKeywordTrackedProduct(id, t),
    onMutate: (id: string) => {
      setIsDeleting(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYWORD_TRACKER_QUERY_KEY });
      toast.success(t('keywordTracker.toast.deleteSuccess') || 'Product tracking removed successfully');
      setIsDeleting(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || t('keywordTracker.toast.deleteError') || 'Failed to remove product tracking');
      setIsDeleting(null);
    },
  });

  // Function to force refresh tracked products
  const forceRefresh = () => {
    return queryClient.invalidateQueries({ queryKey: KEYWORD_TRACKER_QUERY_KEY });
  };

  return {
    trackedProducts,
    isLoading,
    error,
    refetch: forceRefresh,
    getTrackedProductById,
    createTrackedProduct: createMutation.mutate,
    isCreating: createMutation.isPending,
    updateTrackedProduct: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deleteTrackedProduct: deleteMutation.mutate,
    isDeleting,
  };
};

export default useKeywordTracker; 