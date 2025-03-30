import { useState } from 'react';

/**
 * Hook to fetch the commission rate from eMAG API
 */
export const useCommission = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch commission rate from eMAG API based on product offer ID
   * @param productOfferId - The eMAG product offer ID
   * @returns The commission value as a percentage (0-100)
   */
  const fetchCommission = async (productOfferId: string | number): Promise<number | null> => {
    if (!productOfferId) {
      setError('Product offer ID is required');
      return null;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/v1/commission/estimate/${productOfferId}`);
      const data = await response.json();
      
      // Check if we have a valid response
      if (data.emagResponse?.code === 200 && data.emagResponse?.data?.value) {
        // Extract the commission value
        let commissionValue: number;
        
        // Handle string or number values
        if (typeof data.emagResponse.data.value === 'string') {
          commissionValue = parseFloat(data.emagResponse.data.value);
        } else {
          commissionValue = Number(data.emagResponse.data.value);
        }
        
        // Check if value is valid
        if (isNaN(commissionValue)) {
          setError('Invalid commission value');
          return 0;
        }
        
        // If value is already in percentage format (0-100), use it as is
        // Otherwise, if it's in decimal format (0-1), convert to percentage
        const commissionPercentage = commissionValue > 1 ? commissionValue : commissionValue * 100;
        
        return commissionPercentage;
      } else if (data.emagResponse?.code === 404) {
        return 0; // Default to 0% when product offer ID is not found
      } else {
        // Handle invalid response format
        setError('Invalid API response format');
        return 0; // Default to 0% if response format is invalid
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch commission rate';
      setError(errorMessage);
      return 0; // Default to 0% on errors
    } finally {
      setLoading(false);
    }
  };

  return {
    fetchCommission,
    loading,
    error
  };
};

export default useCommission; 