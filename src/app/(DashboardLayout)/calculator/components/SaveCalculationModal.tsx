'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  CircularProgress,
  Alert,
  styled
} from '@mui/material';
import { 
  IconX, 
  IconTrash,
  IconInfoCircle,
  IconUpload
} from '@tabler/icons-react';
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

// Styled label component
const InputLabel = styled(Typography)(({ theme }) => ({
  fontSize: '14px',
  fontWeight: 500,
  marginBottom: 8,
  color: theme.palette.text.primary,
}));

// Styled component for the drag & drop zone
const DropZone = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isDragActive' && prop !== 'hasImage'
})<{ isDragActive?: boolean; hasImage?: boolean }>(({ theme, isDragActive, hasImage }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  border: '1px dashed #3f8cff',
  backgroundColor: 'transparent',
  transition: theme.transitions.create(['border-color', 'background-color'], {
    duration: theme.transitions.duration.shorter,
  }),
  cursor: 'pointer',
  height: '100%',
  minHeight: 180,
  width: '100%',
  '&:hover': {
    borderColor: '#3f8cff',
    backgroundColor: isDragActive ? 'rgba(63, 140, 255, 0.04)' : 'transparent',
  }
}));

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
  initialImage,
  onSaveComplete
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

  // Set initial values when the modal opens
  useEffect(() => {
    if (open) {
      setTitle(initialTitle);
      setDescription(initialDescription);
      setIsUpdate(!!savedCalculationId);
      setError(null);
      setSuccess(false);
      setImage(null);
      
      // For update mode, use the initialImage
      if (isUpdate && initialImage) {
        setImagePreview(initialImage);
      } else {
        // For new calculations, always start with empty image
        setImagePreview('');
      }
    }
  }, [open, initialTitle, initialDescription, savedCalculationId, initialImage, isUpdate]);

  // Handle file validation and setting
  const processFile = (file: File) => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      setError(t('calculator.saveCalculation.errors.invalidFileType', 'Please select an image file'));
      return false;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError(t('calculator.saveCalculation.errors.fileTooLarge', 'Image size should be less than 5MB'));
      return false;
    }
    
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
    setError(null);
    return true;
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragActive) {
      setIsDragActive(true);
    }
  }, [isDragActive]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, []);

  // Trigger file input click
  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Clear the selected image
  const handleClearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImage(null);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError(t('calculator.saveCalculation.errors.titleRequired', 'Title is required'));
      return;
    }

    if (!imagePreview && !isUpdate) {
      setError(t('calculator.saveCalculation.errors.imageRequired', 'Image is required'));
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
          body: formData,
        });
      } else {
        // Create new calculation
        response = await fetch('/api/calculations', {
          method: 'POST',
          body: formData,
        });
      }

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || t('calculator.saveCalculation.errors.saveFailed', 'Failed to save calculation'));
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
      setError(err instanceof Error ? err.message : t('calculator.saveCalculation.errors.generic', 'An error occurred'));
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
        elevation: 1,
        sx: {
          borderRadius: 2,
          m: { xs: 0, sm: 2 },
          width: { xs: '100%', sm: '550px' },
          overflow: 'hidden'
        }
      }}
    >
      {/* Dialog Header */}
      <DialogTitle sx={{ px: 3, py: 2 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography 
            variant="h6" 
            sx={{ 
              fontSize: '20px',
              fontWeight: 500,
              color: theme.palette.mode === 'dark' ? 'grey.200' : 'grey.800',
            }}
          >
            {isUpdate 
              ? t('calculator.saveCalculation.updateTitle', 'Update Calculation') 
              : t('calculator.saveCalculation.title', 'Save Calculation')}
          </Typography>
          <IconButton
            onClick={handleClose}
            size="small"
            aria-label={t('common.close', 'Close')}
            disabled={loading}
            sx={{
              color: 'text.secondary',
              '&:hover': { 
                color: 'text.primary',
              }
            }}
          >
            <IconX size={18} />
          </IconButton>
        </Stack>
      </DialogTitle>
      
      {/* Dialog Content */}
      <DialogContent sx={{ px: 3, py: 2 }}>
        {/* Alerts */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              borderRadius: 1,
            }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert 
            severity="success"
            sx={{ 
              mb: 3,
              borderRadius: 1,
            }}
          >
            {isUpdate 
              ? t('calculator.saveCalculation.updateSuccess', 'Calculation updated successfully!') 
              : t('calculator.saveCalculation.saveSuccess', 'Calculation saved successfully!')}
          </Alert>
        )}
        
        <Stack spacing={3}>
          {/* Image Upload Section */}
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
              <InputLabel variant="body2">
                {t('calculator.saveCalculation.imageLabel', 'Calculation Image')}
                <Box component="span" sx={{ color: theme.palette.error.main, ml: 0.5 }}>*</Box>
              </InputLabel>
            </Stack>
            
            <DropZone
              ref={dropZoneRef}
              isDragActive={isDragActive}
              hasImage={!!imagePreview}
              onClick={openFileDialog}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              id="image-upload"
            >
              {imagePreview ? (
                <Box sx={{ position: 'relative', p: 1 }}>
                  <Box
                    sx={{ 
                      borderRadius: 1,
                      overflow: 'hidden',
                      position: 'relative',
                      width: 140,
                      height: 140,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundImage: `url(${imagePreview})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />
                  <IconButton 
                    size="small" 
                    color="error" 
                    onClick={handleClearImage}
                    aria-label={t('common.remove', 'Remove')}
                    sx={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      bgcolor: 'white',
                      boxShadow: 1,
                      '&:hover': {
                        bgcolor: '#ffeeee'
                      }
                    }}
                  >
                    <IconTrash size={14} />
                  </IconButton>
                </Box>
              ) : (
                <Stack spacing={2} alignItems="center" justifyContent="center" sx={{ height: '100%' }}>
                  <IconUpload 
                    size={28} 
                    stroke={1.5} 
                    color={isDragActive ? '#3f8cff' : theme.palette.text.secondary} 
                  />
                  <Typography variant="body2" color={isDragActive ? 'primary' : 'text.secondary'} align="center">
                    {isDragActive 
                      ? t('calculator.saveCalculation.dropImageHere', 'Drop image here')
                      : t('calculator.saveCalculation.uploadImageInstruction', 'Click or drag image to upload')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" align="center">
                    {t('calculator.saveCalculation.supportedFormats', 'Supported formats: JPG, PNG, GIF (Max 5MB)')}
                  </Typography>
                </Stack>
              )}
              <VisuallyHiddenInput 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                onChange={handleFileChange} 
                id="drag-drop-file-input"
              />
            </DropZone>
          </Box>

          {/* Title Field */}
          <Box>
            <InputLabel>
              {t('calculator.saveCalculation.titleLabel', 'Title')}
              <Box component="span" sx={{ color: theme.palette.error.main, ml: 0.5 }}>*</Box>
            </InputLabel>
            <TextField
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              required
              disabled={loading || success}
              placeholder={t('calculator.saveCalculation.titlePlaceholder', 'Enter a descriptive title')}
              variant="outlined"
              size="medium"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                  fontSize: '16px',
                }
              }}
            />
          </Box>
          
          {/* Description Field */}
          <Box>
            <InputLabel>
              {t('calculator.saveCalculation.descriptionLabel', 'Description')}
            </InputLabel>
            <TextField
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              rows={3}
              disabled={loading || success}
              placeholder={t('calculator.saveCalculation.descriptionPlaceholder', 'Add notes or details about this calculation (optional)')}
              variant="outlined"
              size="medium"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                  fontSize: '16px',
                }
              }}
            />
          </Box>
        </Stack>
      </DialogContent>
      
      {/* Dialog Actions */}
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button 
          onClick={handleClose}
          disabled={loading}
          variant="outlined"
          sx={{
            borderRadius: 1,
            borderColor: 'rgba(0, 0, 0, 0.12)',
            color: 'text.secondary',
            fontSize: '14px',
            fontWeight: 500,
            px: 3,
            py: 1,
            textTransform: 'none',
          }}
        >
          {t('common.cancel', 'Cancel')}
        </Button>
        <Button 
          onClick={handleSave}
          disabled={loading || success || !title.trim() || (!imagePreview && !isUpdate)}
          variant="contained"
          color="primary"
          sx={{
            borderRadius: 1,
            color: 'white',
            fontSize: '14px',
            fontWeight: 500,
            px: 3,
            py: 1,
            textTransform: 'none',
            '&:hover': {
              bgcolor: theme.palette.primary.dark,
            },
          }}
        >
          {loading ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            isUpdate 
              ? t('common.update', 'Update') 
              : t('common.save', 'Save')
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SaveCalculationModal; 