'use client';
import React from 'react';
import {
  Alert,
  Typography
} from '@mui/material';
import { useTranslation } from 'react-i18next';

interface AlertMessagesProps {
  isEdit: boolean;
  validationError: string;
}

const AlertMessages: React.FC<AlertMessagesProps> = ({
  isEdit,
  validationError
}) => {
  const { t } = useTranslation();

  return (
    <>
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          {isEdit ? t('integrations.form.editInfo') : t('integrations.form.addInfo')}
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          {t('integrations.form.ipInfo')}
        </Typography>
      </Alert>

      {validationError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body2">{validationError}</Typography>
        </Alert>
      )}
    </>
  );
};

export default AlertMessages; 