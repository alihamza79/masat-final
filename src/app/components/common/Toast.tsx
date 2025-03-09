'use client';
import React, { useState, useEffect } from 'react';
import { Alert, Snackbar, AlertColor } from '@mui/material';

export interface ToastProps {
  open: boolean;
  message: string;
  severity: AlertColor;
  duration?: number;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({
  open,
  message,
  severity,
  duration = 6000,
  onClose
}) => {
  const [isOpen, setIsOpen] = useState(open);

  useEffect(() => {
    setIsOpen(open);
  }, [open]);

  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setIsOpen(false);
    onClose();
  };

  return (
    <Snackbar
      open={isOpen}
      autoHideDuration={duration}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert
        onClose={handleClose}
        severity={severity}
        variant="filled"
        sx={{ width: '100%' }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default Toast; 