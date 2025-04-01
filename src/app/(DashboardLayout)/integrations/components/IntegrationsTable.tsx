'use client'
import React, { useState, memo } from 'react';
import {
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
  Chip,
  Menu,
  MenuItem,
  IconButton,
  ListItemIcon,
  Paper,
  CircularProgress,
  Box,
  Stack,
  Tooltip
} from '@mui/material';
import { IconDotsVertical, IconEdit, IconTrash, IconCheck, IconX } from '@tabler/icons-react';
import IntegrationFormDialog, { IntegrationFormData } from './IntegrationFormDialog';
import DeleteConfirmationDialog from '@/app/components/dialogs/DeleteConfirmationDialog';
import { Integration } from '@/lib/services/integrationService';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { INTEGRATIONS_STATUS_QUERY_KEY } from '@/lib/hooks/useIntegrationSync';
import { useIntegrationSyncStore } from '../store/integrationSyncStore';

interface IntegrationsTableProps {
  integrations: Integration[];
  isLoading: boolean;
  onIntegrationUpdate?: (updatedIntegration: IntegrationFormData, index: number) => void;
  onIntegrationDelete?: (index: number) => void;
}

// Type for integration status from the database
export type ImportStatus = 'idle' | 'loading' | 'success' | 'error';

interface IntegrationStatus {
  _id: string;
  accountName: string;
  importStatus: ImportStatus;
  importError?: string;
  lastOrdersImport: string | null;
  lastProductOffersImport: string | null;
  ordersCount: number;
  productOffersCount: number;
}

// Function to render import status chip with optional progress
const renderImportStatusChip = (
  importStatus: ImportStatus, 
  t: any,
  progress?: number,
  errorMessage?: string
) => {
  switch (importStatus) {
    case 'loading':
      return (
        <Tooltip 
          title={progress !== undefined ? 
            `Orders: ${Math.round(progress)}%, Product Offers: ${Math.round(progress)}%` : 
            t('integrations.table.status.importing')
          }
        >
          <Chip
            icon={<CircularProgress size={14} />}
            label={progress !== undefined ? 
              `${t('integrations.table.status.importing')} ${Math.round(progress)}%` : 
              t('integrations.table.status.importing')
            }
            size="small"
            sx={{
              backgroundColor: 'rgba(33, 150, 243, 0.1)',
              color: 'info.main',
              fontWeight: 500,
              borderRadius: '4px',
              '& .MuiChip-icon': {
                color: 'inherit'
              }
            }}
          />
        </Tooltip>
      );
    case 'success':
      return (
        <Chip
          icon={<IconCheck size={14} />}
          label={t('integrations.table.status.completed')}
          size="small"
          sx={{
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            color: 'success.main',
            fontWeight: 500,
            borderRadius: '4px',
            '& .MuiChip-icon': {
              color: 'inherit'
            }
          }}
        />
      );
    case 'error':
      return (
        <Tooltip 
          title={errorMessage || t('integrations.table.status.failedGeneric')}
          arrow
          placement="top"
        >
          <Chip
            icon={<IconX size={14} />}
            label={t('integrations.table.status.failed')}
            size="small"
            sx={{
              backgroundColor: 'rgba(244, 67, 54, 0.1)',
              color: 'error.main',
              fontWeight: 500,
              borderRadius: '4px',
              '& .MuiChip-icon': {
                color: 'inherit'
              },
              cursor: errorMessage ? 'help' : 'default'
            }}
          />
        </Tooltip>
      );
    default:
      return (
        <Chip
          label={t('integrations.table.status.pending')}
          size="small"
          sx={{
            backgroundColor: 'rgba(158, 158, 158, 0.1)',
            color: 'text.secondary',
            fontWeight: 500,
            borderRadius: '4px'
          }}
        />
      );
  }
};

// Utility function to format date with relative time
const formatImportDate = (dateString: string | null, t: any) => {
  if (!dateString) return null;
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMin = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  let relativeTime = '';
  if (diffInMin < 60) {
    relativeTime = diffInMin <= 1 ? t('common.time.justNow') : t('common.time.minutesAgo', { count: diffInMin });
  } else if (diffInHours < 24) {
    relativeTime = diffInHours === 1 ? t('common.time.hourAgo') : t('common.time.hoursAgo', { count: diffInHours });
  } else if (diffInDays < 30) {
    relativeTime = diffInDays === 1 ? t('common.time.dayAgo') : t('common.time.daysAgo', { count: diffInDays });
  } else {
    // If more than 30 days, just use the date
    relativeTime = date.toLocaleDateString();
  }
  
  // Return both formatted date and relative time
  return {
    fullDate: date.toLocaleString(),
    relativeTime
  };
};

const IntegrationsTableRow = memo(({ 
  integration,
  index,
  onEditClick,
  onDeleteClick,
  onMenuClick
}: {
  integration: Integration;
  index: number;
  onEditClick: (index: number) => void;
  onDeleteClick: (index: number) => void;
  onMenuClick: (event: React.MouseEvent<HTMLButtonElement>, index: number) => void;
}) => {
  const { t } = useTranslation();
  
  // Get sync progress from store
  const { isSyncing, getSyncProgress } = useIntegrationSyncStore();
  const syncProgress = integration._id ? getSyncProgress(integration._id) : null;
  
  // Fetch integration status directly from API
  const { data: integrationStatus, isLoading: isLoadingStatus } = useQuery({
    queryKey: [INTEGRATIONS_STATUS_QUERY_KEY, integration._id],
    queryFn: async () => {
      if (!integration._id) return null;
      try {
        const response = await axios.get(`/api/db/integrations?integrationId=${integration._id}`);
        return response.data.success ? response.data.data : null;
      } catch (error) {
        console.error(`Error fetching status for integration ${integration._id}:`, error);
        return null;
      }
    },
    enabled: !!integration._id,
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  // Use loading state from store or DB depending on what's available
  let importStatus: ImportStatus = integrationStatus?.importStatus || 'idle';
  const isCurrentlySyncing = integration._id ? isSyncing(integration._id) : false;
  
  // If syncing in the store, override status to loading
  if (isCurrentlySyncing) {
    importStatus = 'loading';
  }
  
  const ordersCount = integrationStatus?.ordersCount || 0;
  const productOffersCount = integrationStatus?.productOffersCount || 0;
  const ordersFetched = !!integrationStatus?.lastOrdersImport;
  const productOffersFetched = !!integrationStatus?.lastProductOffersImport;
  
  // Get sync progress percentage if available
  let progressPercentage: number | undefined = undefined;
  if (syncProgress) {
    progressPercentage = syncProgress.totalProgress;
  }

  return (
    <TableRow>
      <TableCell>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography sx={{ fontWeight: 500 }}>
            {integration.accountName}
          </Typography>
          {integrationStatus?.importError && (
            <Tooltip 
              title={integrationStatus.importError}
              arrow
              placement="right"
            >
              <Box sx={{ 
                display: 'flex', 
                cursor: 'help',
                '&:hover': { opacity: 0.8 }
              }}>
                <IconX size={16} style={{ color: 'rgba(244, 67, 54, 0.9)' }} />
              </Box>
            </Tooltip>
          )}
        </Stack>
      </TableCell>
      <TableCell>
        <Typography sx={{ fontWeight: 500 }}>
          {integration.username}
        </Typography>
      </TableCell>
      <TableCell sx={{ textAlign: 'center' }}>
        <Box display="flex" justifyContent="center">
          <Chip
            label={integration.region}
            size="small"
            sx={{
              backgroundColor: 
                integration.region === 'Romania' ? 'rgba(0, 120, 255, 0.1)' : 
                integration.region === 'Bulgaria' ? 'rgba(76, 175, 80, 0.1)' : 
                'rgba(255, 152, 0, 0.1)',
              color: 
                integration.region === 'Romania' ? 'primary.main' : 
                integration.region === 'Bulgaria' ? 'success.main' : 
                'warning.main',
              fontWeight: 500,
              borderRadius: '4px',
              px: 1
            }}
          />
        </Box>
      </TableCell>
      <TableCell sx={{ textAlign: 'center' }}>
        <Box display="flex" justifyContent="center">
          <Chip
            label={integration.accountType || '-'}
            size="small"
            sx={{
              backgroundColor: 
                integration.accountType === 'FBE' || integration.accountType === 'Non-FBE' 
                  ? 'rgba(96, 125, 139, 0.1)' 
                  : 'rgba(224, 224, 224, 0.5)',
              color: 
                integration.accountType === 'FBE' || integration.accountType === 'Non-FBE' 
                  ? 'text.primary' 
                  : 'text.secondary',
              fontWeight: 500,
              borderRadius: '4px',
              px: 1
            }}
          />
        </Box>
      </TableCell>
      <TableCell sx={{ textAlign: 'center' }}>
        <Box display="flex" justifyContent="center">
          {isLoadingStatus ? (
            <CircularProgress size={20} />
          ) : (
            renderImportStatusChip(importStatus, t, progressPercentage, integrationStatus?.importError)
          )}
        </Box>
      </TableCell>
      <TableCell sx={{ textAlign: 'center' }}>
        {integrationStatus?.lastProductOffersImport ? (
          <Tooltip 
            title={formatImportDate(integrationStatus.lastProductOffersImport, t)?.fullDate}
            arrow
            placement="top"
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography sx={{ fontWeight: 500 }}>
                {integrationStatus.productOffersCount !== undefined ? integrationStatus.productOffersCount : 'N/A'}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', mt: 0.5 }}>
                {formatImportDate(integrationStatus.lastProductOffersImport, t)?.relativeTime}
              </Typography>
            </Box>
          </Tooltip>
        ) : (
          <Typography sx={{ fontWeight: 500 }}>
            {integrationStatus?.productOffersCount !== undefined ? integrationStatus.productOffersCount : 'N/A'}
          </Typography>
        )}
      </TableCell>
      <TableCell sx={{ textAlign: 'center' }}>
        {integrationStatus?.lastOrdersImport ? (
          <Tooltip 
            title={formatImportDate(integrationStatus.lastOrdersImport, t)?.fullDate}
            arrow
            placement="top"
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography sx={{ fontWeight: 500 }}>
                {integrationStatus?.ordersCount !== undefined ? integrationStatus.ordersCount : 'N/A'}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', mt: 0.5 }}>
                {formatImportDate(integrationStatus.lastOrdersImport, t)?.relativeTime}
              </Typography>
            </Box>
          </Tooltip>
        ) : (
          <Typography sx={{ fontWeight: 500 }}>
            {integrationStatus?.ordersCount !== undefined ? integrationStatus.ordersCount : 'N/A'}
          </Typography>
        )}
      </TableCell>
      <TableCell sx={{ textAlign: 'center' }}>
        <Box display="flex" justifyContent="center">
          <IconButton
            aria-label="more"
            aria-controls="integration-menu"
            aria-haspopup="true"
            onClick={(e) => onMenuClick(e, index)}
            size="small"
          >
            <IconDotsVertical size={18} />
          </IconButton>
        </Box>
      </TableCell>
    </TableRow>
  );
});

IntegrationsTableRow.displayName = 'IntegrationsTableRow';

/**
 * IntegrationsTable Component
 * 
 * This component handles displaying integrations with their sync status.
 * The status system works as follows:
 * 
 * 1. Database Status: 
 *    - Stores 'success' or 'error' as permanent states
 *    - Stores actual counts of orders and product offers
 *    - All count values displayed in the table come directly from the database
 * 
 * 2. Frontend Status: 
 *    - Uses Zustand store to track 'loading'/'importing' temporary states
 *    - Tracks sync progress but does NOT affect displayed counts
 * 
 * 3. Progress Tracking: 
 *    - Shows percentage of sync progress during active imports
 *    - Only affects the status indicator, not the count values
 * 
 * When a user refreshes the page:
 * - If status in DB is 'error': Will attempt to sync again
 * - If status in DB is 'success': Will only sync if time threshold has passed
 * - The loading indicators will reset (as they are stored in-memory only)
 */
const IntegrationsTable: React.FC<IntegrationsTableProps> = ({
  integrations,
  isLoading,
  onIntegrationUpdate,
  onIntegrationDelete
}) => {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>, index: number) => {
    setAnchorEl(event.currentTarget);
    setSelectedRow(index);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleEditClick = (index: number) => {
    setSelectedRow(index);
    setOpenEditDialog(true);
    handleClose();
  };

  const handleDeleteClick = (index: number) => {
    setSelectedRow(index);
    setOpenDeleteDialog(true);
    handleClose();
  };

  const handleEditDialogClose = () => {
    setOpenEditDialog(false);
  };

  const handleDeleteDialogClose = () => {
    setOpenDeleteDialog(false);
  };

  const handleEditSubmit = (data: IntegrationFormData) => {
    if (selectedRow !== null && onIntegrationUpdate) {
      onIntegrationUpdate(data, selectedRow);
    }
    setOpenEditDialog(false);
  };

  const handleDeleteConfirm = () => {
    if (selectedRow !== null && onIntegrationDelete) {
      onIntegrationDelete(selectedRow);
    }
    setOpenDeleteDialog(false);
  };

  if (isLoading && integrations.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (integrations.length === 0) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        height="200px"
        border="1px dashed rgba(0, 0, 0, 0.12)"
        borderRadius="8px"
      >
        <Typography color="textSecondary">
          {t('integrations.noIntegrations')}
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <TableContainer component={Paper} sx={{ borderRadius: '8px', boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.05)' }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 200 }}>{t('integrations.table.accountName')}</TableCell>
              <TableCell sx={{ minWidth: 200 }}>{t('integrations.table.username')}</TableCell>
              <TableCell sx={{ minWidth: 120, textAlign: 'center' }}>{t('integrations.table.region')}</TableCell>
              <TableCell sx={{ minWidth: 120, textAlign: 'center' }}>{t('integrations.table.accountType')}</TableCell>
              <TableCell sx={{ minWidth: 150, textAlign: 'center' }}>{t('integrations.table.importStatus')}</TableCell>
              <TableCell sx={{ minWidth: 150, textAlign: 'center' }}>{t('integrations.table.productOffers')}</TableCell>
              <TableCell sx={{ minWidth: 120, textAlign: 'center' }}>{t('integrations.table.orderCount')}</TableCell>
              <TableCell sx={{ minWidth: 80, textAlign: 'center' }}>{t('integrations.table.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {integrations.map((integration, index) => (
              <IntegrationsTableRow
                key={integration._id || index}
                integration={integration}
                index={index}
                onEditClick={handleEditClick}
                onDeleteClick={handleDeleteClick}
                onMenuClick={handleClick}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Menu
        id="integration-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem onClick={() => selectedRow !== null && handleEditClick(selectedRow)}>
          <IconEdit size={18} style={{ marginRight: 8 }} />
          {t('integrations.form.menu.edit')}
        </MenuItem>
        <MenuItem onClick={() => selectedRow !== null && handleDeleteClick(selectedRow)}>
          <IconTrash size={18} style={{ marginRight: 8 }} />
          {t('integrations.form.menu.delete')}
        </MenuItem>
      </Menu>

      {selectedRow !== null && (
        <>
          <IntegrationFormDialog
            open={openEditDialog}
            onClose={handleEditDialogClose}
            onSubmit={handleEditSubmit}
            isEdit={true}
            initialData={integrations[selectedRow]}
          />

          <DeleteConfirmationDialog
            open={openDeleteDialog}
            onClose={handleDeleteDialogClose}
            onConfirm={handleDeleteConfirm}
            integrationName={integrations[selectedRow]?.accountName || ''}
            title={t('integrations.delete.title')}
          />
        </>
      )}
    </>
  );
};

export default memo(IntegrationsTable); 