import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert
} from '@mui/material';
import { IconAlertCircle } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

interface IpConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const IpConfirmationDialog: React.FC<IpConfirmationDialogProps> = ({
  open,
  onClose,
  onConfirm
}) => {
  const { t } = useTranslation();

  return (
    <Dialog 
      open={open} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '8px',
          boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.1)'
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <IconAlertCircle size={24} />
          <Typography variant="h6">{t('integrations.ipDialog.title')}</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          {t('integrations.ipDialog.message')}
        </Alert>
        <Typography variant="body1" gutterBottom>
          {t('integrations.ipDialog.stepsTitle')}
        </Typography>
        <Box component="ol" sx={{ pl: 2 }}>
          <li>{t('integrations.ipDialog.step1')}</li>
          <li>{t('integrations.ipDialog.step2')}</li>
          <li>{t('integrations.ipDialog.step3')} <Box component="strong">{t('integrations.ipDialog.ipAddress')}</Box></li>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          {t('integrations.ipDialog.importance')}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} color="inherit">
          {t('integrations.ipDialog.cancel')}
        </Button>
        <Button onClick={onConfirm} variant="contained" color="primary">
          {t('integrations.ipDialog.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default IpConfirmationDialog; 