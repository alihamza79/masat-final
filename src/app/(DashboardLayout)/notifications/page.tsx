'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from 'react';
import {
  Grid, 
  Box, 
  Typography, 
  Button, 
  CircularProgress, 
  TextField, 
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Badge,
  useTheme,
  Chip,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from '@mui/material';
import PageContainer from '@/app/components/container/PageContainer';
import { 
  IconBell, 
  IconBellOff, 
  IconSearch, 
  IconFilter, 
  IconCalendarTime, 
  IconTrash, 
  IconDotsVertical, 
  IconEye,
  IconCheck,
  IconX,
  IconAlertTriangle,
  IconInfoCircle,
  IconClock,
  IconBulb,
  IconRefresh
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import useAuth from '@/lib/hooks/useAuth';
import useNotifications, { Notification, NotificationsFilter } from '@/lib/hooks/useNotifications';
import { format, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';
import DeleteConfirmationDialog from '@/app/components/dialogs/DeleteConfirmationDialog';

// Define filter types
type ReadFilterType = 'all' | 'unread' | 'read';
type TimeFilterType = '' | 'today' | 'yesterday' | 'week' | 'month';

const NotificationsPage = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  
  // State for filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [readFilter, setReadFilter] = useState<ReadFilterType>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilterType>('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [timeFilterAnchorEl, setTimeFilterAnchorEl] = useState<null | HTMLElement>(null);
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
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(0); // Reset to first page on search
  };

  // Handle filter menu
  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterMenuClose = () => {
    setFilterAnchorEl(null);
  };

  const handleFilterChange = (type: ReadFilterType) => {
    setReadFilter(type);
    setPage(0); // Reset to first page on filter change
    handleFilterMenuClose();
  };

  // Handle time filter menu
  const handleTimeFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setTimeFilterAnchorEl(event.currentTarget);
  };

  const handleTimeFilterMenuClose = () => {
    setTimeFilterAnchorEl(null);
  };

  const handleTimeFilterChange = (type: TimeFilterType) => {
    setTimeFilter(type);
    setPage(0); // Reset to first page on filter change
    handleTimeFilterMenuClose();
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

  // Get filter button text
  const getFilterButtonText = () => {
    switch (readFilter) {
      case 'all':
        return t('notifications.filter.all');
      case 'unread':
        return t('notifications.filter.unread');
      case 'read':
        return t('notifications.filter.read');
      default:
        return t('notifications.filter.all');
    }
  };

  // Get time filter button text
  const getTimeFilterButtonText = () => {
    switch (timeFilter) {
      case 'today':
        return t('notifications.timeFilter.today');
      case 'yesterday':
        return t('notifications.timeFilter.yesterday');
      case 'week':
        return t('notifications.timeFilter.week');
      case 'month':
        return t('notifications.timeFilter.month');
      default:
        return t('notifications.timeFilter.all');
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy • h:mm a');
    } catch (error) {
      return 'Unknown date';
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'feature_update':
        return <IconBulb size={20} color={theme.palette.primary.main} />;
      case 'feature_status_change':
        return <IconBulb size={20} color={theme.palette.primary.main} />;
      case 'system':
        return <IconInfoCircle size={20} color={theme.palette.warning.main} />;
      default:
        return <IconAlertTriangle size={20} color={theme.palette.text.secondary} />;
    }
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
            <Box 
              display="flex" 
              alignItems="center" 
              justifyContent="space-between" 
              mb={3}
              flexDirection={{ xs: 'column', sm: 'row' }}
              gap={2}
            >
              <Typography 
                variant="h2" 
                sx={{ 
                  fontSize: { xs: '1.5rem', md: 'h2.fontSize' },
                  textAlign: { xs: 'center', sm: 'left' },
                  width: '100%'
                }}
              >
                {t('notifications.pageTitle')}
                {unreadCount > 0 && (
                  <Chip
                    size="small"
                    label={unreadCount}
                    color="primary"
                    sx={{ ml: 1, height: '20px', fontSize: '0.75rem' }}
                  />
                )}
              </Typography>
              <Box 
                display="flex" 
                gap={{ xs: 1, sm: 2 }}
                flexDirection={{ xs: 'column', sm: 'row' }}
                width="100%"
                justifyContent={{ xs: 'stretch', sm: 'flex-end' }}
                alignItems={{ xs: 'stretch', sm: 'center' }}
                flexWrap={{ xs: 'wrap', sm: 'nowrap' }}
              >
                {/* Search Bar */}
                <TextField
                  placeholder={t('notifications.search.placeholder') || "Search notifications..."}
                  size="small"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconSearch size={18} />
                      </InputAdornment>
                    )
                  }}
                  sx={{
                    width: { xs: '100%', sm: '280px', md: '320px' },
                    '& .MuiOutlinedInput-root': {
                      height: '36px',
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }
                  }}
                />

                {/* Controls Row for Mobile */}
                <Box
                  sx={{
                    display: 'flex',
                    gap: { xs: 0.5, sm: 2 },
                    width: { xs: '100%', sm: 'auto' },
                    justifyContent: { xs: 'space-between', sm: 'flex-end' },
                    alignItems: 'center',
                    flexWrap: 'nowrap' // Prevent wrapping
                  }}
                >
                  {/* Read/Unread Filter Button */}
                  <Badge
                    color="primary"
                    variant="dot"
                    invisible={readFilter === 'all'}
                    sx={{ '& .MuiBadge-badge': { right: 1, top: 2 } }}
                  >
                    <Button
                      variant="outlined"
                      size="small"
                      color="inherit"
                      onClick={handleFilterClick}
                      startIcon={readFilter === 'unread' ? <IconBellOff size={16} /> : <IconBell size={16} />}
                      aria-haspopup="true"
                      aria-expanded={Boolean(filterAnchorEl) ? 'true' : undefined}
                      aria-controls="filter-menu"
                      sx={{
                        minHeight: '36px',
                        minWidth: { xs: '32px', sm: '100px' },
                        maxWidth: { xs: '70px', sm: '240px', md: 'none' },
                        textTransform: 'none',
                        color: theme.palette.text.secondary,
                        borderColor: theme.palette.divider,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        fontSize: { xs: '0.7rem', sm: '0.875rem' },
                        px: { xs: 0.5, sm: 1.5 },
                        '& .MuiButton-startIcon': {
                          mr: { xs: 0, sm: 1 },
                          '& svg': {
                            fontSize: { xs: 14, sm: 16 }
                          }
                        },
                        '&:hover': {
                          borderColor: theme.palette.divider,
                          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)'
                        }
                      }}
                    >
                      <Box
                        component="span"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          display: { xs: 'none', sm: 'inline' }
                        }}
                      >
                        {getFilterButtonText()}
                      </Box>
                    </Button>
                  </Badge>

                  {/* Time Filter Button */}
                  <Badge
                    color="primary"
                    variant="dot"
                    invisible={timeFilter === ''}
                    sx={{ '& .MuiBadge-badge': { right: 1, top: 2 } }}
                  >
                    <Button
                      variant="outlined"
                      size="small"
                      color="inherit"
                      onClick={handleTimeFilterClick}
                      startIcon={<IconCalendarTime size={16} />}
                      aria-haspopup="true"
                      aria-expanded={Boolean(timeFilterAnchorEl) ? 'true' : undefined}
                      aria-controls="time-filter-menu"
                      sx={{
                        minHeight: '36px',
                        minWidth: { xs: '32px', sm: '100px' },
                        maxWidth: { xs: '70px', sm: '240px', md: 'none' },
                        textTransform: 'none',
                        color: theme.palette.text.secondary,
                        borderColor: theme.palette.divider,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        fontSize: { xs: '0.7rem', sm: '0.875rem' },
                        px: { xs: 0.5, sm: 1.5 },
                        '& .MuiButton-startIcon': {
                          mr: { xs: 0, sm: 1 },
                          '& svg': {
                            fontSize: { xs: 14, sm: 16 }
                          }
                        },
                        '&:hover': {
                          borderColor: theme.palette.divider,
                          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)'
                        }
                      }}
                    >
                      <Box
                        component="span"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          display: { xs: 'none', sm: 'inline' }
                        }}
                      >
                        {getTimeFilterButtonText()}
                      </Box>
                    </Button>
                  </Badge>

                  {/* Mark All as Read Button - Compact on mobile */}
                  {unreadCount > 0 && (
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<IconCheck size={16} />}
                      onClick={markAllAsRead}
                      disabled={isMarkingAsRead}
                      size="small"
                      sx={{
                        minHeight: '36px',
                        minWidth: { xs: '32px', sm: '120px' },
                        fontSize: { xs: '0.7rem', sm: '0.875rem' },
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        px: { xs: 0.5, sm: 2 },
                        '& .MuiButton-startIcon': {
                          mr: { xs: 0, sm: 1 },
                          '& svg': {
                            fontSize: { xs: 14, sm: 16 }
                          }
                        }
                      }}
                    >
                      <Box
                        component="span"
                        sx={{
                          display: { xs: 'none', sm: 'inline' }
                        }}
                      >
                        {t('notifications.markAllRead')}
                      </Box>
                    </Button>
                  )}

                  {/* Delete All Button */}
                  {filteredNotifications.length > 0 && (
                    <Tooltip title={t('notifications.deleteAll') || "Delete All"}>
                      <IconButton
                        color="error"
                        onClick={handleDeleteAllClick}
                        disabled={isDeleting}
                        size="small"
                        sx={{ 
                          height: '36px', 
                          width: '36px',
                          border: `1px solid ${theme.palette.divider}`,
                          flexShrink: 0
                        }}
                      >
                        <IconTrash size={16} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>
            </Box>
          </Grid>

          {/* Filter Menus */}
          <Menu
            id="filter-menu"
            anchorEl={filterAnchorEl}
            open={Boolean(filterAnchorEl)}
            onClose={handleFilterMenuClose}
            MenuListProps={{
              'aria-labelledby': 'filter-button',
            }}
            PaperProps={{
              elevation: 2,
              sx: { width: 280, maxWidth: '100%', mt: 1.5 }
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem 
              onClick={() => handleFilterChange('all')}
              selected={readFilter === 'all'}
              sx={{ py: 1.5 }}
            >
              <ListItemIcon>
                <IconBell size={18} />
              </ListItemIcon>
              <ListItemText>{t('notifications.filter.all')}</ListItemText>
            </MenuItem>

            <MenuItem 
              onClick={() => handleFilterChange('unread')}
              selected={readFilter === 'unread'}
              sx={{ py: 1.5 }}
            >
              <ListItemIcon>
                <IconBellOff size={18} />
              </ListItemIcon>
              <ListItemText>
                {t('notifications.filter.unread')}
                {unreadCount > 0 && (
                  <Typography 
                    component="span" 
                    sx={{ 
                      ml: 1, 
                      fontSize: '0.75rem', 
                      color: theme.palette.primary.main,
                      fontWeight: 600, 
                      p: 0.5,
                      borderRadius: '10px',
                      backgroundColor: theme.palette.primary.light,
                      opacity: 0.8
                    }}
                  >
                    {unreadCount}
                  </Typography>
                )}
              </ListItemText>
            </MenuItem>

            <MenuItem 
              onClick={() => handleFilterChange('read')}
              selected={readFilter === 'read'}
              sx={{ py: 1.5 }}
            >
              <ListItemIcon>
                <IconCheck size={18} />
              </ListItemIcon>
              <ListItemText>{t('notifications.filter.read')}</ListItemText>
            </MenuItem>
          </Menu>

          <Menu
            id="time-filter-menu"
            anchorEl={timeFilterAnchorEl}
            open={Boolean(timeFilterAnchorEl)}
            onClose={handleTimeFilterMenuClose}
            MenuListProps={{
              'aria-labelledby': 'time-filter-button',
            }}
            PaperProps={{
              elevation: 2,
              sx: { width: 280, maxWidth: '100%', mt: 1.5 }
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem 
              onClick={() => handleTimeFilterChange('')}
              selected={timeFilter === ''}
              sx={{ py: 1.5 }}
            >
              <ListItemIcon>
                <IconCalendarTime size={18} />
              </ListItemIcon>
              <ListItemText>{t('notifications.timeFilter.all')}</ListItemText>
            </MenuItem>

            <MenuItem 
              onClick={() => handleTimeFilterChange('today')}
              selected={timeFilter === 'today'}
              sx={{ py: 1.5 }}
            >
              <ListItemIcon>
                <IconClock size={18} />
              </ListItemIcon>
              <ListItemText>{t('notifications.timeFilter.today')}</ListItemText>
            </MenuItem>

            <MenuItem 
              onClick={() => handleTimeFilterChange('yesterday')}
              selected={timeFilter === 'yesterday'}
              sx={{ py: 1.5 }}
            >
              <ListItemIcon>
                <IconClock size={18} />
              </ListItemIcon>
              <ListItemText>{t('notifications.timeFilter.yesterday')}</ListItemText>
            </MenuItem>

            <MenuItem 
              onClick={() => handleTimeFilterChange('week')}
              selected={timeFilter === 'week'}
              sx={{ py: 1.5 }}
            >
              <ListItemIcon>
                <IconClock size={18} />
              </ListItemIcon>
              <ListItemText>{t('notifications.timeFilter.week')}</ListItemText>
            </MenuItem>

            <MenuItem 
              onClick={() => handleTimeFilterChange('month')}
              selected={timeFilter === 'month'}
              sx={{ py: 1.5 }}
            >
              <ListItemIcon>
                <IconClock size={18} />
              </ListItemIcon>
              <ListItemText>{t('notifications.timeFilter.month')}</ListItemText>
            </MenuItem>
          </Menu>

          {/* Notifications Table */}
          <Grid item xs={12}>
            <Paper elevation={1} sx={{ width: '100%', overflow: 'hidden', borderRadius: 1, boxShadow: theme.shadows[1] }}>
              <TableContainer sx={{ maxHeight: 'none' }}>
                <Table stickyHeader aria-label="notifications table">
                  <TableHead>
                    <TableRow>
                      <TableCell width="60px">{t('notifications.table.type')}</TableCell>
                      <TableCell>{t('notifications.table.message')}</TableCell>
                      <TableCell width="200px">{t('notifications.table.date')}</TableCell>
                      <TableCell align="right" width="100px">{t('notifications.table.actions')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ height: 300 }}>
                          <CircularProgress />
                        </TableCell>
                      </TableRow>
                    ) : paginatedNotifications.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ height: 200 }}>
                          <Typography variant="body1" color="textSecondary">
                            {t('notifications.table.noNotifications')}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedNotifications.map((notification) => (
                        <TableRow
                          hover
                          key={notification._id}
                          sx={{ 
                            '&:last-child td, &:last-child th': { border: 0 },
                            cursor: 'pointer',
                            backgroundColor: notification.read ? 'transparent' : 'action.hover',
                            // Add left border if unread
                            borderLeft: notification.read ? 'none' : `3px solid ${theme.palette.primary.main}`,
                          }}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <TableCell>
                            <Box display="flex" justifyContent="center">
                              {getNotificationIcon(notification.type)}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              fontWeight={notification.read ? 400 : 600}
                              color="textPrimary"
                            >
                              {notification.title}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="textSecondary"
                              sx={{ mt: 0.5, display: 'block' }}
                            >
                              {notification.message}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="textSecondary">
                              {formatDate(notification.createdAt)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                            <Box display="flex" alignItems="center" justifyContent="flex-end" gap={1}>
                              {/* View button */}
                              <IconButton
                                onClick={() => handleViewNotification(notification)}
                                size="small"
                                color="default"
                                sx={{ 
                                  width: 32, 
                                  height: 32, 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center' 
                                }}
                              >
                                <IconEye size={18} />
                              </IconButton>
                              
                              {/* Delete button - replacing the action menu */}
                              <IconButton 
                                onClick={() => {
                                  setSelectedNotification(notification);
                                  setDeleteDialogOpen(true);
                                }}
                                size="small"
                                color="error"
                                sx={{ 
                                  width: 32, 
                                  height: 32, 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center' 
                                }}
                              >
                                <IconTrash size={18} />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {/* Pagination */}
              {!isLoading && paginatedNotifications.length > 0 && (
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  component="div"
                  count={totalFilteredCount}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Notification Detail Dialog */}
        <Dialog
          open={notificationDetailOpen}
          onClose={handleCloseNotificationDetail}
          fullWidth
          maxWidth="sm"
          PaperProps={{
            sx: {
              borderRadius: 1,
              maxWidth: '550px'
            }
          }}
        >
          {selectedNotification && (
            <>
              <DialogTitle sx={{ pb: 1 }}>
                <Box display="flex" alignItems="center" gap={2}>
                  {getNotificationIcon(selectedNotification.type)}
                  <Typography variant="h6" component="div">
                    {selectedNotification.title}
                  </Typography>
                </Box>
              </DialogTitle>
              <DialogContent>
                <Typography 
                  variant="caption" 
                  color="textSecondary" 
                  component="div" 
                  sx={{ mb: 2 }}
                >
                  {formatDate(selectedNotification.createdAt)}
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {selectedNotification.message}
                </Typography>
              </DialogContent>
              <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={handleCloseNotificationDetail} variant="outlined">
                  {t('common.close')}
                </Button>
                {/* Only show for feature notifications */}
                {(selectedNotification.type === 'feature_update' || selectedNotification.type === 'feature_status_change') && 
                 selectedNotification.referenceId && (
                  <Button 
                    onClick={() => {
                      if (typeof window !== 'undefined' && selectedNotification.referenceId) {
                        sessionStorage.setItem('selectedFeatureId', selectedNotification.referenceId);
                        sessionStorage.setItem('featureNotificationClicked', Date.now().toString());
                        router.push('/development-requests');
                      }
                    }}
                    variant="contained" 
                    color="primary"
                  >
                    {t('notifications.viewFeature')}
                  </Button>
                )}
              </DialogActions>
            </>
          )}
        </Dialog>

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