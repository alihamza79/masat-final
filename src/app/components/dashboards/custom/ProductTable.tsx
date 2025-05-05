import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  CircularProgress,
  Chip,
  Tooltip,
  Skeleton
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { IconSearch, IconCurrencyDollar, IconPercentage, IconInfoCircle } from '@tabler/icons-react';
import DashboardCard from '../../shared/DashboardCard';
import { useTranslation } from 'react-i18next';

// Define types for our product data
interface ProductPerformanceData {
  id: string;
  emagProductOfferId?: number | string;
  name: string;
  part_number: string;
  part_number_key: string;
  image?: string;
  averagePrice: number;
  grossRevenue: number;
  sold: number;
  refunded: number;
  actualCostOfGoods?: number;
  costOfGoods?: number;
  profit: number;
  emagCommission?: number;
}

interface ProductTableProps {
  data: ProductPerformanceData[];
  isLoading: boolean;
}

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.mode === 'dark' 
      ? 'rgba(255, 255, 255, 0.05)' 
      : 'rgba(0, 0, 0, 0.02)',
  },
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' 
      ? 'rgba(255, 255, 255, 0.08)' 
      : 'rgba(0, 0, 0, 0.04)',
  },
  // hide last border
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));

// ProductTableSkeleton component
export const ProductTableSkeleton = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  
  // Column headers
  const columns = [
    t('dashboard.products.columns.product'), 
    t('dashboard.products.columns.avgPrice'), 
    t('dashboard.products.columns.sold'), 
    t('dashboard.products.columns.refunded'), 
    t('dashboard.products.columns.cog'), 
    t('dashboard.products.columns.commission'), 
    t('dashboard.products.columns.profit')
  ];
  
  return (
    <DashboardCard
      title={t('dashboard.products.title')}
      subtitle={t('dashboard.products.subtitle')}
    >
      <TableContainer>
        <Table sx={{ whiteSpace: 'nowrap' }}>
          <TableHead>
            <TableRow>
              {columns.map((column, index) => (
                <TableCell key={index}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {column}
                  </Typography>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {Array(5).fill(0).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Skeleton variant="rectangular" width={40} height={40} sx={{ borderRadius: 1, mr: 2 }} />
                    <Box>
                      <Skeleton variant="text" width={150} height={20} />
                      <Skeleton variant="text" width={100} height={16} />
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width={60} height={20} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width={40} height={20} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width={80} height={20} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width={70} height={20} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width={70} height={20} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width={70} height={20} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </DashboardCard>
  );
};

const ProductTable = ({ data, isLoading }: ProductTableProps) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState<ProductPerformanceData[]>([]);
  const [commissionsLoading, setCommissionsLoading] = useState<Record<string, boolean>>({});
  const [productCommissions, setProductCommissions] = useState<Record<string, number>>({});
  
  // Use a ref to track which products we've already requested
  const requestedProductsRef = useRef<Set<string>>(new Set());

  // If loading, show skeleton
  if (isLoading) {
    return <ProductTableSkeleton />;
  }

  // Handle search and filtering
  useEffect(() => {
    if (!data) {
      setFilteredData([]);
      return;
    }

    const lowercaseSearch = searchQuery.toLowerCase().trim();
    
    if (lowercaseSearch === '') {
      setFilteredData(data);
    } else {
      const filtered = data.filter(product => 
        product.name.toLowerCase().includes(lowercaseSearch) ||
        product.part_number.toLowerCase().includes(lowercaseSearch) ||
        product.part_number_key.toLowerCase().includes(lowercaseSearch)
      );
      setFilteredData(filtered);
    }
    
    // Reset to first page when search changes
    setPage(0);
  }, [data, searchQuery]);

  // Memoize current page products to prevent unnecessary recalculations
  const currentPageProducts = useMemo(() => {
    return filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredData, page, rowsPerPage]);

  // Fetch commissions for current page products only
  useEffect(() => {
    const fetchCommissions = async () => {
      // Only fetch for products with emagProductOfferId that don't already have commission data
      // AND haven't been requested yet
      const productsToFetch = currentPageProducts.filter(product => {
        if (!product.emagProductOfferId) return false;
        
        const productId = product.emagProductOfferId.toString();
        
        // Skip if we already have data or have already sent a request
        if (productCommissions[productId] !== undefined || requestedProductsRef.current.has(productId)) {
          return false;
        }
        
        // Mark as requested
        requestedProductsRef.current.add(productId);
        return true;
      });
      
      if (productsToFetch.length === 0) return;
      
      console.log(`Fetching commissions for ${productsToFetch.length} products`);
      
      for (const product of productsToFetch) {
        if (!product.emagProductOfferId) continue;
        
        const productId = product.emagProductOfferId.toString();
        
        try {
          // Set loading state for this product
          setCommissionsLoading(prev => ({ ...prev, [productId]: true }));
          
          // Call the commission API
          const response = await fetch(`/api/v1/commission/estimate/${productId}`);
          const data = await response.json();
          
          if (data.emagResponse?.data?.value !== undefined) {
            // Format commission as percentage
            let commission: number;
            if (typeof data.emagResponse.data.value === 'string') {
              commission = parseFloat(data.emagResponse.data.value);
            } else {
              commission = Number(data.emagResponse.data.value);
            }
            
            // Convert to percentage if needed
            const commissionPercentage = commission > 1 ? commission : commission * 100;
            
            setProductCommissions(prev => ({
              ...prev,
              [productId]: commissionPercentage
            }));
          }
        } catch (error) {
          console.error(`Error fetching commission for product ${productId}:`, error);
        } finally {
          setCommissionsLoading(prev => ({ ...prev, [productId]: false }));
        }
      }
    };
    
    if (currentPageProducts.length > 0) {
      fetchCommissions();
    }
  }, [page, rowsPerPage, filteredData, currentPageProducts]);

  // Handle pagination
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value) + ' RON';
  };

  return (
    <DashboardCard 
      title={t('dashboard.products.title')}
      subtitle={t('dashboard.products.subtitle')}
      action={
        <Box sx={{ width: { xs: '100%', sm: 240 } }}>
          <TextField
            size="small"
            placeholder={t('dashboard.products.searchProducts')}
            fullWidth
            variant="outlined"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <IconSearch size={18} stroke={1.5} />
                </InputAdornment>
              ),
            }}
          />
        </Box>
      }
    >
      <Box sx={{ overflow: 'auto', width: '100%' }}>
        {filteredData.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <Typography variant="body2" color="textSecondary">
              {searchQuery.trim() ? t('dashboard.products.noProductsFound') : t('dashboard.products.noProductData')}
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer component={Paper} elevation={0} sx={{ 
              borderRadius: 1, 
              boxShadow: 'none',
              border: theme => `1px solid ${theme.palette.divider}`
            }}>
              <Table sx={{ minWidth: 650 }} aria-label="product performance table">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>{t('dashboard.products.columns.product')}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">{t('dashboard.products.columns.avgPrice')}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">{t('dashboard.products.columns.sold')}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">{t('dashboard.products.columns.refunded')}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">{t('dashboard.products.columns.cog')}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">
                      <Tooltip title={t('dashboard.products.columns.commissionTooltip')}>
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                          <span>{t('dashboard.products.columns.commission')}</span>
                          <IconInfoCircle size={14} />
                        </Box>
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">{t('dashboard.products.columns.profit')}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">{t('dashboard.products.columns.grossRevenue')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentPageProducts.map((product) => {
                    const productId = product.emagProductOfferId?.toString() || '';
                    const isLoadingCommission = commissionsLoading[productId];
                    const commission = productCommissions[productId];
                    
                    return (
                      <StyledTableRow key={product.id}>
                        <TableCell>
                          <Box 
                            sx={{ 
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2
                            }}
                          >
                            {product.image && (
                              <Box 
                                component="img"
                                src={product.image}
                                alt={product.name}
                                sx={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: 1,
                                  objectFit: 'contain',
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  bgcolor: 'background.paper'
                                }}
                              />
                            )}
                            <Box>
                              <Typography variant="body2" noWrap sx={{ maxWidth: { xs: 150, sm: 300 } }}>
                                {product.name}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {product.part_number_key}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={500}>
                            {formatCurrency(product.averagePrice || 0)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            {product.sold}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {product.refunded > 0 ? (
                            <Chip 
                              label={product.refunded} 
                              size="small" 
                              color="error" 
                              variant="outlined"
                            />
                          ) : (
                            <Typography variant="body2">0</Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={500} color="text.secondary">
                            {formatCurrency(product.costOfGoods || 0)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {isLoadingCommission ? (
                            <CircularProgress size={16} />
                          ) : commission !== undefined ? (
                            <Typography 
                              variant="body2" 
                              fontWeight={500} 
                              sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}
                            >
                              {commission.toFixed(2)}%
                            </Typography>
                          ) : requestedProductsRef.current.has(productId) ? (
                            // We've requested but not received data yet
                            <CircularProgress size={16} />
                          ) : (
                            <Typography variant="body2" color="text.secondary">-</Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Typography 
                            variant="body2" 
                            fontWeight={600}
                          >
                            {formatCurrency(product.profit || 0)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={600}>
                            {formatCurrency(product.grossRevenue || 0)}
                          </Typography>
                        </TableCell>
                      </StyledTableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredData.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Box>
    </DashboardCard>
  );
};

export default ProductTable; 