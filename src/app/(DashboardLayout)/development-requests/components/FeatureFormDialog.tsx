import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Box,
  useTheme,
  FormHelperText
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Feature, FeatureStatus } from '@/lib/hooks/useFeatures';

export interface FeatureFormData {
  subject: string;
  body: string;
  status: FeatureStatus;
}

interface FeatureFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: FeatureFormData) => Promise<void>;
  initialData?: Feature | null;
  isSubmitting?: boolean;
  formTitle?: string;
}

const FeatureFormDialog: React.FC<FeatureFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
  initialData,
  isSubmitting = false,
  formTitle
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isEditMode = !!initialData;
  const [localSubmitting, setLocalSubmitting] = useState(false);
  const submitting = isSubmitting || localSubmitting;

  const [formData, setFormData] = useState<FeatureFormData>({
    subject: '',
    body: '',
    status: 'Proposed'
  });

  const [errors, setErrors] = useState({
    subject: '',
    body: '',
    status: ''
  });

  // Reset form when dialog opens or initialData changes
  useEffect(() => {
    if (open) {
      if (initialData) {
        setFormData({
          subject: initialData.subject || '',
          body: initialData.body || '',
          status: initialData.status || 'Proposed'
        });
      } else {
        setFormData({
          subject: '',
          body: '',
          status: 'Proposed'
        });
      }
      setErrors({
        subject: '',
        body: '',
        status: ''
      });
      setLocalSubmitting(false);
    }
  }, [open, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error on change
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleStatusChange = (e: React.ChangeEvent<{ value: unknown }>) => {
    setFormData(prev => ({
      ...prev,
      status: e.target.value as FeatureStatus
    }));
  };

  const validateForm = (): boolean => {
    const newErrors = {
      subject: '',
      body: '',
      status: ''
    };
    
    if (!formData.subject.trim()) {
      newErrors.subject = t('features.form.errors.subjectRequired');
    }
    
    if (!formData.body.trim()) {
      newErrors.body = t('features.form.errors.bodyRequired');
    }
    
    setErrors(newErrors);
    
    return !newErrors.subject && !newErrors.body && !newErrors.status;
  };

  const handleSubmit = async () => {
    if (validateForm() && !submitting) {
      try {
        setLocalSubmitting(true);
        await onSubmit(formData);
        // Don't close the dialog here - parent component will do it
      } catch (error) {
        console.error('Form submission error:', error);
        setLocalSubmitting(false);
      }
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={submitting ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 1,
          maxWidth: '550px'
        }
      }}
    >
      <DialogTitle>
        {formTitle || (isEditMode ? t('features.form.editTitle') : t('features.form.createTitle'))}
      </DialogTitle>
      
      <DialogContent>
        <Box component="form" sx={{ mt: 1 }}>
          <TextField
            autoFocus
            margin="normal"
            id="subject"
            name="subject"
            label={t('features.form.subjectLabel')}
            type="text"
            fullWidth
            value={formData.subject}
            onChange={handleChange}
            error={!!errors.subject}
            helperText={errors.subject}
            required
            disabled={submitting}
            sx={{
              mb: 2,
              '& .MuiInputBase-root': {
                padding: '0px'
              },
              '& .MuiInputBase-input': {
                padding: '16px 14px'
              }
            }}
            InputLabelProps={{
              sx: { 
                color: theme.palette.text.secondary
              }
            }}
          />
          
          {isEditMode && (
            <FormControl fullWidth margin="normal" sx={{ mb: 2 }} error={!!errors.status}>
              <InputLabel id="status-label">
                {t('features.form.statusLabel')}
              </InputLabel>
              <Select
                labelId="status-label"
                id="status"
                value={formData.status}
                onChange={handleStatusChange as any}
                label={t('features.form.statusLabel')}
                disabled={submitting}
                sx={{
                  '& .MuiSelect-select': {
                    padding: '16px 14px'
                  }
                }}
              >
                <MenuItem value="Proposed">{t('features.status.proposed')}</MenuItem>
                <MenuItem value="Development">{t('features.status.development')}</MenuItem>
              </Select>
            </FormControl>
          )}
          
          <TextField
            margin="normal"
            id="body"
            name="body"
            label={t('features.form.bodyLabel')}
            multiline
            minRows={8}
            fullWidth
            value={formData.body}
            onChange={handleChange}
            error={!!errors.body}
            helperText={errors.body}
            required
            disabled={submitting}
            sx={{ 
              mb: 2,
              '& .MuiInputBase-root': {
                padding: '0px'
              },
              '& .MuiInputBase-input': {
                padding: '16px 14px'
              }
            }}
            InputLabelProps={{
              sx: { 
                color: theme.palette.text.secondary
              }
            }}
          />
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button 
          onClick={onClose} 
          disabled={submitting}
          variant="outlined"
        >
          {t('common.cancel')}
        </Button>
        <Button 
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={20} /> : null}
        >
          {isEditMode ? t('features.form.updateButton') : t('features.form.createButton')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FeatureFormDialog; 