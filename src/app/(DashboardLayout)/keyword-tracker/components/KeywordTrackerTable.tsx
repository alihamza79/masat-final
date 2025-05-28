'use client';
import React, { useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  CircularProgress,
  TablePagination,
  useTheme,
  Theme,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Avatar,
  Chip,
  Skeleton,
  Stack,
  Button
} from '@mui/material';
import {
  IconEdit,
  IconTrash,
  IconDotsVertical,
  IconTag,
  IconPackage,
  IconTrendingUp,
  IconTrendingDown,
  IconMinus,
  IconEye
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { KeywordTrackedProduct } from '@/lib/hooks/useKeywordTracker';
import DeleteConfirmationDialog from '@/app/components/dialogs/DeleteConfirmationDialog';
import ViewKeywordsDialog from './ViewKeywordsDialog';

interface KeywordTrackerTableProps {
  trackedProducts: KeywordTrackedProduct[];
  isLoading: boolean;
  onEditKeywords: (trackedProduct: KeywordTrackedProduct) => void;
  onDeleteTrackedProduct: (trackedProduct: KeywordTrackedProduct) => void;
  isDeleting: string | null;
}

// Helper function for consistent icon button styling
const getIconButtonStyle = (theme: Theme) => ({
  width: 28, 
  height: 28, 
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'center',
  backgroundColor: theme.palette.action.hover,
  borderRadius: '8px',
  transition: 'background 0.2s',
  '&:hover': {
    backgroundColor: theme.palette.action.selected
  }
});

const KeywordTrackerTable: React.FC<KeywordTrackerTableProps> = ({
  trackedProducts,
  isLoading,
  onEditKeywords,
  onDeleteTrackedProduct,
  isDeleting
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedProduct, setSelectedProduct] = useState<KeywordTrackedProduct | null>(null);
  const [openConfirmDelete, setOpenConfirmDelete] = useState<boolean>(false);
  const [deleteProductId, setDeleteProductId] = useState<string>('');
  const [openViewKeywords, setOpenViewKeywords] = useState<boolean>(false);
  const [viewProduct, setViewProduct] = useState<KeywordTrackedProduct | null>(null);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, product: KeywordTrackedProduct) => {
    setAnchorEl(event.currentTarget);
    setSelectedProduct(product);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProduct(null);
  };

  const handleOpenConfirmDelete = (id: string) => {
    setDeleteProductId(id);
    setOpenConfirmDelete(true);
    handleMenuClose();
  };

  const handleConfirmDelete = () => {
    if (deleteProductId) {
      onDeleteTrackedProduct(selectedProduct!);
      setOpenConfirmDelete(false);
      setDeleteProductId('');
    }
  };

  const handleCancelDelete = () => {
    setOpenConfirmDelete(false);
    setDeleteProductId('');
  };

  const handleEdit = () => {
    if (selectedProduct) {
      onEditKeywords(selectedProduct);
      handleMenuClose();
    }
  };

  const handleDelete = () => {
    if (selectedProduct) {
      onDeleteTrackedProduct(selectedProduct);
      handleMenuClose();
    }
  };

  const handleView = () => {
    if (selectedProduct) {
      setViewProduct(selectedProduct);
      setOpenViewKeywords(true);
      handleMenuClose();
    }
  };

  const handleViewKeywords = (product: KeywordTrackedProduct) => {
    setViewProduct(product);
    setOpenViewKeywords(true);
  };

  const getImageUrl = (product: KeywordTrackedProduct) => {
    return product.productImage || null;
  };

  const renderKeywordCount = (keywords: string[], product: KeywordTrackedProduct) => {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Button
          variant="outlined"
          size="small"
          onClick={() => handleViewKeywords(product)}
          startIcon={<IconTag size={16} />}
          sx={{
            minWidth: 'auto',
            px: 1.5,
            py: 0.5,
            fontSize: '0.875rem',
            borderRadius: '6px',
            '&:hover': {
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              borderColor: theme.palette.primary.main,
            }
          }}
        >
          {keywords.length}
        </Button>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onEditKeywords(product);
          }}
          sx={{
            color: theme.palette.primary.main,
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
            }
          }}
        >
          <IconEdit size={16} />
        </IconButton>
      </Box>
    );
  };

  const renderMetric = (value: number, total: number) => {
    if (total === 0) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <IconMinus size={16} color={theme.palette.text.disabled} />
          <Typography variant="body2" color="text.disabled">
            0
          </Typography>
        </Box>
      );
    }

    const percentage = Math.round((value / total) * 100);
    const isGood = percentage >= 50;
    const isMedium = percentage >= 25;

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {isGood ? (
          <IconTrendingUp size={16} color={theme.palette.success.main} />
        ) : isMedium ? (
          <IconMinus size={16} color={theme.palette.warning.main} />
        ) : (
          <IconTrendingDown size={16} color={theme.palette.error.main} />
        )}
        <Typography 
          variant="body2" 
          color={isGood ? 'success.main' : isMedium ? 'warning.main' : 'error.main'}
          fontWeight={500}
        >
          {value}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          ({percentage}%)
        </Typography>
      </Box>
    );
  };

  const LoadingSkeleton = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t('keywordTracker.table.srNumber')}</TableCell>
            <TableCell>{t('keywordTracker.table.product')}</TableCell>
            <TableCell>{t('keywordTracker.table.trackedKeywords')}</TableCell>
            <TableCell align="center">{t('keywordTracker.table.organicTop10')}</TableCell>
            <TableCell align="center">{t('keywordTracker.table.organicTop50')}</TableCell>
            <TableCell align="center">{t('keywordTracker.table.sponsoredTop10')}</TableCell>
            <TableCell align="center">{t('keywordTracker.table.sponsoredTop50')}</TableCell>
            <TableCell>{t('keywordTracker.table.dateAdded')}</TableCell>
            <TableCell align="center">{t('keywordTracker.table.actions')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {[...Array(5)].map((_, index) => (
            <TableRow key={index}>
              <TableCell><Skeleton variant="text" width={30} /></TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Skeleton variant="rectangular" width={40} height={40} />
                  <Box>
                    <Skeleton variant="text" width={150} />
                    <Skeleton variant="text" width={100} />
                  </Box>
                </Box>
              </TableCell>
              <TableCell><Skeleton variant="text" width={80} /></TableCell>
              <TableCell><Skeleton variant="text" width={50} /></TableCell>
              <TableCell><Skeleton variant="text" width={50} /></TableCell>
              <TableCell><Skeleton variant="text" width={50} /></TableCell>
              <TableCell><Skeleton variant="text" width={50} /></TableCell>
              <TableCell><Skeleton variant="text" width={80} /></TableCell>
              <TableCell><Skeleton variant="circular" width={24} height={24} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (trackedProducts.length === 0) {
    return (
      <Paper sx={{ p: 3 }}>
        <Box 
          display="flex" 
          flexDirection="column"
          justifyContent="center" 
          alignItems="center" 
          minHeight="200px"
          gap={2}
        >
          <IconPackage size={48} stroke={1} color={theme.palette.text.disabled} />
          <Typography variant="h6" color="textSecondary" textAlign="center">
            {t('keywordTracker.table.noProducts')}
          </Typography>
          <Typography variant="body2" color="textSecondary" textAlign="center">
            {t('keywordTracker.table.addFirstProduct')}
          </Typography>
        </Box>
      </Paper>
    );
  }

  // Calculate displayed products for current page
  const displayedProducts = trackedProducts.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Paper elevation={1} sx={{ width: '100%', overflow: 'hidden', borderRadius: 1, boxShadow: theme.shadows[1] }}>
      <TableContainer sx={{ maxHeight: 'none' }}>
        <Table stickyHeader aria-label="keyword tracker table">
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 60 }}>{t('keywordTracker.table.srNumber', 'Sr #')}</TableCell>
              <TableCell sx={{ minWidth: 200 }}>{t('keywordTracker.table.product', 'Product')}</TableCell>
              <TableCell sx={{ minWidth: 150 }}>{t('keywordTracker.table.trackedKeywords', 'Tracked Keywords')}</TableCell>
              <TableCell sx={{ width: 120, textAlign: 'center' }}>
                <Typography variant="caption" sx={{ lineHeight: 1.2, display: 'block' }}>
                  {t('keywordTracker.table.organicTop10', 'Organic Top 10')}
                </Typography>
              </TableCell>
              <TableCell sx={{ width: 120, textAlign: 'center' }}>
                <Typography variant="caption" sx={{ lineHeight: 1.2, display: 'block' }}>
                  {t('keywordTracker.table.organicTop50', 'Organic Top 50')}
                </Typography>
              </TableCell>
              <TableCell sx={{ width: 120, textAlign: 'center' }}>
                <Typography variant="caption" sx={{ lineHeight: 1.2, display: 'block' }}>
                  {t('keywordTracker.table.sponsoredTop10', 'Sponsored Top 10')}
                </Typography>
              </TableCell>
              <TableCell sx={{ width: 120, textAlign: 'center' }}>
                <Typography variant="caption" sx={{ lineHeight: 1.2, display: 'block' }}>
                  {t('keywordTracker.table.sponsoredTop50', 'Sponsored Top 50')}
                </Typography>
              </TableCell>
              <TableCell sx={{ width: 140 }}>{t('keywordTracker.table.dateAdded', 'Date Added')}</TableCell>
              <TableCell align="right" sx={{ width: 80 }}>{t('keywordTracker.table.actions', 'Actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayedProducts.map((product, index) => {
              const globalIndex = page * rowsPerPage + index + 1;
              const imageUrl = getImageUrl(product);
              const isCurrentlyDeleting = isDeleting === product._id;

              return (
                <TableRow 
                  key={product._id} 
                  sx={{ 
                    opacity: isCurrentlyDeleting ? 0.5 : 1,
                    '&:hover': { backgroundColor: theme.palette.action.hover }
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {globalIndex}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {imageUrl ? (
                        <Avatar 
                          src={imageUrl} 
                          alt={product.productName}
                          sx={{ 
                            width: 40, 
                            height: 40, 
                            borderRadius: 1,
                            '& img': { objectFit: 'cover' }
                          }}
                        />
                      ) : (
                        <Avatar 
                          sx={{ 
                            width: 40, 
                            height: 40, 
                            borderRadius: 1,
                            bgcolor: theme.palette.grey[100],
                            color: theme.palette.text.secondary
                          }}
                        >
                          <IconPackage size={20} />
                        </Avatar>
                      )}
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography 
                          variant="body2" 
                          fontWeight={500}
                          sx={{ 
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '200px'
                          }}
                        >
                          {product.productName}
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                          {product.productSKU && (
                            <Typography variant="caption" color="textSecondary">
                              SKU: {product.productSKU}
                            </Typography>
                          )}
                          {product.productPNK && (
                            <Typography variant="caption" color="textSecondary">
                              PNK: {product.productPNK}
                            </Typography>
                          )}
                        </Stack>
                      </Box>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    {renderKeywordCount(product.keywords, product)}
                  </TableCell>
                  
                  <TableCell align="center">
                    {renderMetric(product.organicTop10, product.keywords.length)}
                  </TableCell>
                  
                  <TableCell align="center">
                    {renderMetric(product.organicTop50, product.keywords.length)}
                  </TableCell>
                  
                  <TableCell align="center">
                    {renderMetric(product.sponsoredTop10, product.keywords.length)}
                  </TableCell>
                  
                  <TableCell align="center">
                    {renderMetric(product.sponsoredTop50, product.keywords.length)}
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="caption" color="textSecondary">
                      {product.createdAt ? format(new Date(product.createdAt), 'MMM dd, yyyy') : '-'}
                    </Typography>
                  </TableCell>
                  
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, product)}
                      disabled={isCurrentlyDeleting}
                    >
                      <IconDotsVertical size={16} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Only show pagination when needed */}
      {trackedProducts.length > 10 && !isLoading && (
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={trackedProducts.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage={t('keywordTracker.table.rowsPerPage')}
        />
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleView}>
          <ListItemIcon>
            <IconEye size={18} />
          </ListItemIcon>
          <ListItemText>{t('keywordTracker.actions.viewKeywords', 'View Keywords')}</ListItemText>
        </MenuItem>

        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <IconEdit size={18} />
          </ListItemIcon>
          <ListItemText>{t('keywordTracker.actions.editKeywords', 'Edit Keywords')}</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => selectedProduct?._id && handleOpenConfirmDelete(selectedProduct._id)}>
          <ListItemIcon>
            <IconTrash size={18} color={theme.palette.error.main} />
          </ListItemIcon>
          <ListItemText sx={{ color: theme.palette.error.main }}>
            {t('keywordTracker.actions.delete', 'Delete')}
          </ListItemText>
        </MenuItem>
      </Menu>

      <DeleteConfirmationDialog
        open={openConfirmDelete}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        integrationName={selectedProduct?.productName || ''}
        title={t('keywordTracker.deleteDialog.title', 'Remove Product Tracking')}
        message={t('keywordTracker.deleteDialog.content', 'Are you sure you want to stop tracking keywords for this product? This action cannot be undone.')}
      />

      <ViewKeywordsDialog
        open={openViewKeywords}
        onClose={() => setOpenViewKeywords(false)}
        trackedProduct={viewProduct}
        onEdit={() => {
          setOpenViewKeywords(false);
          if (viewProduct) {
            onEditKeywords(viewProduct);
          }
        }}
      />
    </Paper>
  );
};

export default KeywordTrackerTable; 