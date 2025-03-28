import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback } from 'react';
import axios from 'axios';
import { useIntegrationsStore } from '@/app/(DashboardLayout)/integrations/store/integrations';
import { useEmagDataStore, ImportStatus } from '@/app/(DashboardLayout)/integrations/store/emagData';
import { EmagOrder, EmagProductOffer } from '@/lib/services/emagApiService';
import { Integration } from '@/lib/services/integrationService';
import { decryptResponse } from '@/lib/utils/responseEncryption';

// Query keys
export const EMAG_ORDERS_QUERY_KEY = 'emag-orders';
export const EMAG_PRODUCT_OFFERS_QUERY_KEY = 'emag-product-offers';

// Fetch intervals
const ORDERS_FETCH_INTERVAL = 10 * 60 * 1000; // 10 minutes
const PRODUCT_OFFERS_FETCH_INTERVAL = 12 * 60 * 60 * 1000; // 12 hours

// API timeout (10 minutes)
const API_TIMEOUT = 10 * 60 * 1000;

// Page sizes for pagination
const ORDERS_PAGE_SIZE = 1000; // Use 1000 for orders
const PRODUCT_OFFERS_PAGE_SIZE = 100; // Use 100 for product offers

export const useEmagData = () => {
  const queryClient = useQueryClient();
  const { integrations } = useIntegrationsStore();
  const { 
    integrationsData, 
    setIntegrationData,
    setIntegrationImportStatus 
  } = useEmagDataStore();
  
  // Function to fetch orders for all integrations (with pagination)
  const fetchOrders = useCallback(async () => {
    console.log('Fetching orders data...');
    
    // Process each integration in parallel
    const results = await Promise.all(
      integrations.map(async (integration) => {
        if (!integration._id) return null;
        return fetchOrdersForIntegration(integration);
      })
    );
    
    return results.filter(Boolean);
  }, [integrations]);
  
  // Function to fetch product offers for all integrations (with pagination)
  const fetchProductOffers = useCallback(async () => {
    console.log('Fetching product offers data...');
    
    // Process each integration in parallel
    const results = await Promise.all(
      integrations.map(async (integration) => {
        if (!integration._id) return null;
        return fetchProductOffersForIntegration(integration);
      })
    );
    
    return results.filter(Boolean);
  }, [integrations]);
  
  // Function to fetch orders for a specific integration with pagination
  const fetchOrdersForIntegration = async (integration: Integration) => {
    if (!integration._id) return null;
    
    try {
      // Set status to loading only if not in error state
      const currentStatus = integrationsData[integration._id]?.importStatus;
      if (currentStatus !== 'error') {
        setIntegrationImportStatus(integration._id, 'loading');
      }
      
      // 1. First fetch the count to determine number of pages
      const countResponse = await axios.get(
        `/api/integrations/${integration._id}/orders?countOnly=true`, 
        { timeout: API_TIMEOUT }
      );
      
      if (!countResponse.data.success) {
        throw new Error(countResponse.data.error || 'Failed to fetch orders count');
      }
      
      const countData = countResponse.data.data;
      let totalPages = countData.totalPages;
      const totalCount = countData.totalCount;
      
      // If no orders, return early
      if (totalCount === 0) {
        setIntegrationData(integration._id, {
          orders: [],
          ordersCount: 0,
          ordersFetched: true,
          lastUpdated: new Date().toISOString()
        });
        return {
          orders: [],
          ordersCount: 0
        };
      }
      
      // 2. Fetch the first page to get actual page count and first batch of data
      const firstPageResponse = await axios.get(
        `/api/integrations/${integration._id}/orders?page=1&pageSize=${ORDERS_PAGE_SIZE}`, 
        { timeout: API_TIMEOUT }
      );
      
      if (!firstPageResponse.data.success) {
        throw new Error(firstPageResponse.data.error || 'Failed to fetch first page of orders');
      }
      
      const firstPageData = firstPageResponse.data.data;
      const decryptedFirstPage = JSON.parse(decryptResponse(firstPageData.orderData));
      
      // Use totalPages from the response if available (more accurate)
      if (decryptedFirstPage.totalPages !== undefined) {
        totalPages = decryptedFirstPage.totalPages;
      }
      
      console.log(`Integration ${integration.accountName} has ${totalCount} orders in ${totalPages} pages`);
      
      // Update store with first page data
      setIntegrationData(integration._id, {
        orders: decryptedFirstPage.orders || [],
        ordersCount: totalCount,
        lastUpdated: firstPageData.lastUpdated
      });
      
      // If only one page, we're done
      if (totalPages <= 1) {
        setIntegrationData(integration._id, {
          ordersFetched: true
        });
        return {
          orders: decryptedFirstPage.orders || [],
          ordersCount: totalCount
        };
      }
      
      // 3. Fetch remaining pages in parallel (use a Set to ensure unique page numbers)
      const pagesToFetch = new Set<number>();
      for (let page = 2; page <= Math.min(totalPages, 100); page++) {
        pagesToFetch.add(page);
      }
      
      // Convert to array and fetch remaining pages
      const pagePromises = Array.from(pagesToFetch).map(page => 
        axios.get(
          `/api/integrations/${integration._id}/orders?page=${page}&pageSize=${ORDERS_PAGE_SIZE}`, 
          { timeout: API_TIMEOUT }
        )
      );
      
      const pageResponses = await Promise.all(pagePromises);
      
      // Process all responses
      const allOrders = [...decryptedFirstPage.orders || []];
      
      for (const response of pageResponses) {
        if (response.data.success) {
          const pageData = response.data.data;
          const decryptedPage = JSON.parse(decryptResponse(pageData.orderData));
          if (decryptedPage.orders && decryptedPage.orders.length > 0) {
            allOrders.push(...decryptedPage.orders);
          }
        }
      }
      
      // Update store with all orders
      setIntegrationData(integration._id, {
        orders: allOrders,
        ordersCount: totalCount,
        ordersFetched: true,
        lastUpdated: new Date().toISOString()
      });
      
      return {
        orders: allOrders,
        ordersCount: totalCount
      };
    } catch (error: any) {
      console.error(`Error fetching orders for integration ${integration.accountName}:`, error);
      const errorMessage = error.code === 'ECONNABORTED' 
        ? 'Request timed out after 10 minutes' 
        : error.message || 'Failed to fetch orders';
      setIntegrationImportStatus(integration._id, 'error', errorMessage);
      return null;
    }
  };
  
  // Function to fetch product offers for a specific integration with pagination
  const fetchProductOffersForIntegration = async (integration: Integration) => {
    if (!integration._id) return null;
    
    try {
      // Set status to loading only if not in error state
      const currentStatus = integrationsData[integration._id]?.importStatus;
      if (currentStatus !== 'error') {
        setIntegrationImportStatus(integration._id, 'loading');
      }
      
      // 1. First fetch the count to determine number of pages
      const countResponse = await axios.get(
        `/api/integrations/${integration._id}/product-offers?countOnly=true`, 
        { timeout: API_TIMEOUT }
      );
      
      if (!countResponse.data.success) {
        throw new Error(countResponse.data.error || 'Failed to fetch product offers count');
      }
      
      const countData = countResponse.data.data;
      let totalPages = countData.totalPages;
      const totalCount = countData.totalCount;
      
      // If no product offers, return early
      if (totalCount === 0) {
        setIntegrationData(integration._id, {
          productOffers: [],
          productOffersCount: 0,
          productOffersFetched: true,
          lastUpdated: new Date().toISOString()
        });
        return {
          productOffers: [],
          productOffersCount: 0
        };
      }
      
      // 2. Fetch the first page to get actual page count and first batch of data
      const firstPageResponse = await axios.get(
        `/api/integrations/${integration._id}/product-offers?page=1&pageSize=${PRODUCT_OFFERS_PAGE_SIZE}`, 
        { timeout: API_TIMEOUT }
      );
      
      if (!firstPageResponse.data.success) {
        throw new Error(firstPageResponse.data.error || 'Failed to fetch first page of product offers');
      }
      
      const firstPageData = firstPageResponse.data.data;
      const decryptedFirstPage = JSON.parse(decryptResponse(firstPageData.productOffersData));
      
      // Use totalPages from the response if available (more accurate)
      if (decryptedFirstPage.totalPages !== undefined) {
        totalPages = decryptedFirstPage.totalPages;
      }
      
      console.log(`Integration ${integration.accountName} has ${totalCount} product offers in ${totalPages} pages`);
      
      // Update store with first page data
      setIntegrationData(integration._id, {
        productOffers: decryptedFirstPage.productOffers || [],
        productOffersCount: totalCount,
        lastUpdated: firstPageData.lastUpdated
      });
      
      // If only one page, we're done
      if (totalPages <= 1) {
        setIntegrationData(integration._id, {
          productOffersFetched: true
        });
        return {
          productOffers: decryptedFirstPage.productOffers || [],
          productOffersCount: totalCount
        };
      }
      
      // 3. Fetch remaining pages in parallel (use a Set to ensure unique page numbers)
      const pagesToFetch = new Set<number>();
      for (let page = 2; page <= Math.min(totalPages, 100); page++) {
        pagesToFetch.add(page);
      }
      
      // Convert to array and fetch remaining pages
      const pagePromises = Array.from(pagesToFetch).map(page => 
        axios.get(
          `/api/integrations/${integration._id}/product-offers?page=${page}&pageSize=${PRODUCT_OFFERS_PAGE_SIZE}`, 
          { timeout: API_TIMEOUT }
        )
      );
      
      const pageResponses = await Promise.all(pagePromises);
      
      // Process all responses
      const allProductOffers = [...decryptedFirstPage.productOffers || []];
      
      for (const response of pageResponses) {
        if (response.data.success) {
          const pageData = response.data.data;
          const decryptedPage = JSON.parse(decryptResponse(pageData.productOffersData));
          if (decryptedPage.productOffers && decryptedPage.productOffers.length > 0) {
            allProductOffers.push(...decryptedPage.productOffers);
          }
        }
      }
      
      // Update store with all product offers
      setIntegrationData(integration._id, {
        productOffers: allProductOffers,
        productOffersCount: totalCount,
        productOffersFetched: true,
        lastUpdated: new Date().toISOString()
      });
      
      return {
        productOffers: allProductOffers,
        productOffersCount: totalCount
      };
    } catch (error: any) {
      console.error(`Error fetching product offers for integration ${integration.accountName}:`, error);
      const errorMessage = error.code === 'ECONNABORTED' 
        ? 'Request timed out after 10 minutes' 
        : error.message || 'Failed to fetch product offers';
      setIntegrationImportStatus(integration._id, 'error', errorMessage);
      return null;
    }
  };
  
  // Use React Query to fetch orders for all integrations
  const { 
    isLoading: isLoadingOrders, 
    error: ordersError, 
    refetch: refetchOrders 
  } = useQuery({
    queryKey: [EMAG_ORDERS_QUERY_KEY],
    queryFn: fetchOrders,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    enabled: integrations.length > 0,
    staleTime: ORDERS_FETCH_INTERVAL,
    refetchInterval: ORDERS_FETCH_INTERVAL,
    refetchIntervalInBackground: true,
    gcTime: 0 // Don't keep data in garbage collection
  });

  // Use React Query to fetch product offers for all integrations
  const { 
    isLoading: isLoadingProductOffers, 
    error: productOffersError, 
    refetch: refetchProductOffers 
  } = useQuery({
    queryKey: [EMAG_PRODUCT_OFFERS_QUERY_KEY],
    queryFn: fetchProductOffers,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    enabled: integrations.length > 0,
    staleTime: PRODUCT_OFFERS_FETCH_INTERVAL,
    refetchInterval: PRODUCT_OFFERS_FETCH_INTERVAL,
    refetchIntervalInBackground: true,
    gcTime: 0 // Don't keep data in garbage collection
  });

  // Update import status when both queries complete
  useEffect(() => {
    // Only run this effect when loading state changes and is false (queries completed)
    if (!isLoadingOrders && !isLoadingProductOffers && integrations.length > 0) {
      // Check each integration and update its status if needed
      integrations.forEach(integration => {
        if (!integration._id) return;
        
        const integrationData = integrationsData[integration._id];
        if (!integrationData) return;
        
        // If we have attempted to load both orders and product offers data, and we're not in an error state,
        // set the status to success
        const ordersFetched = integrationData.ordersFetched === true;
        const productOffersFetched = integrationData.productOffersFetched === true;
        const isError = integrationData.importStatus === 'error';
        
        if (ordersFetched && productOffersFetched && !isError && integrationData.importStatus === 'loading') {
          setIntegrationImportStatus(integration._id, 'success');
        }
      });
    }
  }, [isLoadingOrders, isLoadingProductOffers, integrations, integrationsData, setIntegrationImportStatus]);

  // Initialize new integrations with loading status
  useEffect(() => {
    integrations.forEach(integration => {
      if (!integration._id) return;

      const integrationId = integration._id;

      // Only initialize if there's no existing integration data
      if (!integrationsData[integrationId]) {
        console.log(`Initializing integration ${integration.accountName} with loading status`);
        setIntegrationImportStatus(integrationId, 'loading');
      }
    });
  }, [integrations, integrationsData, setIntegrationImportStatus]);

  // Combined loading and error states
  const isLoading = isLoadingOrders || isLoadingProductOffers;
  const error = ordersError || productOffersError;

  // Combined refetch function
  const refetch = useCallback(async () => {
    console.log(`[${new Date().toISOString()}] Manually triggered refetch for orders and product offers`);
    await Promise.all([refetchOrders(), refetchProductOffers()]);
  }, [refetchOrders, refetchProductOffers]);

  // Helper function to force refetch regardless of stale time
  const forceRefetch = useCallback(async () => {
    console.log(`[${new Date().toISOString()}] Force refetching orders and product offers`);
    await queryClient.invalidateQueries({ queryKey: [EMAG_ORDERS_QUERY_KEY] });
    await queryClient.invalidateQueries({ queryKey: [EMAG_PRODUCT_OFFERS_QUERY_KEY] });
  }, [queryClient]);

  // Helper function to get all orders across all integrations
  const getAllOrders = useCallback((): EmagOrder[] => {
    return Object.values(integrationsData).flatMap(data => data.orders || []);
  }, [integrationsData]);

  // Helper function to get all product offers across all integrations
  const getAllProductOffers = useCallback((): EmagProductOffer[] => {
    return Object.values(integrationsData).flatMap(data => data.productOffers || []);
  }, [integrationsData]);

  // Helper function to get import status for a specific integration
  const getImportStatus = useCallback((integrationId: string): ImportStatus => {
    return integrationsData[integrationId]?.importStatus || 'idle';
  }, [integrationsData]);

  // Helper function to get orders count for a specific integration
  const getOrdersCount = useCallback((integrationId: string): number => {
    return integrationsData[integrationId]?.ordersCount || 0;
  }, [integrationsData]);

  // Helper function to get product offers count for a specific integration
  const getProductOffersCount = useCallback((integrationId: string): number => {
    return integrationsData[integrationId]?.productOffersCount || 0;
  }, [integrationsData]);

  return {
    integrationsData,
    isLoading,
    error,
    refetch,
    forceRefetch,
    refetchOrders,
    refetchProductOffers,
    getAllOrders,
    getAllProductOffers,
    getImportStatus,
    getOrdersCount,
    getProductOffersCount
  };
}; 