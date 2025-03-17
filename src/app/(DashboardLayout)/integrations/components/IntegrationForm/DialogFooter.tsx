'use client';
import React from 'react';
import {
  DialogActions,
  Button,
  Box,
  CircularProgress,
  Divider
} from '@mui/material';
import { useTranslation } from 'react-i18next';

interface DialogFooterProps {
  isEdit: boolean;
  isValidating: boolean;
  onClose: () => void;
}

const DialogFooter: React.FC<DialogFooterProps> = ({
  isEdit,
  isValidating,
  onClose
}) => {
  const { t } = useTranslation();

  return (
    <>
      <Divider />
      
      <DialogActions sx={{ p: 2.5 }}>
        <Box sx={{ flexGrow: 1 }} />
        <Button 
          onClick={onClose} 
          color="secondary"
          variant="outlined"
        >
          {t('integrations.form.buttons.cancel')}
        </Button>
        <Button 
          type="submit"
          form="integration-form"
          variant="contained" 
          color="primary"
          disabled={isValidating}
          startIcon={isValidating ? <CircularProgress size={20} /> : null}
        >
          {isValidating ? t('integrations.form.buttons.processing') : isEdit ? t('integrations.form.buttons.update') : t('integrations.form.buttons.add')}
        </Button>
      </DialogActions>
    </>
  );
};

export default DialogFooter; 