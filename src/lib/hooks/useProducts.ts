import { useQuery } from '@tanstack/react-query';

export const PRODUCTS_QUERY_KEY = ['productOffers'];

export const useProducts = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: PRODUCTS_QUERY_KEY,
    queryFn: async () => {
      const res = await fetch('/api/db/product-offers');
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Failed to fetch product offers');
      }
      return json.data.productOffers;
    }
  });
  return { products: data || [], isLoading, error, refetch };
};

export default useProducts; 