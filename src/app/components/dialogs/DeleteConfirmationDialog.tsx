'use client';
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  IconButton,
  Divider,
  Box
} from '@mui/material';
import { IconX, IconAlertTriangle } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

interface DeleteConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  integrationName: string;
  title?: string;
  message?: string;
}

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  open,
  onClose,
  onConfirm,
  integrationName,
  title,
  message
}) => {
  const { t } = useTranslation();

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '8px',
          boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.1)'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        p: 2.5
      }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {title || t('common.deleteDialog.title')}
        </Typography>
        <IconButton 
          edge="end" 
          color="inherit" 
          onClick={onClose} 
          aria-label="close"
          size="small"
        >
          <IconX size={18} />
        </IconButton>
      </DialogTitle>
      
      <Divider />
      
      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconAlertTriangle size={24} color="#ff4d4f" style={{ marginRight: '12px' }} />
          <Typography variant="subtitle1" fontWeight={500}>
            {t('common.deleteDialog.confirmationQuestion')}
          </Typography>
        </Box>
        <Typography variant="body2" color="textSecondary">
          {message || t('common.deleteDialog.defaultMessage', { name: integrationName || t('common.deleteDialog.thisItem') })}
        </Typography>
      </DialogContent>
      
      <Divider />
      
      <DialogActions sx={{ p: 2.5 }}>
        <Button 
          onClick={onClose} 
          color="secondary"
          variant="outlined"
        >
          {t('common.deleteDialog.cancel')}
        </Button>
        <Button 
          onClick={onConfirm}
          variant="contained" 
          sx={{ 
            bgcolor: '#d32f2f',
            '&:hover': {
              bgcolor: '#b71c1c',
            },
            color: '#fff'
          }}
        >
          <span style={{ color: '#fff' }}>{t('common.deleteDialog.delete')}</span>
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteConfirmationDialog; 