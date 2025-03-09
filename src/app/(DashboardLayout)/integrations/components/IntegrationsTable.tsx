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
  CircularProgress
} from '@mui/material';
import BlankCard from '@/app/components/shared/BlankCard';
import { Box, Stack } from '@mui/system';
import { IconDotsVertical, IconEdit, IconTrash, IconCheck, IconX } from '@tabler/icons-react';
import IntegrationFormDialog, { IntegrationFormData } from './IntegrationFormDialog';
import DeleteConfirmationDialog from '@/app/components/dialogs/DeleteConfirmationDialog';
import { Integration } from '@/lib/services/integrationService';
import { TableRowProps as MuiTableRowProps } from '@mui/material';
import { useEmagDataStore, ImportStatus } from '@/app/(DashboardLayout)/integrations/store/emagData';
import { useTranslation } from 'react-i18next';

interface IntegrationsTableProps {
  integrations: Integration[];
  isLoading: boolean;
  onIntegrationUpdate?: (updatedIntegration: IntegrationFormData, index: number) => void;
  onIntegrationDelete?: (index: number) => void;
}

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
  const { integrationsData } = useEmagDataStore();
  const integrationData = integration._id ? integrationsData[integration._id] : undefined;
  
  const importStatus: ImportStatus = integrationData?.importStatus || 'loading';
  const ordersCount = integrationData?.ordersCount || 0;
  const productOffersCount = integrationData?.productOffersCount || 0;
  const ordersFetched = integrationData?.ordersFetched || false;
  const productOffersFetched = integrationData?.productOffersFetched || false;
  
  const renderImportStatusChip = () => {
    switch (importStatus) {
      case 'loading':
        return (
          <Chip
            icon={<CircularProgress size={14} />}
            label={t('integrations.table.status.importing')}
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
              }
            }}
          />
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

  return (
    <TableRow>
      <TableCell>
        <Typography sx={{ fontWeight: 500 }}>
          {integration.accountName}
        </Typography>
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
          {renderImportStatusChip()}
        </Box>
      </TableCell>
      <TableCell sx={{ textAlign: 'center' }}>
        <Typography sx={{ fontWeight: 500 }}>
          {productOffersFetched ? productOffersCount : 'N/A'}
        </Typography>
      </TableCell>
      <TableCell sx={{ textAlign: 'center' }}>
        <Typography sx={{ fontWeight: 500 }}>
          {ordersFetched ? ordersCount : 'N/A'}
        </Typography>
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
          {t('integrations.table.noData')}
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