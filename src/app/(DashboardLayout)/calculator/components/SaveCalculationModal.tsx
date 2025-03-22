'use client';
import React, { useState, useEffect, useRef } from 'react';
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
  Alert,
  Avatar,
  styled
} from '@mui/material';
import { IconX, IconUpload, IconPhoto, IconTrash } from '@tabler/icons-react';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { CalculatorState } from '../context/CalculatorContext';

// Styled component for the file input
const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

interface SaveCalculationModalProps {
  open: boolean;
  onClose: () => void;
  calculatorState: CalculatorState;
  onSaveSuccess: () => void;
  savedCalculationId: string | null;
  initialTitle: string;
  initialDescription: string;
  initialImage?: string;
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
  initialImage = '/products/default.jpg',
  onSaveComplete
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
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
      setImage(null);
      setImagePreview(initialImage);
    }
  }, [open, initialTitle, initialDescription, savedCalculationId, initialImage]);

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const selectedFile = files[0];
      
      // Check file type
      if (!selectedFile.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      
      // Check file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      
      setImage(selectedFile);
      setImagePreview(URL.createObjectURL(selectedFile));
      setError(null);
    }
  };

  // Clear the selected image
  const handleClearImage = () => {
    setImage(null);
    setImagePreview(initialImage);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Create a FormData object to handle file upload
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('calculatorState', JSON.stringify(calculatorState));
      
      // Only append the image if a new one is selected
      if (image) {
        formData.append('image', image);
      }
      
      let response;
      
      if (isUpdate && savedCalculationId) {
        // Update existing calculation
        response = await fetch(`/api/calculations/${savedCalculationId}`, {
          method: 'PUT',
          body: formData, // Using FormData instead of JSON
        });
      } else {
        // Create new calculation
        response = await fetch('/api/calculations', {
          method: 'POST',
          body: formData, // Using FormData instead of JSON
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
    setImage(null);
    setImagePreview('');
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
          {/* Image Upload Section */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: 2, 
            mb: 2,
            px: 2,
            py: 3,
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: 2,
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)'
          }}>
            {imagePreview ? (
              <Box sx={{ position: 'relative' }}>
                <Avatar 
                  src={imagePreview} 
                  alt={title || 'Product image'} 
                  variant="rounded"
                  sx={{ 
                    width: 120, 
                    height: 120,
                    boxShadow: 3
                  }}
                />
                <IconButton 
                  size="small" 
                  color="error" 
                  onClick={handleClearImage}
                  sx={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    bgcolor: 'background.paper',
                    boxShadow: 1,
                    '&:hover': {
                      bgcolor: 'error.lighter'
                    }
                  }}
                >
                  <IconTrash size={16} />
                </IconButton>
              </Box>
            ) : (
              <Box sx={{ 
                width: 120, 
                height: 120, 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                borderRadius: 2
              }}>
                <IconPhoto size={40} color={theme.palette.text.secondary} opacity={0.3} />
              </Box>
            )}
            
            <Button
              component="label"
              variant="outlined"
              startIcon={<IconUpload size={18} />}
              disabled={loading || success}
              sx={{
                mt: 1,
                borderColor: 'divider',
                color: 'text.secondary',
                '&:hover': {
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  bgcolor: 'transparent'
                }
              }}
            >
              {t('calculator.saveCalculation.uploadImage', 'Upload Image')}
              <VisuallyHiddenInput 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                onChange={handleFileChange} 
              />
            </Button>
            <Typography variant="caption" color="text.secondary" align="center">
              Supported formats: JPG, PNG, GIF, WEBP (Max 5MB)
            </Typography>
          </Box>

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