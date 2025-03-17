'use client';
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  SelectChangeEvent
} from '@mui/material';
import { validateIntegration } from '@/lib/services/integrationService';
import Toast from '@/app/components/common/Toast';
import IpConfirmationDialog from '@/app/(DashboardLayout)/integrations/components/IpConfirmationDialog';
import { 
  FormFields, 
  DialogHeader, 
  DialogFooter, 
  AlertMessages 
} from './IntegrationForm';

export interface IntegrationFormData {
  _id?: string;
  accountName: string;
  username: string;
  password?: string;
  region: string;
  accountType: string;
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
  const [formData, setFormData] = useState<IntegrationFormData>({
    accountName: '',
    username: '',
    password: '',
    region: 'Romania',
    accountType: 'Non-FBE',
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
        accountType: initialData.accountType,
      });
    } else {
      // Reset form when not editing
      setFormData({
        accountName: '',
        username: '',
        password: '',
        region: 'Romania',
        accountType: 'Non-FBE',
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
    if (!formData.accountName || !formData.username || (!isEdit && !formData.password) || !formData.region || !formData.accountType) {
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
      region: 'Romania',
      accountType: 'Non-FBE',
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
        <DialogHeader 
          isEdit={isEdit} 
          onClose={handleDialogClose} 
        />
        
        <DialogContent sx={{ p: 3 }}>
          <AlertMessages 
            isEdit={isEdit} 
            validationError={validationError} 
          />

          <form id="integration-form" onSubmit={handleSubmit}>
            <FormFields 
              formData={formData}
              isEdit={isEdit}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              handleTextChange={handleTextChange}
              handleSelectChange={handleSelectChange}
            />
          </form>
        </DialogContent>
        
        <DialogFooter 
          isEdit={isEdit} 
          isValidating={isValidating} 
          onClose={handleDialogClose} 
        />
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