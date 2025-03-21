'use client';
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
  Typography,
  Box,
  Stack,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import { IconX } from '@tabler/icons-react';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { CalculatorState } from '../context/CalculatorContext';

interface SaveCalculationModalProps {
  open: boolean;
  onClose: () => void;
  calculatorState: CalculatorState;
  onSaveSuccess: () => void;
  savedCalculationId: string | null;
  initialTitle: string;
  initialDescription: string;
  onSaveComplete?: (newCalculationId: string) => void;
}

const SaveCalculationModal: React.FC<SaveCalculationModalProps> = ({
  open,
  onClose,
  calculatorState,
  onSaveSuccess,
  savedCalculationId,
  initialTitle,
  initialDescription,
  onSaveComplete
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);

  // Set initial values when the modal opens
  useEffect(() => {
    if (open) {
      setTitle(initialTitle);
      setDescription(initialDescription);
      setIsUpdate(!!savedCalculationId);
      setError(null);
      setSuccess(false);
    }
  }, [open, initialTitle, initialDescription, savedCalculationId]);

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      let response;
      
      if (isUpdate && savedCalculationId) {
        // Update existing calculation
        response = await fetch(`/api/calculations/${savedCalculationId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title,
            description,
            calculatorState
          }),
        });
      } else {
        // Create new calculation
        response = await fetch('/api/calculations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title,
            description,
            calculatorState
          }),
        });
      }

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to save calculation');
      }
      
      setSuccess(true);
      
      // Call onSaveSuccess immediately to refresh the data in the parent component
      onSaveSuccess();
      
      // If this is a new calculation and we have the onSaveComplete callback,
      // call it with the new calculation ID
      if (!isUpdate && onSaveComplete && result.data && result.data._id) {
        onSaveComplete(result.data._id);
      }
      
      // Close the modal after a short delay to show the success message
      setTimeout(() => {
        handleClose();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setError(null);
    setSuccess(false);
    setIsUpdate(false);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: { xs: 0, sm: 2 },
          m: { xs: 0, sm: 3 },
          width: { xs: '100%', sm: '500px' },
          minHeight: { xs: 'auto', sm: '300px' }
        }
      }}
    >
      <DialogTitle sx={{ px: { xs: 2, sm: 3 }, py: 2.5 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography 
            variant="h6" 
            sx={{ 
              fontSize: { xs: '18px', sm: '20px' },
              fontWeight: 600,
              color: theme.palette.mode === 'dark' ? 'grey.300' : 'grey.900'
            }}
          >
            {isUpdate 
              ? t('calculator.saveCalculation.updateTitle') 
              : t('calculator.saveCalculation.title')}
          </Typography>
          <IconButton
            onClick={handleClose}
            size="small"
            disabled={loading}
            sx={{
              color: 'text.secondary',
              '&:hover': { color: 'text.primary' }
            }}
          >
            <IconX size={20} />
          </IconButton>
        </Stack>
      </DialogTitle>
      <Divider />
      
      <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert 
            severity="success" 
            sx={{ mb: 3 }}
          >
            {isUpdate 
              ? t('calculator.saveCalculation.updateSuccess', 'Calculation updated successfully!') 
              : t('calculator.saveCalculation.saveSuccess', 'Calculation saved successfully!')}
          </Alert>
        )}
        
        <Stack spacing={3}>
          <TextField
            label={t('calculator.saveCalculation.titleField')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            required
            disabled={loading || success}
            variant="outlined"
            size="medium"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                fontSize: '16px'
              },
              '& .MuiInputLabel-root': {
                fontSize: '16px'
              }
            }}
          />
          
          <TextField
            label={t('calculator.saveCalculation.descriptionField')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={4}
            disabled={loading || success}
            variant="outlined"
            size="medium"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                fontSize: '16px'
              },
              '& .MuiInputLabel-root': {
                fontSize: '16px'
              }
            }}
          />
        </Stack>
      </DialogContent>
      
      <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: 3 }}>
        <Button 
          onClick={handleClose}
          disabled={loading}
          variant="outlined"
          size="large"
          sx={{
            borderColor: theme.palette.divider,
            color: theme.palette.text.primary,
            fontSize: '15px',
            fontWeight: 500,
            px: 3,
            py: 1,
            '&:hover': {
              borderColor: theme.palette.text.primary,
              bgcolor: 'transparent',
            }
          }}
        >
          {t('calculator.saveCalculation.cancel')}
        </Button>
        <Button 
          onClick={handleSave}
          disabled={loading || success || !title.trim()}
          variant="contained"
          size="large"
          color="primary"
          sx={{
            bgcolor: '#00c292',
            color: 'white',
            fontSize: '15px',
            fontWeight: 500,
            px: 3,
            py: 1,
            '&:hover': {
              bgcolor: '#00a67d',
            },
            '&.Mui-disabled': {
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 194, 146, 0.3)' : 'rgba(0, 194, 146, 0.5)',
              color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'white',
            }
          }}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            isUpdate 
              ? t('calculator.saveCalculation.update') 
              : t('calculator.saveCalculation.save')
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SaveCalculationModal; 