import { useState, useCallback } from 'react';
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

export interface NotificationsFilter {
  limit?: number;
  page?: number;
  unreadOnly?: boolean;
  search?: string;
  type?: string;
  timeRange?: 'today' | 'yesterday' | 'week' | 'month' | '';
  startDate?: string;
  endDate?: string;
}

const useNotifications = (options: NotificationsFilter = {}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isMarkingAsRead, setIsMarkingAsRead] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const {
    limit = 10,
    page = 1,
    unreadOnly = false,
    search = '',
    type = '',
    timeRange = '',
    startDate = '',
    endDate = ''
  } = options;

  // Build query parameters
  const buildQueryParams = useCallback(() => {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    params.append('page', page.toString());
    
    if (unreadOnly) {
      params.append('unreadOnly', 'true');
    }
    
    if (search) {
      params.append('search', search);
    }
    
    if (type) {
      params.append('type', type);
    }
    
    if (timeRange) {
      params.append('timeRange', timeRange);
    }
    
    if (startDate && endDate) {
      params.append('startDate', startDate);
      params.append('endDate', endDate);
    }
    
    return params.toString();
  }, [limit, page, unreadOnly, search, type, timeRange, startDate, endDate]);

  // Fetch notifications
  const { 
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: [NOTIFICATIONS_QUERY_KEY, limit, page, unreadOnly, search, type, timeRange, startDate, endDate],
    queryFn: async () => {
      const queryString = buildQueryParams();
      const response = await axios.get(`/api/notifications?${queryString}`);
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
  const pagination = data?.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 };

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
  
  // Delete a notification
  const deleteNotification = async (notificationId: string) => {
    if (isDeleting) return;
    
    try {
      setIsDeleting(true);
      
      const response = await axios.delete(`/api/notifications?id=${notificationId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to delete notification');
      }
      
      // Invalidate the notifications query to refresh data
      queryClient.invalidateQueries({
        queryKey: [NOTIFICATIONS_QUERY_KEY]
      });
      
      toast.success(t('notifications.deleteSuccess') || 'Notification deleted');
      return response.data.data;
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete notification');
      throw error;
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Delete all notifications
  const deleteAllNotifications = async () => {
    if (isDeleting) return;
    
    try {
      setIsDeleting(true);
      
      const response = await axios.delete('/api/notifications?all=true');
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to delete all notifications');
      }
      
      // Invalidate the notifications query to refresh data
      queryClient.invalidateQueries({
        queryKey: [NOTIFICATIONS_QUERY_KEY]
      });
      
      toast.success(t('notifications.deleteAllSuccess') || 'All notifications deleted');
      return response.data.data;
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete all notifications');
      throw error;
    } finally {
      setIsDeleting(false);
    }
  };

  // Force refresh notifications
  const forceRefresh = () => {
    return queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_QUERY_KEY] });
  };

  return {
    notifications,
    unreadCount,
    pagination,
    isLoading,
    error,
    isMarkingAsRead,
    isDeleting,
    markOneAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    refetchNotifications: forceRefresh
  };
};

export default useNotifications; 