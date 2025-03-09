'use client';
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  IconButton,
  Alert,
  Divider,
  SelectChangeEvent,
  Box,
  CircularProgress
} from '@mui/material';
import { IconX, IconEye, IconEyeOff } from '@tabler/icons-react';
import { validateIntegration } from '@/lib/services/integrationService';
import Toast from '@/app/components/common/Toast';
import IpConfirmationDialog from '@/app/(DashboardLayout)/integrations/components/IpConfirmationDialog';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

export interface IntegrationFormData {
  _id?: string;
  accountName: string;
  username: string;
  password?: string;
  region: string;
}

interface IntegrationFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: IntegrationFormData) => void;
  isEdit?: boolean;
  initialData?: IntegrationFormData;
}

const IntegrationFormDialog: React.FC<IntegrationFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
  isEdit = false,
  initialData
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<IntegrationFormData>({
    accountName: '',
    username: '',
    password: '',
    region: 'Romania',
  });

  const [isValidating, setIsValidating] = useState(false);
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'info' as 'success' | 'error' | 'info' | 'warning'
  });
  const [showIpConfirmation, setShowIpConfirmation] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Autofill form when editing
  useEffect(() => {
    if (isEdit && initialData) {
      setFormData({
        accountName: initialData.accountName,
        username: initialData.username,
        region: initialData.region,
      });
    } else {
      // Reset form when not editing
      setFormData({
        accountName: '',
        username: '',
        password: '',
        region: 'Romania',
      });
    }
  }, [isEdit, initialData, open]);

  const handleCloseToast = () => {
    setToast({ ...toast, open: false });
  };

  const showToast = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setToast({
      open: true,
      message,
      severity
    });
  };

  const handleTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleSelectChange = (event: SelectChangeEvent) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const validateForm = (): boolean => {
    // Check if required fields are filled
    if (!formData.accountName || !formData.username || (!isEdit && !formData.password) || !formData.region) {
      showToast('Please fill in all required fields', 'error');
      return false;
    }
    return true;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) return;
    
    // Show IP confirmation dialog
    setShowIpConfirmation(true);
  };

  const handleIpConfirmation = async () => {
    // Close IP dialog immediately
    setShowIpConfirmation(false);
    
    try {
      setIsValidating(true);
      setValidationError('');
      
      // Validate credentials
      const validationResult = await validateIntegration({
        ...formData,
        integrationId: isEdit ? initialData?._id : undefined // Only pass ID when editing
      });

      if (!validationResult.success) {
        setValidationError(validationResult.error || 'Invalid credentials');
        setIsValidating(false);
        return;
      }
      
      // If editing and password is empty, don't send it
      const submitData = {
        ...formData,
        password: formData.password || undefined
      };
      
      try {
        await onSubmit(submitData);
        handleDialogClose();
      } catch (submitError: any) {
        // Handle errors from the submission process (like duplicate account name)
        setValidationError(submitError.message || 'Failed to process integration');
      }
    } catch (error: any) {
      setValidationError(error.message || 'Failed to process integration');
    } finally {
      setIsValidating(false);
    }
  };

  const handleDialogClose = () => {
    setFormData({
      accountName: '',
      username: '',
      password: '',
      region: 'Romania'
    });
    setShowIpConfirmation(false);
    setToast({ open: false, message: '', severity: 'info' });
    setValidationError('');
    onClose();
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={handleDialogClose} 
        maxWidth="sm" 
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
            {isEdit ? t('integrations.form.editTitle') : t('integrations.form.addTitle')}
          </Typography>
          <IconButton 
            edge="end" 
            color="inherit" 
            onClick={handleDialogClose} 
            aria-label="close"
            size="small"
          >
            <IconX size={18} />
          </IconButton>
        </DialogTitle>
        
        <Divider />
        
        <DialogContent sx={{ p: 3 }}>
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

          <form id="integration-form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t('integrations.form.fields.accountName')}
                  name="accountName"
                  value={formData.accountName}
                  onChange={handleTextChange}
                  variant="outlined"
                  size="small"
                  required
                  InputLabelProps={{
                    sx: { 
                      mt: 0.2,
                      ml: 1,
                      "&.MuiInputLabel-shrink": {
                        ml: 0
                      }
                    }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderRadius: '8px',
                      },
                      '& input': {
                        pl: 2,
                        py: 1.5
                      }
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel id="region-label" sx={{ 
                    mt: 0.2,
                    ml: 1,
                    "&.MuiInputLabel-shrink": {
                      ml: 0
                    }
                  }}>{t('integrations.form.fields.region')}</InputLabel>
                  <Select
                    labelId="region-label"
                    id="region"
                    name="region"
                    value={formData.region}
                    label={t('integrations.form.fields.region')}
                    onChange={handleSelectChange}
                    required
                    sx={{
                      borderRadius: '8px',
                      '& .MuiSelect-select': {
                        pl: 2,
                        py: 1.5
                      }
                    }}
                  >
                    <MenuItem value="Romania">Romania</MenuItem>
                    <MenuItem value="Bulgaria">Bulgaria</MenuItem>
                    <MenuItem value="Hungary">Hungary</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t('integrations.form.fields.username')}
                  name="username"
                  value={formData.username}
                  onChange={handleTextChange}
                  variant="outlined"
                  size="small"
                  required
                  InputLabelProps={{
                    sx: { 
                      mt: 0.2,
                      ml: 1,
                      "&.MuiInputLabel-shrink": {
                        ml: 0
                      }
                    }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderRadius: '8px',
                      },
                      '& input': {
                        pl: 2,
                        py: 1.5
                      }
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t('integrations.form.fields.password')}
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleTextChange}
                  variant="outlined"
                  size="small"
                  required={!isEdit}
                  placeholder={isEdit ? t('integrations.form.fields.passwordPlaceholder') : ""}
                  helperText={isEdit ? t('integrations.form.fields.passwordHelp') : ""}
                  InputProps={{
                    endAdornment: (
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                      </IconButton>
                    ),
                  }}
                  InputLabelProps={{
                    sx: { 
                      mt: 0.2,
                      ml: 1,
                      "&.MuiInputLabel-shrink": {
                        ml: 0
                      }
                    }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderRadius: '8px',
                      },
                      '& input': {
                        pl: 2,
                        py: 1.5
                      }
                    }
                  }}
                />
              </Grid>
            </Grid>
          </form>
        </DialogContent>
        
        <Divider />
        
        <DialogActions sx={{ p: 2.5 }}>
          <Box sx={{ flexGrow: 1 }} />
          <Button 
            onClick={handleDialogClose} 
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
      </Dialog>
      
      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={handleCloseToast}
      />

      <IpConfirmationDialog
        open={showIpConfirmation}
        onClose={() => setShowIpConfirmation(false)}
        onConfirm={handleIpConfirmation}
      />
    </>
  );
};

export default IntegrationFormDialog;