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

  // Store options in refs to avoid dependency issues
  const optionsRef = useRef({
    collections,
    userId,
    onMessage,
    onError,
    onConnect,
    onDisconnect
  });

  // Update options ref when they change
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
  const baseReconnectDelay = 1000; // 1 second

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
        // Invalidate relevant queries based on collection
        if (message.collection === 'notifications') {
          queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_QUERY_KEY] });
        } else if (message.collection === 'features') {
          queryClient.invalidateQueries({ queryKey: FEATURES_QUERY_KEY });
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
  }, [queryClient]);

  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    isConnectingRef.current = false;
    setIsConnected(false);
  }, []);

  const disconnect = useCallback(() => {
    cleanup();
    optionsRef.current.onDisconnect?.();
  }, [cleanup]);

  // Main connection function - no dependencies to avoid cycles
  const connectToServer = useCallback(() => {
    // Prevent multiple simultaneous connection attempts
    if (isConnectingRef.current || eventSourceRef.current || !shouldConnectRef.current) {
      return;
    }

    isConnectingRef.current = true;

    try {
      const { collections: currentCollections, userId: currentUserId } = optionsRef.current;
      const collectionsParam = currentCollections.join(',');
      let url = `/api/realtime?collections=${encodeURIComponent(collectionsParam)}`;
      
      // Add userId parameter if available
      if (currentUserId) {
        url += `&userId=${encodeURIComponent(currentUserId)}`;
      }
      
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setConnectionError(null);
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
        console.error('SSE connection error:', error);
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
    }
  }, [handleMessage]); // Only depend on handleMessage

  const forceReconnect = useCallback(() => {
    setReconnectAttempts(0);
    reconnectAttemptsRef.current = 0;
    setConnectionError(null);
    
    // Clear any pending reconnection attempts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    cleanup();
    
    // Wait a bit before reconnecting
    setTimeout(() => {
      if (shouldConnectRef.current) {
        connectToServer();
      }
    }, 100);
  }, [cleanup, connectToServer]);

  // Initialize connection when enabled changes
  useEffect(() => {
    if (enabled && !eventSourceRef.current && !isConnectingRef.current) {
      connectToServer();
    } else if (!enabled) {
      cleanup();
    }
    
    return () => {
      cleanup();
    };
  }, [enabled, connectToServer, cleanup]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && enabled && !isConnected && !isConnectingRef.current) {
        forceReconnect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, isConnected, forceReconnect]);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      if (enabled && !isConnected && !isConnectingRef.current) {
        forceReconnect();
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
  }, [enabled, isConnected, forceReconnect]);

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