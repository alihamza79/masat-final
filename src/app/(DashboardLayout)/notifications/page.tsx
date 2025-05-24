'use client';
export const dynamic = 'force-dynamic';

import { useState, useMemo } from 'react';
import { Grid, Box, CircularProgress } from '@mui/material';
import PageContainer from '@/app/components/container/PageContainer';
import { useTranslation } from 'react-i18next';
import useAuth from '@/lib/hooks/useAuth';
import useNotifications, { Notification, NotificationsFilter } from '@/lib/hooks/useNotifications';
import { useRouter } from 'next/navigation';
import DeleteConfirmationDialog from '@/app/components/dialogs/DeleteConfirmationDialog';
import {
  NotificationFilters,
  NotificationTable,
  NotificationDetailDialog
} from './components';
import { ReadFilterType, TimeFilterType } from './types';

const NotificationsPage = () => {
  const { t } = useTranslation();
  const router = useRouter();
  
  // State for filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [readFilter, setReadFilter] = useState<ReadFilterType>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilterType>('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [notificationDetailOpen, setNotificationDetailOpen] = useState(false);

  // Use a constant filter for getting all notifications, not applying server-side filters
  const baseFilterOptions: NotificationsFilter = {
    limit: 100, // Get a larger batch of notifications to allow for client-side filtering
    page: 1,
  };

  // Get notifications with minimal server-side filters
  const {
    notifications: allNotifications,
    unreadCount,
    pagination,
    isLoading,
    isMarkingAsRead,
    isDeleting,
    markOneAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    refetchNotifications
  } = useNotifications(baseFilterOptions);
  
  // Apply client-side filters
  const filteredNotifications = useMemo(() => {
    let result = [...allNotifications];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(notification => 
        notification.title.toLowerCase().includes(query) || 
        notification.message.toLowerCase().includes(query)
      );
    }
    
    // Apply read/unread filter
    if (readFilter === 'unread') {
      result = result.filter(notification => !notification.read);
    } else if (readFilter === 'read') {
      result = result.filter(notification => notification.read);
    }
    
    // Apply time filter
    if (timeFilter) {
      const now = new Date();
      let startDate = new Date();
      let endDate = new Date();
      
      switch (timeFilter) {
        case 'today':
          // Start of today
          startDate.setHours(0, 0, 0, 0);
          // End of today
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'yesterday':
          // Start of yesterday
          startDate.setDate(startDate.getDate() - 1);
          startDate.setHours(0, 0, 0, 0);
          // End of yesterday
          endDate.setDate(endDate.getDate() - 1);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'week':
          // Last 7 days
          startDate.setDate(startDate.getDate() - 7);
          startDate.setHours(0, 0, 0, 0);
          // End of today
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'month':
          // Last 30 days
          startDate.setDate(startDate.getDate() - 30);
          startDate.setHours(0, 0, 0, 0);
          // End of today
          endDate.setHours(23, 59, 59, 999);
          break;
      }
      
      result = result.filter(notification => {
        const notificationDate = new Date(notification.createdAt);
        return notificationDate >= startDate && notificationDate <= endDate;
      });
    }
    
    return result;
  }, [allNotifications, searchQuery, readFilter, timeFilter]);
  
  // Apply pagination to filtered results
  const paginatedNotifications = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredNotifications.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredNotifications, page, rowsPerPage]);
  
  // Update page count based on filtered results
  const totalFilteredCount = filteredNotifications.length;

  // Handle page change
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(0); // Reset to first page on search
  };

  // Handle filter changes
  const handleReadFilterChange = (filter: ReadFilterType) => {
    setReadFilter(filter);
    setPage(0); // Reset to first page on filter change
  };

  const handleTimeFilterChange = (filter: TimeFilterType) => {
    setTimeFilter(filter);
    setPage(0); // Reset to first page on filter change
  };

  // Handle notification view
  const handleViewNotification = (notification: Notification) => {
    setSelectedNotification(notification);
    setNotificationDetailOpen(true);
    
    // Mark as read if unread
    if (!notification.read) {
      markOneAsRead(notification._id);
    }
  };

  // Handle notification click to view details
  const handleNotificationClick = (notification: Notification) => {
    // If it's a feature notification, navigate to the feature
    if (
      (notification.type === 'feature_update' || notification.type === 'feature_status_change') &&
      notification.referenceId && 
      notification.referenceType === 'Feature'
    ) {
      // Store feature ID in sessionStorage
      if (typeof window !== 'undefined') {
        // Store the ID and set timestamp to force reload of feature data
        sessionStorage.setItem('selectedFeatureId', notification.referenceId);
        sessionStorage.setItem('featureNotificationClicked', Date.now().toString());
        
        // Navigate to the development requests page
        router.push('/development-requests');
      }
    } else {
      // For other notification types just show the detail
      handleViewNotification(notification);
    }
    
    // Mark as read if unread
    if (!notification.read) {
      markOneAsRead(notification._id);
    }
  };

  // Handle delete notification
  const handleDeleteNotification = (notification: Notification) => {
    setSelectedNotification(notification);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedNotification) {
      try {
        await deleteNotification(selectedNotification._id);
        setDeleteDialogOpen(false);
      } catch (error) {
        // Error handling is done by the hook
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  // Handle delete all notifications
  const handleDeleteAllClick = () => {
    setDeleteAllDialogOpen(true);
  };

  const handleDeleteAllConfirm = async () => {
    try {
      await deleteAllNotifications();
      setDeleteAllDialogOpen(false);
    } catch (error) {
      // Error handling is done by the hook
    }
  };

  const handleDeleteAllCancel = () => {
    setDeleteAllDialogOpen(false);
  };

  // Handle close notification detail
  const handleCloseNotificationDetail = () => {
    setNotificationDetailOpen(false);
    setSelectedNotification(null);
  };

  // Loading state
  const { loading } = useAuth();
  if (loading) {
    return (
      <PageContainer title={t('notifications.pageTitle')} description={t('notifications.pageDescription')}>
        <Box sx={{ bgcolor: 'background.paper', p: 3, borderRadius: 1, boxShadow: 1 }} display="flex" justifyContent="center">
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title={t('notifications.pageTitle')} description={t('notifications.pageDescription')}>
      <Box>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <NotificationFilters
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              readFilter={readFilter}
              onReadFilterChange={handleReadFilterChange}
              timeFilter={timeFilter}
              onTimeFilterChange={handleTimeFilterChange}
              unreadCount={unreadCount}
              onMarkAllAsRead={markAllAsRead}
              onDeleteAll={handleDeleteAllClick}
              isMarkingAsRead={isMarkingAsRead}
              isDeleting={isDeleting}
              totalNotifications={filteredNotifications.length}
            />
          </Grid>

          {/* Notifications Table */}
          <Grid item xs={12}>
            <NotificationTable
              notifications={paginatedNotifications}
              totalCount={totalFilteredCount}
              page={page}
              rowsPerPage={rowsPerPage}
              isLoading={isLoading}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              onNotificationView={handleViewNotification}
              onNotificationDelete={handleDeleteNotification}
              onNotificationClick={handleNotificationClick}
            />
          </Grid>
        </Grid>

        {/* Notification Detail Dialog */}
        <NotificationDetailDialog
          open={notificationDetailOpen}
          notification={selectedNotification}
          onClose={handleCloseNotificationDetail}
        />

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmationDialog
          open={deleteDialogOpen}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          integrationName={selectedNotification?.title || t('notifications.deleteDialog.thisNotification')}
          title={t('notifications.deleteDialog.title')}
          message={t('notifications.deleteDialog.content')}
        />

        {/* Delete All Confirmation Dialog */}
        <DeleteConfirmationDialog
          open={deleteAllDialogOpen}
          onClose={handleDeleteAllCancel}
          onConfirm={handleDeleteAllConfirm}
          integrationName={t('notifications.deleteAllDialog.allNotifications')}
          title={t('notifications.deleteAllDialog.title')}
          message={t('notifications.deleteAllDialog.content')}
        />
      </Box>
    </PageContainer>
  );
};

export default NotificationsPage; 