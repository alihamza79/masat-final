import { Feature } from './useFeatures';
import { useCurrentUser } from './useCurrentUser';

/**
 * Custom hook for checking feature ownership
 */
export function useFeatureOwnership() {
  const { user, isLoading } = useCurrentUser();

  /**
   * Check if the current user is the owner of a feature
   * @param feature - The feature to check
   * @returns boolean - True if the current user is the owner
   */
  const isOwner = (feature: Feature): boolean => {
    if (!user?.id || !feature) return false;

    // If userId exists, compare it directly with user id
    if (feature.userId) {
      const featureUserId = typeof feature.userId === 'object' 
        ? String(feature.userId)
        : feature.userId;
      
      // Compare as strings to avoid type mismatches
      return featureUserId.toString() === user.id.toString();
    }

    // For backwards compatibility, check createdBy against user name or email
    if (feature.createdBy && user.name) {
      return feature.createdBy.toLowerCase() === user.name.toLowerCase();
    }

    if (feature.createdBy && user.email) {
      return feature.createdBy.toLowerCase() === user.email.toLowerCase();
    }

    return false;
  };

  return {
    isOwner,
    currentUserId: user?.id,
    isLoading
  };
}

export default useFeatureOwnership; 