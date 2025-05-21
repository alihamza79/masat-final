import React, { useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Typography,
  CircularProgress,
  TablePagination,
  useTheme,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip
} from '@mui/material';
import {
  IconEdit,
  IconTrash,
  IconDotsVertical,
  IconEye,
  IconBulb,
  IconCode
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { Feature } from '@/lib/hooks/useFeatures';
import DeleteConfirmationDialog from '@/app/components/dialogs/DeleteConfirmationDialog';
import { useSession } from 'next-auth/react';
import useFeatureOwnership from '@/lib/hooks/useFeatureOwnership';

interface FeaturesTableProps {
  features: Feature[];
  isLoading: boolean;
  onViewFeature: (feature: Feature) => void;
  onEditFeature: (feature: Feature) => void;
  onDeleteFeature: (id: string) => void;
}

// Define return type for formatDate function
interface FormattedDate {
  fullDate: string;
  relativeTime: string;
}

const FeaturesTable: React.FC<FeaturesTableProps> = ({
  features,
  isLoading,
  onViewFeature,
  onEditFeature,
  onDeleteFeature,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [openConfirmDelete, setOpenConfirmDelete] = useState<boolean>(false);
  const [deleteFeatureId, setDeleteFeatureId] = useState<string>('');
  const { data: session } = useSession();
  const { isOwner } = useFeatureOwnership();

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, feature: Feature) => {
    setAnchorEl(event.currentTarget);
    setSelectedFeature(feature);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleOpenConfirmDelete = (id: string) => {
    setDeleteFeatureId(id);
    setOpenConfirmDelete(true);
    handleMenuClose();
  };

  const handleConfirmDelete = () => {
    if (deleteFeatureId) {
      onDeleteFeature(deleteFeatureId);
      setOpenConfirmDelete(false);
      setDeleteFeatureId('');
    }
  };

  const handleCancelDelete = () => {
    setOpenConfirmDelete(false);
    setDeleteFeatureId('');
  };

  const handleView = () => {
    if (selectedFeature) {
      onViewFeature(selectedFeature);
      handleMenuClose();
    }
  };

  const handleEdit = () => {
    if (selectedFeature) {
      onEditFeature(selectedFeature);
      handleMenuClose();
    }
  };

  // Format date for display with explicit return type
  const formatDate = (dateString: string | Date): FormattedDate => {
    if (!dateString) return { fullDate: '', relativeTime: '' };
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMin = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInWeeks = Math.floor(diffInDays / 7);
    const diffInMonths = Math.floor(diffInDays / 30);
    const diffInYears = Math.floor(diffInDays / 365);
    
    // Get full date for tooltip
    const fullDate = date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    
    // Get relative time string
    let relativeTime;
    if (diffInMin < 60) {
      // Less than an hour ago
      relativeTime = diffInMin <= 1 ? t('common.time.justNow') : t('common.time.minutesAgo', { count: diffInMin }) || `${diffInMin} minutes ago`;
    } else if (diffInHours < 24) {
      // Less than a day ago
      relativeTime = diffInHours === 1 ? t('common.time.hourAgo') || 'an hour ago' : t('common.time.hoursAgo', { count: diffInHours }) || `${diffInHours} hours ago`;
    } else if (diffInDays === 1) {
      // Yesterday
      relativeTime = t('common.time.yesterday') || 'yesterday';
    } else if (diffInDays < 7) {
      // Less than a week ago
      relativeTime = t('common.time.daysAgo', { count: diffInDays }) || `${diffInDays} days ago`;
    } else if (diffInWeeks === 1) {
      // Last week
      relativeTime = t('common.time.lastWeek') || 'last week';
    } else if (diffInWeeks < 4) {
      // Less than a month ago
      relativeTime = t('common.time.weeksAgo', { count: diffInWeeks }) || `${diffInWeeks} weeks ago`;
    } else if (diffInMonths === 1) {
      // Last month
      relativeTime = t('common.time.lastMonth') || 'last month';
    } else if (diffInMonths < 12) {
      // Less than a year ago
      relativeTime = t('common.time.monthsAgo', { count: diffInMonths }) || `${diffInMonths} months ago`;
    } else if (diffInYears === 1) {
      // Last year
      relativeTime = t('common.time.lastYear') || 'last year';
    } else {
      // More than a year ago
      relativeTime = t('common.time.yearsAgo', { count: diffInYears }) || `${diffInYears} years ago`;
    }
    
    return { fullDate, relativeTime };
  };

  // Status chip renderer with icons
  const renderStatusChip = (status: string) => {
    switch (status) {
      case 'Proposed':
        return (
          <Chip
            icon={<IconBulb size={16} />}
            label={t('features.status.proposed')}
            size="small"
            sx={{
              bgcolor: 'rgba(33, 150, 243, 0.1)',
              color: 'primary.main',
              '.MuiChip-icon': {
                color: 'primary.main',
                marginLeft: '4px'
              },
              borderRadius: '4px',
              fontWeight: 500
            }}
          />
        );
      case 'Development':
        return (
          <Chip
            icon={<IconCode size={16} />}
            label={t('features.status.development')}
            size="small"
            sx={{
              bgcolor: 'rgba(76, 175, 80, 0.1)',
              color: 'success.main',
              '.MuiChip-icon': {
                color: 'success.main',
                marginLeft: '4px'
              },
              borderRadius: '4px',
              fontWeight: 500
            }}
          />
        );
      default:
        return <Chip label={status} size="small" sx={{ borderRadius: '4px', fontWeight: 500 }} />;
    }
  };

  // Only display features for the current page
  const displayedFeatures = features.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Determine whether to show pagination
  const shouldShowPagination = features.length > 5;

  return (
    <Paper elevation={1} sx={{ width: '100%', overflow: 'hidden', borderRadius: 1, boxShadow: theme.shadows[1] }}>
      <TableContainer sx={{ maxHeight: 'none' }}>
        <Table stickyHeader aria-label="features table">
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 250 }}>{t('features.table.subject')}</TableCell>
              <TableCell sx={{ width: 150 }}>{t('features.table.status')}</TableCell>
              <TableCell sx={{ width: 150 }}>{t('features.table.createdBy')}</TableCell>
              <TableCell sx={{ width: 180 }}>{t('features.table.updatedAt')}</TableCell>
              <TableCell align="right" sx={{ width: 100 }}>{t('features.table.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ height: 300 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : displayedFeatures.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ height: 200 }}>
                  <Typography variant="body1" color="textSecondary">
                    {t('features.table.noFeatures')}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              displayedFeatures.map((feature) => (
                <TableRow
                  hover
                  key={feature._id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    {feature.subject}
                  </TableCell>
                  <TableCell>
                    {renderStatusChip(feature.status)}
                  </TableCell>
                  <TableCell>{feature.createdBy}</TableCell>
                  <TableCell>
                    {(() => {
                      const { fullDate, relativeTime } = formatDate(feature.updatedAt || feature.createdAt || '');
                      return (
                        <Tooltip title={fullDate} arrow placement="top">
                          <Typography variant="body2">{relativeTime}</Typography>
                        </Tooltip>
                      );
                    })()}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton 
                      onClick={(e) => handleMenuOpen(e, feature)}
                      size="small"
                    >
                      <IconDotsVertical size={18} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Only show pagination when needed */}
      {shouldShowPagination && !isLoading && features.length > 0 && (
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={features.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleView}>
          <ListItemIcon>
            <IconEye size={18} />
          </ListItemIcon>
          <ListItemText>{t('features.actions.view')}</ListItemText>
        </MenuItem>
        
        {/* Only show edit option if user is the creator */}
        {selectedFeature && isOwner(selectedFeature) && (
          <MenuItem onClick={handleEdit}>
            <ListItemIcon>
              <IconEdit size={18} />
            </ListItemIcon>
            <ListItemText>{t('features.actions.edit')}</ListItemText>
          </MenuItem>
        )}
        
        {/* Only show delete option if user is the creator */}
        {selectedFeature && isOwner(selectedFeature) && (
          <MenuItem onClick={() => selectedFeature?._id && handleOpenConfirmDelete(selectedFeature._id)}>
            <ListItemIcon>
              <IconTrash size={18} color={theme.palette.error.main} />
            </ListItemIcon>
            <ListItemText sx={{ color: theme.palette.error.main }}>{t('features.actions.delete')}</ListItemText>
          </MenuItem>
        )}
      </Menu>

      <DeleteConfirmationDialog
        open={openConfirmDelete}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        integrationName={t('features.deleteDialog.featureRequest')}
        title={t('features.deleteDialog.title')}
        message={t('features.deleteDialog.content')}
      />
    </Paper>
  );
};

export default FeaturesTable; 