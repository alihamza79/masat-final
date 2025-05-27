import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
  Box,
  useTheme,
  Avatar,
  Typography,
  Chip,
  InputAdornment,
  Paper,
  Divider
} from '@mui/material';
import { IconTag, IconPlus, IconX, IconEdit } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { KeywordTrackedProduct } from '@/lib/hooks/useKeywordTracker';

interface EditKeywordsDialogProps {
  open: boolean;
  onClose: () => void;
  trackedProduct: KeywordTrackedProduct | null;
  onSubmit: (keywords: string[]) => Promise<void>;
  isSubmitting?: boolean;
}

const EditKeywordsDialog: React.FC<EditKeywordsDialogProps> = ({
  open,
  onClose,
  trackedProduct,
  onSubmit,
  isSubmitting = false,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  
  const [keywordInput, setKeywordInput] = useState<string>('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [originalKeywords, setOriginalKeywords] = useState<string[]>([]);
  const [error, setError] = useState<string>('');

  // Reset form when dialog opens or product changes
  useEffect(() => {
    if (open && trackedProduct) {
      const productKeywords = trackedProduct.keywords || [];
      setKeywords([...productKeywords]);
      setOriginalKeywords([...productKeywords]);
      setKeywordInput('');
      setError('');
    }
  }, [open, trackedProduct]);

  const handleKeywordInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && keywordInput.trim()) {
      e.preventDefault();
      addKeyword();
    }
  };

  const addKeyword = () => {
    const trimmedKeyword = keywordInput.trim();
    if (trimmedKeyword && !keywords.includes(trimmedKeyword)) {
      setKeywords(prev => [...prev, trimmedKeyword]);
      setKeywordInput('');
      
      // Clear error when keywords are added
      if (error) {
        setError('');
      }
    }
  };

  const removeKeyword = (keywordToRemove: string) => {
    setKeywords(prev => prev.filter(keyword => keyword !== keywordToRemove));
  };

  const validateForm = (): boolean => {
    if (keywords.length === 0) {
      setError(t('keywordTracker.editDialog.errors.keywordsRequired', 'At least one keyword is required'));
      return false;
    }
    
    setError('');
    return true;
  };

  const handleSubmit = async () => {
    if (validateForm() && !isSubmitting && trackedProduct?._id) {
      try {
        await onSubmit(keywords);
      } catch (error) {
        console.error('Form submission error:', error);
      }
    }
  };

  // Calculate changes
  const addedKeywords = keywords.filter(keyword => !originalKeywords.includes(keyword));
  const deletedKeywords = originalKeywords.filter(keyword => !keywords.includes(keyword));
  const hasChanges = addedKeywords.length > 0 || deletedKeywords.length > 0;

  if (!trackedProduct) {
    return null;
  }

  return (
    <Dialog 
      open={open} 
      onClose={!isSubmitting ? onClose : undefined}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: 1,
          maxWidth: '650px'
        }
      }}
    >
      <DialogTitle>
        {t('keywordTracker.editDialog.title', 'Edit Tracked Keywords')}
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          {/* Product Summary */}
          <Paper sx={{ p: 2, mb: 3, bgcolor: theme.palette.action.hover }}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'primary.main' }}>
              {t('keywordTracker.editDialog.productSummary', 'Product Summary')}
            </Typography>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar
                src={trackedProduct.productImage}
                alt={trackedProduct.productName}
                sx={{ width: 48, height: 48 }}
              >
                {trackedProduct.productName.charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1" fontWeight={600} sx={{ mb: 0.5 }}>
                  {trackedProduct.productName}
                </Typography>
                <Box display="flex" gap={2} flexWrap="wrap">
                  {trackedProduct.productSKU && (
                    <Typography variant="caption" color="textSecondary">
                      <strong>SKU:</strong> {trackedProduct.productSKU}
                    </Typography>
                  )}
                  {trackedProduct.productPNK && (
                    <Typography variant="caption" color="textSecondary">
                      <strong>PNK:</strong> {trackedProduct.productPNK}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>
          </Paper>

          {/* Keywords Input */}
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              label={t('keywordTracker.editDialog.keywordsLabel', 'Add Keywords')}
              placeholder={t('keywordTracker.editDialog.keywordsPlaceholder', 'Type a keyword and press Enter...')}
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyPress={handleKeywordInputKeyPress}
              error={!!error}
              helperText={error || t('keywordTracker.editDialog.keywordsHelp', 'Press Enter to add each keyword')}
              disabled={isSubmitting}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconTag size={20} />
                  </InputAdornment>
                ),
                endAdornment: keywordInput.trim() && (
                  <InputAdornment position="end">
                    <Button
                      size="small"
                      onClick={addKeyword}
                      disabled={isSubmitting}
                      startIcon={<IconPlus size={16} />}
                    >
                      Add
                    </Button>
                  </InputAdornment>
                )
              }}
            />
          </Box>

          {/* Current Keywords List */}
          {keywords.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {t('keywordTracker.editDialog.currentKeywords', 'Current Keywords')} ({keywords.length})
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {keywords.map((keyword, index) => {
                  const isNew = addedKeywords.includes(keyword);
                  return (
                    <Chip
                      key={index}
                      label={keyword}
                      onDelete={() => removeKeyword(keyword)}
                      deleteIcon={<IconX size={16} />}
                      size="small"
                      color={isNew ? 'success' : 'primary'}
                      variant={isNew ? 'filled' : 'outlined'}
                      disabled={isSubmitting}
                      sx={{
                        ...(isNew && {
                          animation: 'pulse 1s ease-in-out'
                        })
                      }}
                    />
                  );
                })}
              </Box>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Summary of Changes */}
          <Paper sx={{ p: 2, bgcolor: theme.palette.background.default }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {t('keywordTracker.editDialog.summary', 'Summary of Modifications')}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 1 }}>
              <Typography variant="body2">
                <strong>{t('keywordTracker.editDialog.totalKeywords', 'Total Keywords')}:</strong> {keywords.length}
              </Typography>
              <Typography variant="body2" color="success.main">
                <strong>{t('keywordTracker.editDialog.addedKeywords', 'Added')}:</strong> {addedKeywords.length}
              </Typography>
              <Typography variant="body2" color="error.main">
                <strong>{t('keywordTracker.editDialog.deletedKeywords', 'Deleted')}:</strong> {deletedKeywords.length}
              </Typography>
            </Box>
            
            {/* Show added keywords */}
            {addedKeywords.length > 0 && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" color="success.main" sx={{ fontWeight: 500 }}>
                  {t('keywordTracker.editDialog.addedKeywordsList', 'Added Keywords')}:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                  {addedKeywords.map((keyword, index) => (
                    <Chip
                      key={index}
                      label={keyword}
                      size="small"
                      color="success"
                      variant="outlined"
                      sx={{ fontSize: '0.7rem', height: '20px' }}
                    />
                  ))}
                </Box>
              </Box>
            )}
            
            {/* Show deleted keywords */}
            {deletedKeywords.length > 0 && (
              <Box>
                <Typography variant="caption" color="error.main" sx={{ fontWeight: 500 }}>
                  {t('keywordTracker.editDialog.deletedKeywordsList', 'Deleted Keywords')}:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                  {deletedKeywords.map((keyword, index) => (
                    <Chip
                      key={index}
                      label={keyword}
                      size="small"
                      color="error"
                      variant="outlined"
                      sx={{ fontSize: '0.7rem', height: '20px', textDecoration: 'line-through' }}
                    />
                  ))}
                </Box>
              </Box>
            )}
            
            {!hasChanges && (
              <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>
                {t('keywordTracker.editDialog.noChanges', 'No changes made')}
              </Typography>
            )}
          </Paper>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button 
          onClick={onClose} 
          disabled={isSubmitting}
          variant="outlined"
        >
          {t('common.cancel', 'Cancel')}
        </Button>
        <Button 
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={isSubmitting || keywords.length === 0 || !hasChanges}
          startIcon={isSubmitting ? <CircularProgress size={20} /> : <IconEdit size={18} />}
        >
          {isSubmitting ? t('keywordTracker.editDialog.updating', 'Updating...') : t('keywordTracker.editDialog.updateButton', 'Update Keywords')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditKeywordsDialog; 