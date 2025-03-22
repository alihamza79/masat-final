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
  styled,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  IconX, 
  IconPhoto, 
  IconTrash, 
  IconCheck, 
  IconAlertCircle,
  IconCamera
} from '@tabler/icons-react';
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
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageError, setImageError] = useState(false);
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
      setImageError(false);
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
      setImageError(false);
      setError(null);
    }
  };

  // Clear the selected image
  const handleClearImage = () => {
    setImage(null);
    setImagePreview(initialImage);
    setImageError(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageError = () => {
    setImageError(true);
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
    setImageError(false);
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
          maxHeight: { xs: '100vh', sm: '90vh' },
          m: { xs: 0, sm: 3 },
          width: { xs: '100%', sm: 'auto' },
          minWidth: { sm: '500px' },
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ px: { xs: 2, sm: 2.5 }, py: 2 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography 
            variant="h6" 
            sx={{ 
              fontSize: { xs: '16px', sm: '18px' },
              fontWeight: 600,
              color: theme.palette.mode === 'dark' ? 'grey.300' : 'grey.900'
            }}
          >
            {isUpdate 
              ? t('calculator.saveCalculation.updateTitle', 'Update Calculation') 
              : t('calculator.saveCalculation.title', 'Save Calculation')}
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
            <IconX size={18} />
          </IconButton>
        </Stack>
      </DialogTitle>
      <Divider />
      
      <DialogContent 
        sx={{ 
          p: { xs: 2, sm: 2.5 },
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {error && (
          <Alert 
            severity="error" 
            icon={<IconAlertCircle size={20} />}
            sx={{ 
              mb: 2.5,
              borderRadius: '8px',
              '& .MuiAlert-message': {
                fontSize: '13px',
                fontWeight: 500
              }
            }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert 
            severity="success" 
            icon={<IconCheck size={20} />}
            sx={{ 
              mb: 2.5,
              borderRadius: '8px',
              '& .MuiAlert-message': {
                fontSize: '13px',
                fontWeight: 500
              }
            }}
          >
            {isUpdate 
              ? t('calculator.saveCalculation.updateSuccess', 'Calculation updated successfully!') 
              : t('calculator.saveCalculation.saveSuccess', 'Calculation saved successfully!')}
          </Alert>
        )}
        
        <Stack spacing={2.5}>
          {/* Image Upload Section */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: 1, 
            pb: 1,
            position: 'relative'
          }}>
            <Box 
              sx={{ 
                position: 'relative',
                borderRadius: '12px',
                overflow: 'hidden',
                width: { xs: '100%', sm: '220px' },
                height: { xs: '160px', sm: '160px' },
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                border: '1px dashed',
                borderColor: 'divider',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  borderColor: 'primary.main',
                  cursor: 'pointer'
                }
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview && !imageError ? (
                <Box 
                  component="div"
                  sx={{
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    overflow: 'hidden'
                  }}
                >
                  <Box
                    component="img"
                    src={imagePreview}
                    alt=""
                    onError={handleImageError}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      objectPosition: 'center'
                    }}
                  />
                </Box>
              ) : (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1,
                  p: 2,
                  textAlign: 'center'
                }}>
                  <IconCamera 
                    size={40} 
                    style={{ 
                      opacity: 0.4,
                      color: theme.palette.mode === 'dark' ? theme.palette.grey[400] : theme.palette.grey[600]
                    }} 
                  />
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ fontSize: '11px' }}
                  >
                    {t('calculator.saveCalculation.dropImageHere', 'Click to upload an image')}
                  </Typography>
                </Box>
              )}
              
              {imagePreview && !imageError && imagePreview !== initialImage && (
                <IconButton 
                  size="small" 
                  color="error" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearImage();
                  }}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    bgcolor: 'background.paper',
                    boxShadow: 1,
                    opacity: 0.8,
                    '&:hover': {
                      bgcolor: 'error.lighter',
                      opacity: 1
                    }
                  }}
                >
                  <IconTrash size={16} />
                </IconButton>
              )}
              
              <VisuallyHiddenInput 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                onChange={handleFileChange} 
              />
            </Box>
            
            <Typography 
              variant="caption" 
              color="text.secondary" 
              align="center"
              sx={{ 
                fontSize: '11px',
                opacity: 0.8,
                mt: 0.5
              }}
            >
              {t('calculator.saveCalculation.supportedFormats', 'Supported formats: JPG, PNG, GIF, WEBP (Max 5MB)')}
            </Typography>
          </Box>

          <TextField
            label={t('calculator.saveCalculation.titleField', 'Title')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            required
            disabled={loading || success}
            variant="outlined"
            size="small"
            placeholder={t('calculator.saveCalculation.titlePlaceholder', 'Enter a title for your calculation')}
            sx={{
              mt: 1,
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                fontSize: '14px',
                '& fieldset': {
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)'
                }
              },
              '& .MuiInputLabel-root': {
                fontSize: '14px'
              }
            }}
          />
          
          <TextField
            label={t('calculator.saveCalculation.descriptionField', 'Description (optional)')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={3}
            disabled={loading || success}
            variant="outlined"
            size="small"
            placeholder={t('calculator.saveCalculation.descriptionPlaceholder', 'Add some details about this calculation (optional)')}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                fontSize: '14px',
                '& fieldset': {
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)'
                }
              },
              '& .MuiInputLabel-root': {
                fontSize: '14px'
              }
            }}
          />
        </Stack>
      </DialogContent>
      
      <Divider />
      
      <DialogActions 
        sx={{ 
          px: { xs: 2, sm: 2.5 }, 
          py: 2,
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(0, 0, 0, 0.01)'
        }}
      >
        <Button 
          onClick={handleClose}
          disabled={loading}
          variant="outlined"
          size="medium"
          sx={{
            borderColor: theme.palette.divider,
            color: theme.palette.text.primary,
            fontSize: '13px',
            fontWeight: 500,
            px: 2.5,
            py: 1,
            minWidth: '90px',
            borderRadius: '8px',
            '&:hover': {
              borderColor: theme.palette.text.primary,
              bgcolor: 'transparent',
            }
          }}
        >
          {t('calculator.saveCalculation.cancel', 'Cancel')}
        </Button>
        <Button 
          onClick={handleSave}
          disabled={loading || success || !title.trim()}
          variant="contained"
          size="medium"
          color="primary"
          sx={{
            bgcolor: '#00c292',
            color: 'white',
            fontSize: '13px',
            fontWeight: 500,
            px: 2.5,
            py: 1,
            minWidth: '90px',
            borderRadius: '8px',
            '&:hover': {
              bgcolor: '#00a67d',
            },
            '&.Mui-disabled': {
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 194, 146, 0.3)' : 'rgba(0, 194, 146, 0.5)',
              color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'white',
            }
          }}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {loading ? (
            t('calculator.saveCalculation.saving', 'Saving...')
          ) : (
            isUpdate 
              ? t('calculator.saveCalculation.update', 'Update') 
              : t('calculator.saveCalculation.save', 'Save')
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SaveCalculationModal; 