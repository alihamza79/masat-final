import React, { useState, useEffect } from 'react';
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
  Chip
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { IconSearch, IconCurrencyRon } from '@tabler/icons-react';
import DashboardCard from '../../shared/DashboardCard';

// Define types for our product data
interface ProductPerformanceData {
  id: string;
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

const ProductTable = ({ data, isLoading }: ProductTableProps) => {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredData, setFilteredData] = useState<ProductPerformanceData[]>([]);

  // Handle search and filtering
  useEffect(() => {
    if (!data) {
      setFilteredData([]);
      return;
    }

    const lowercaseSearch = searchTerm.toLowerCase().trim();
    
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
  }, [data, searchTerm]);

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
      style: 'currency',
      currency: 'RON',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <DashboardCard 
      title="Product Performance" 
      subtitle="Sales and revenue by product"
      action={
        <Box sx={{ width: { xs: '100%', sm: 240 } }}>
          <TextField
            size="small"
            placeholder="Search products..."
            fullWidth
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : filteredData.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <Typography variant="body2" color="textSecondary">
              {searchTerm.trim() ? 'No products matching your search' : 'No product data available'}
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
                    <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Avg. Price</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Sold</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Refunded</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">COG</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Profit</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Gross Revenue</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredData
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((product) => (
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
                            {formatCurrency(product.averagePrice)}
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
                            {formatCurrency(product.costOfGoods)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography 
                            variant="body2" 
                            fontWeight={600} 
                            color={product.profit >= 0 ? "success.main" : "error.main"}
                          >
                            {formatCurrency(product.profit)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={600} color="primary.main">
                            {formatCurrency(product.grossRevenue)}
                          </Typography>
                        </TableCell>
                      </StyledTableRow>
                    ))}
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