'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

// Define key for query caching
const USER_PROFILE_KEY = 'userProfile';

// Type definitions
interface UserProfile {
  user: any;
  company: any;
}

// Function to fetch user profile data
const fetchUserProfile = async (): Promise<UserProfile> => {
  const response = await axios.get('/api/user/profile');
  if (!response.data.success) {
    throw new Error(response.data.error || 'Failed to fetch user profile');
  }
  return response.data.data;
};

// Function to update user profile
const updateUserProfile = async (data: any): Promise<UserProfile> => {
  const response = await axios.put('/api/user/profile', data);
  if (!response.data.success) {
    throw new Error(response.data.error || 'Failed to update user profile');
  }
  return response.data.data;
};

// Hook to get user profile with caching
export function useUserProfile() {
  const queryClient = useQueryClient();
  
  // Query hook for fetching data
  const query = useQuery({
    queryKey: [USER_PROFILE_KEY],
    queryFn: fetchUserProfile,
    // If an error occurs, we'll handle it in the component
    throwOnError: false,
  });
  
  // Mutation hook for updating data
  const mutation = useMutation({
    mutationFn: updateUserProfile,
    // On successful update, update the cache with new data
    onSuccess: (data) => {
      queryClient.setQueryData([USER_PROFILE_KEY], data);
    },
  });
  
  // Function to manually invalidate the cache and force a refetch
  const refreshUserProfile = () => {
    queryClient.invalidateQueries({ queryKey: [USER_PROFILE_KEY] });
  };
  
  return {
    // Data and status from the query
    userData: query.data?.user || null,
    companyData: query.data?.company || null,
    isLoading: query.isLoading,
    error: query.error,
    // Update function
    updateProfile: mutation.mutate,
    isUpdating: mutation.isPending,
    updateError: mutation.error,
    // Refresh function
    refreshUserProfile,
  };
} 