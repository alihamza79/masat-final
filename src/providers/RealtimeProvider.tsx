'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import useRealtime, { RealtimeMessage } from '@/lib/hooks/useRealtime';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { toast } from 'react-hot-toast';

interface RealtimeContextType {
  isConnected: boolean;
  connectionError: string | null;
  lastMessage: RealtimeMessage | null;
  reconnectAttempts: number;
  forceReconnect: () => void;
  disconnect: () => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const useRealtimeContext = () => {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtimeContext must be used within a RealtimeProvider');
  }
  return context;
};

interface RealtimeProviderProps {
  children: React.ReactNode;
}

export const RealtimeProvider: React.FC<RealtimeProviderProps> = ({ children }) => {
  const { status } = useSession();
  const { user, isLoading: userLoading } = useCurrentUser();
  const [hasShownInitialToast, setHasShownInitialToast] = useState(false);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const disconnectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Only enable real-time connection when user is authenticated AND we have a valid user ID
  const isEnabled = status === 'authenticated' && !!user?.id && user.isAuthenticated && !userLoading;

  const {
    isConnected,
    connectionError,
    lastMessage,
    reconnectAttempts,
    forceReconnect,
    disconnect
  } = useRealtime({
    collections: ['notifications', 'features'],
    enabled: isEnabled,
    userId: user?.id, // Use user ID from useCurrentUser hook
    onConnect: () => {
      // Clear any pending disconnection toast
      if (disconnectionTimeoutRef.current) {
        clearTimeout(disconnectionTimeoutRef.current);
        disconnectionTimeoutRef.current = null;
      }

      // Only show connection toast after a stable connection (2 seconds)
      connectionTimeoutRef.current = setTimeout(() => {
        if (!hasShownInitialToast) {
          // Removed toast notification to avoid spam
          setHasShownInitialToast(true);
        }
      }, 2000);
    },
    onDisconnect: () => {
      // Clear any pending connection toast
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }

      // Only show disconnection toast if we had a stable connection and after a delay
      if (hasShownInitialToast) {
        disconnectionTimeoutRef.current = setTimeout(() => {
          toast.error('🔌 Real-time updates disconnected', {
            duration: 3000,
            position: 'bottom-right',
          });
        }, 1000);
      }
    },
    onMessage: (message) => {
      // Real-time updates are now handled automatically by query invalidation
      // No need for toast notifications since the UI updates in real-time
      if (process.env.NODE_ENV === 'development') {
        console.log('📡 Real-time message received:', message);
      }
    },
    onError: (error) => {
      console.error('Real-time connection error:', error);
      // Only show error toast for persistent errors (after multiple attempts)
      if (reconnectAttempts >= 2) {
        console.log('❌ Real-time connection error');
      }
    }
  });

  // Show connection status in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔌 Real-time connection status:', {
        isEnabled,
        isConnected,
        connectionError,
        reconnectAttempts
      });
    }
  }, [isEnabled, isConnected, connectionError, reconnectAttempts]);

  // Show persistent error notification for connection issues
  useEffect(() => {
    if (connectionError && reconnectAttempts >= 3) {
      toast.error(
        `❌ Connection issues detected. ${connectionError}`,
        {
          duration: 6000,
          position: 'bottom-right',
        }
      );
    }
  }, [connectionError, reconnectAttempts]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
      if (disconnectionTimeoutRef.current) {
        clearTimeout(disconnectionTimeoutRef.current);
      }
    };
  }, []);

  const contextValue: RealtimeContextType = {
    isConnected,
    connectionError,
    lastMessage,
    reconnectAttempts,
    forceReconnect,
    disconnect
  };

  return (
    <RealtimeContext.Provider value={contextValue}>
      {children}
    </RealtimeContext.Provider>
  );
};

export default RealtimeProvider; 