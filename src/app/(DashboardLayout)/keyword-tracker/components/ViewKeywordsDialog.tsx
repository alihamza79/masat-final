import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  useTheme,
  Avatar,
  Typography,
  Chip,
  Paper,
  Divider,
  IconButton
} from '@mui/material';
import { IconTag, IconEdit, IconX, IconPackage } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { KeywordTrackedProduct } from '@/lib/hooks/useKeywordTracker';
import { format } from 'date-fns';

interface ViewKeywordsDialogProps {
  open: boolean;
  onClose: () => void;
  trackedProduct: KeywordTrackedProduct | null;
  onEdit?: () => void;
}

const ViewKeywordsDialog: React.FC<ViewKeywordsDialogProps> = ({
  open,
  onClose,
  trackedProduct,
  onEdit,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  if (!trackedProduct) {
    return null;
  }

  const handleEdit = () => {
    if (onEdit) {
      onEdit();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: 1,
          maxWidth: '650px'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconTag size={24} color={theme.palette.primary.main} />
          <Typography variant="h6">
            {t('keywordTracker.viewDialog.title', 'Tracked Keywords')}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <IconX size={20} />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          {/* Product Summary */}
          <Paper sx={{ p: 1.5, mb: 2, bgcolor: theme.palette.action.hover }}>
            <Typography variant="caption" sx={{ mb: 0.5, color: 'primary.main', fontWeight: 500, display: 'block', fontSize: '0.65rem' }}>
              {t('keywordTracker.viewDialog.productSummary', 'Product Information')}
            </Typography>
            <Box display="flex" alignItems="center" gap={1.5}>
              {trackedProduct.productImage ? (
                <Avatar
                  src={trackedProduct.productImage}
                  alt={trackedProduct.productName}
                  sx={{ width: 28, height: 28, borderRadius: 1 }}
                />
              ) : (
                <Avatar
                  sx={{ 
                    width: 28, 
                    height: 28, 
                    borderRadius: 1,
                    bgcolor: theme.palette.grey[100],
                    color: theme.palette.text.secondary
                  }}
                >
                  <IconPackage size={16} />
                </Avatar>
              )}
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" fontWeight={500} sx={{ mb: 0.25, fontSize: '0.75rem', display: 'block' }}>
                  {trackedProduct.productName}
                </Typography>
                <Box display="flex" gap={1.5} flexWrap="wrap" sx={{ mb: 0.5 }}>
                  {trackedProduct.productSKU && (
                    <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.65rem' }}>
                      <strong>SKU:</strong> {trackedProduct.productSKU}
                    </Typography>
                  )}
                  {trackedProduct.productPNK && (
                    <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.65rem' }}>
                      <strong>PNK:</strong> {trackedProduct.productPNK}
                    </Typography>
                  )}
                </Box>
                <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.65rem' }}>
                  <strong>Date Added:</strong> {trackedProduct.createdAt ? format(new Date(trackedProduct.createdAt), 'MMM dd, yyyy') : '-'}
                </Typography>
              </Box>
            </Box>
          </Paper>

          <Divider sx={{ my: 2 }} />

          {/* Keywords List */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconTag size={18} />
              {t('keywordTracker.viewDialog.trackedKeywords', 'Tracked Keywords')} ({trackedProduct.keywords.length})
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {trackedProduct.keywords.map((keyword, index) => (
                <Chip
                  key={index}
                  label={keyword}
                  size="small"
                  variant="outlined"
                  color="primary"
                />
              ))}
            </Box>
          </Paper>

          <Divider sx={{ my: 2 }} />

          {/* Performance Summary */}
          <Paper sx={{ p: 2, bgcolor: theme.palette.background.default }}>
            <Typography variant="subtitle2" sx={{ mb: 2, color: 'primary.main' }}>
              {t('keywordTracker.viewDialog.performanceSummary', 'Performance Summary')}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ textAlign: 'center', flex: 1 }}>
                <Typography variant="h6" color="success.main" fontWeight={600} sx={{ fontSize: '1rem' }}>
                  {trackedProduct.organicTop10}
                </Typography>
                <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.65rem' }}>
                  {t('keywordTracker.viewDialog.organicTop10', 'Organic Top 10')}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center', flex: 1 }}>
                <Typography variant="h6" color="success.main" fontWeight={600} sx={{ fontSize: '1rem' }}>
                  {trackedProduct.organicTop50}
                </Typography>
                <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.65rem' }}>
                  {t('keywordTracker.viewDialog.organicTop50', 'Organic Top 50')}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center', flex: 1 }}>
                <Typography variant="h6" color="warning.main" fontWeight={600} sx={{ fontSize: '1rem' }}>
                  {trackedProduct.sponsoredTop10}
                </Typography>
                <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.65rem' }}>
                  {t('keywordTracker.viewDialog.sponsoredTop10', 'Sponsored Top 10')}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center', flex: 1 }}>
                <Typography variant="h6" color="warning.main" fontWeight={600} sx={{ fontSize: '1rem' }}>
                  {trackedProduct.sponsoredTop50}
                </Typography>
                <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.65rem' }}>
                  {t('keywordTracker.viewDialog.sponsoredTop50', 'Sponsored Top 50')}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined">
          {t('common.close', 'Close')}
        </Button>
        {onEdit && (
          <Button
            onClick={handleEdit}
            variant="contained"
            color="primary"
            startIcon={<IconEdit size={16} />}
          >
            {t('keywordTracker.viewDialog.editButton', 'Edit Keywords')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ViewKeywordsDialog; 