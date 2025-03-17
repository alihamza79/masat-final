'use client';
import React from 'react';
import {
  DialogTitle,
  Typography,
  IconButton,
  Divider
} from '@mui/material';
import { IconX } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

interface DialogHeaderProps {
  isEdit: boolean;
  onClose: () => void;
}

const DialogHeader: React.FC<DialogHeaderProps> = ({
  isEdit,
  onClose
}) => {
  const { t } = useTranslation();

  return (
    <>
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        p: 2.5
      }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {isEdit ? t('integrations.form.editTitle') : t('integrations.form.addTitle')}
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
    </>
  );
};

export default DialogHeader; 