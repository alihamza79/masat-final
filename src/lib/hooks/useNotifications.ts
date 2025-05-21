import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export const NOTIFICATIONS_QUERY_KEY = 'notifications';

// Polling interval for notifications (5 seconds)
const NOTIFICATION_REFRESH_INTERVAL = 5000;

export interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'feature_update' | 'feature_status_change' | 'system' | 'other';
  referenceId?: string;
  referenceType?: string;
  read: boolean;
  createdAt: string;
}

const useNotifications = (limit: number = 5) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isMarkingAsRead, setIsMarkingAsRead] = useState(false);

  // Fetch notifications
  const { 
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: [NOTIFICATIONS_QUERY_KEY, limit],
    queryFn: async () => {
      const response = await axios.get(`/api/notifications?limit=${limit}`);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch notifications');
      }
      return response.data.data;
    },
    // Use short polling interval (5 seconds)
    refetchInterval: NOTIFICATION_REFRESH_INTERVAL,
    // Very short stale time to ensure frequent background refreshes
    staleTime: 1000, // 1 second
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  // Mark notifications as read
  const markAsRead = async (notificationIds?: string[]) => {
    if (isMarkingAsRead) return;
    
    try {
      setIsMarkingAsRead(true);
      
      const payload = notificationIds 
        ? { notificationIds } 
        : { markAll: true };
      
      const response = await axios.put('/api/notifications', payload);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to mark notifications as read');
      }
      
      // Invalidate the notifications query to refresh data
      queryClient.invalidateQueries({
        queryKey: [NOTIFICATIONS_QUERY_KEY]
      });
      
      return response.data.data;
    } catch (error: any) {
      toast.error(error.message || 'Failed to mark notifications as read');
      throw error;
    } finally {
      setIsMarkingAsRead(false);
    }
  };

  // Mark a single notification as read
  const markOneAsRead = async (notificationId: string) => {
    return markAsRead([notificationId]);
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    return markAsRead();
  };

  // Force refresh notifications
  const forceRefresh = () => {
    return queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_QUERY_KEY] });
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    isMarkingAsRead,
    markOneAsRead,
    markAllAsRead,
    refetchNotifications: forceRefresh
  };
};

export default useNotifications; 