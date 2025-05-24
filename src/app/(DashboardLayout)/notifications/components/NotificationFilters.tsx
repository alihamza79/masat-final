import { useState } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  Button,
  Badge,
  Chip,
  Typography,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  useTheme
} from '@mui/material';
import {
  IconBell,
  IconBellOff,
  IconSearch,
  IconCalendarTime,
  IconTrash,
  IconCheck,
  IconClock
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { ReadFilterType, TimeFilterType } from '../types';

// Define filter types
// type ReadFilterType = 'all' | 'unread' | 'read';
// type TimeFilterType = '' | 'today' | 'yesterday' | 'week' | 'month';

interface NotificationFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  readFilter: ReadFilterType;
  onReadFilterChange: (filter: ReadFilterType) => void;
  timeFilter: TimeFilterType;
  onTimeFilterChange: (filter: TimeFilterType) => void;
  unreadCount: number;
  onMarkAllAsRead: () => void;
  onDeleteAll: () => void;
  isMarkingAsRead: boolean;
  isDeleting: boolean;
  totalNotifications: number;
}

const NotificationFilters = ({
  searchQuery,
  onSearchChange,
  readFilter,
  onReadFilterChange,
  timeFilter,
  onTimeFilterChange,
  unreadCount,
  onMarkAllAsRead,
  onDeleteAll,
  isMarkingAsRead,
  isDeleting,
  totalNotifications
}: NotificationFiltersProps) => {
  const { t } = useTranslation();
  const theme = useTheme();

  // State for filter menus
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [timeFilterAnchorEl, setTimeFilterAnchorEl] = useState<null | HTMLElement>(null);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  // Handle filter menu
  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterMenuClose = () => {
    setFilterAnchorEl(null);
  };

  const handleFilterChange = (type: ReadFilterType) => {
    onReadFilterChange(type);
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
    onTimeFilterChange(type);
    handleTimeFilterMenuClose();
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

  return (
    <>
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
              flexWrap: 'nowrap'
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
                onClick={onMarkAllAsRead}
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
            {totalNotifications > 0 && (
              <Tooltip title={t('notifications.deleteAll') || "Delete All"}>
                <IconButton
                  color="error"
                  onClick={onDeleteAll}
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
    </>
  );
};

export default NotificationFilters; 