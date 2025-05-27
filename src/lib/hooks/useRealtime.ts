'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { NOTIFICATIONS_QUERY_KEY } from './useNotifications';
import { FEATURES_QUERY_KEY } from './useFeatures';

export interface RealtimeMessage {
  type: 'connection' | 'change' | 'heartbeat' | 'error';
  collection?: string;
  operation?: 'insert' | 'update' | 'delete' | 'replace';
  data?: any;
  timestamp: string;
}

export interface UseRealtimeOptions {
  collections?: string[];
  enabled?: boolean;
  userId?: string;
  onMessage?: (message: RealtimeMessage) => void;
  onError?: (error: Event) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

// ADDED: Global connection tracking to prevent multiple instances
let globalConnectionRef: EventSource | null = null;
let globalConnectionCount = 0;

export const useRealtime = (options: UseRealtimeOptions = {}) => {
  const {
    collections = ['notifications', 'features'],
    enabled = true,
    userId,
    onMessage,
    onError,
    onConnect,
    onDisconnect
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<RealtimeMessage | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isConnectingRef = useRef(false);
  const shouldConnectRef = useRef(enabled);
  const queryClient = useQueryClient();
  const instanceIdRef = useRef(Math.random().toString(36).substr(2, 9)); // Unique instance ID

  // Store stable references to avoid dependency loops
  const queryClientRef = useRef(queryClient);
  const optionsRef = useRef({
    collections,
    userId,
    onMessage,
    onError,
    onConnect,
    onDisconnect
  });

  // Update refs when they change but don't trigger re-connections
  useEffect(() => {
    queryClientRef.current = queryClient;
  }, [queryClient]);

  useEffect(() => {
    optionsRef.current = {
      collections,
      userId,
      onMessage,
      onError,
      onConnect,
      onDisconnect
    };
  }, [collections, userId, onMessage, onError, onConnect, onDisconnect]);

  // Update enabled ref
  useEffect(() => {
    shouldConnectRef.current = enabled;
  }, [enabled]);

  const maxReconnectAttempts = 5;
  const baseReconnectDelay = 1000;

  // FIXED: Removed queryClient dependency to prevent loops
  const handleMessage = useCallback((message: RealtimeMessage) => {
    setLastMessage(message);
    
    // Handle different message types
    switch (message.type) {
      case 'connection':
        setIsConnected(true);
        setConnectionError(null);
        setReconnectAttempts(0);
        reconnectAttemptsRef.current = 0;
        isConnectingRef.current = false;
        optionsRef.current.onConnect?.();
        break;
        
      case 'change':
        // FIXED: Use ref to access queryClient without dependency
        const currentQueryClient = queryClientRef.current;
        if (currentQueryClient) {
          // Invalidate relevant queries based on collection
          if (message.collection === 'notifications') {
            currentQueryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_QUERY_KEY] });
          } else if (message.collection === 'features') {
            currentQueryClient.invalidateQueries({ queryKey: FEATURES_QUERY_KEY });
          }
        }
        break;
        
      case 'heartbeat':
        // Connection is alive
        break;
        
      case 'error':
        console.error('Real-time error:', message.data);
        break;
    }
    
    // Call custom message handler
    optionsRef.current.onMessage?.(message);
  }, []); // FIXED: No dependencies to prevent loops

  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // ADDED: Clean up global tracking
    if (globalConnectionRef === eventSourceRef.current) {
      globalConnectionRef = null;
    }
    globalConnectionCount = Math.max(0, globalConnectionCount - 1);
    
    isConnectingRef.current = false;
    setIsConnected(false);
  }, []);

  const disconnect = useCallback(() => {
    cleanup();
    optionsRef.current.onDisconnect?.();
  }, [cleanup]);

  // FIXED: Stable connection function with NO dependencies
  const connectToServer = useCallback(() => {
    // ADDED: Prevent multiple global connections
    if (globalConnectionRef && globalConnectionRef.readyState !== EventSource.CLOSED) {
      console.warn(`🚫 Global connection already exists, skipping new connection for instance ${instanceIdRef.current}`);
      return;
    }
    
    // ADDED: Limit total connections per browser
    if (globalConnectionCount >= 2) {
      console.warn(`🚫 Too many global connections (${globalConnectionCount}), skipping for instance ${instanceIdRef.current}`);
      return;
    }
    
    // Prevent multiple simultaneous connection attempts
    if (isConnectingRef.current || eventSourceRef.current || !shouldConnectRef.current) {
      return;
    }

    isConnectingRef.current = true;
    globalConnectionCount++;

    try {
      const { collections: currentCollections, userId: currentUserId } = optionsRef.current;
      const collectionsParam = currentCollections.join(',');
      let url = `/api/realtime?collections=${encodeURIComponent(collectionsParam)}`;
      
      // Add userId parameter if available
      if (currentUserId) {
        url += `&userId=${encodeURIComponent(currentUserId)}`;
      }
      
      console.log(`🔌 Creating connection for instance ${instanceIdRef.current}`);
      
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;
      globalConnectionRef = eventSource; // Track globally

      eventSource.onopen = () => {
        setConnectionError(null);
        console.log(`✅ Connection opened for instance ${instanceIdRef.current}`);
      };

      eventSource.onmessage = (event) => {
        try {
          const message: RealtimeMessage = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error(`❌ SSE connection error for instance ${instanceIdRef.current}:`, error);
        setIsConnected(false);
        isConnectingRef.current = false;
        
        // More specific error handling based on readyState
        let errorMessage = 'Connection error occurred';
        if (eventSource.readyState === EventSource.CLOSED) {
          errorMessage = 'Connection was closed by server';
        } else if (eventSource.readyState === EventSource.CONNECTING) {
          errorMessage = 'Failed to establish connection';
        }
        
        setConnectionError(errorMessage);
        optionsRef.current.onError?.(error);
        
        // Clean up the failed connection
        if (eventSourceRef.current === eventSource) {
          eventSourceRef.current = null;
        }
        
        if (globalConnectionRef === eventSource) {
          globalConnectionRef = null;
        }
        globalConnectionCount = Math.max(0, globalConnectionCount - 1);
        
        // Schedule reconnection if we haven't exceeded max attempts and still enabled
        if (shouldConnectRef.current && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = baseReconnectDelay * Math.pow(2, reconnectAttemptsRef.current);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (shouldConnectRef.current) {
              reconnectAttemptsRef.current += 1;
              setReconnectAttempts(reconnectAttemptsRef.current);
              connectToServer();
            }
          }, delay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setConnectionError('Failed to establish connection after multiple attempts');
        }
      };

    } catch (error) {
      console.error('Error creating SSE connection:', error);
      setConnectionError('Failed to create connection');
      isConnectingRef.current = false;
      globalConnectionCount = Math.max(0, globalConnectionCount - 1);
    }
  }, []); // FIXED: NO dependencies at all!

  // FIXED: Remove ALL dependencies to prevent loops
  const forceReconnect = useCallback(() => {
    setReconnectAttempts(0);
    reconnectAttemptsRef.current = 0;
    setConnectionError(null);
    
    // Clear any pending reconnection attempts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Use refs to avoid dependencies
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    isConnectingRef.current = false;
    setIsConnected(false);
    
    // Wait a bit before reconnecting
    setTimeout(() => {
      if (shouldConnectRef.current) {
        connectToServer();
      }
    }, 100);
  }, []); // FIXED: NO dependencies!

  // FIXED: Simplified useEffect with stable dependencies
  useEffect(() => {
    if (enabled && !eventSourceRef.current && !isConnectingRef.current) {
      connectToServer();
    } else if (!enabled) {
      cleanup();
    }
    
    return () => {
      cleanup();
    };
  }, [enabled]); // FIXED: Only enabled dependency to prevent loops

  // Handle page visibility changes - FIXED: No dependencies
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && shouldConnectRef.current && !isConnected && !isConnectingRef.current) {
        // Use refs to avoid dependencies
        setReconnectAttempts(0);
        reconnectAttemptsRef.current = 0;
        setConnectionError(null);
        
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
        
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
        
        isConnectingRef.current = false;
        setIsConnected(false);
        
        setTimeout(() => {
          if (shouldConnectRef.current) {
            connectToServer();
          }
        }, 100);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []); // FIXED: No dependencies

  // Handle online/offline events - FIXED: No dependencies
  useEffect(() => {
    const handleOnline = () => {
      if (shouldConnectRef.current && !isConnected && !isConnectingRef.current) {
        // Use refs to avoid dependencies
        setReconnectAttempts(0);
        reconnectAttemptsRef.current = 0;
        setConnectionError(null);
        
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
        
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
        
        isConnectingRef.current = false;
        setIsConnected(false);
        
        setTimeout(() => {
          if (shouldConnectRef.current) {
            connectToServer();
          }
        }, 100);
      }
    };

    const handleOffline = () => {
      setConnectionError('Network offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []); // FIXED: No dependencies

  return {
    isConnected,
    connectionError,
    lastMessage,
    reconnectAttempts,
    forceReconnect,
    disconnect
  };
};

export default useRealtime; 