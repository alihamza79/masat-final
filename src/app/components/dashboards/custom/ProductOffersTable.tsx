import React, { useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  Typography,
  Chip,
  useTheme,
} from '@mui/material';
import DashboardCard from '../../shared/DashboardCard';

type Order = 'asc' | 'desc';

interface ProductOffer {
  id: string;
  name: string;
  averagePrice: number;
  sold: number;
  refunded: number;
  grossRevenue: number;
  costOfGoods: number;
  emagCommission: number;
  profitMargin: number;
}

interface HeadCell {
  id: keyof ProductOffer;
  label: string;
  numeric: boolean;
  format?: (value: any) => React.ReactNode;
}

interface ProductOffersTableProps {
  data: ProductOffer[];
  isLoading?: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value) + ' RON';
}

function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

const headCells: HeadCell[] = [
  { id: 'name', label: 'Product Name', numeric: false },
  { id: 'averagePrice', label: 'Avg. Price', numeric: true, format: (value) => formatCurrency(value) },
  { id: 'sold', label: 'Sold', numeric: true },
  { id: 'refunded', label: 'Refunded', numeric: true },
  { id: 'grossRevenue', label: 'Gross Revenue', numeric: true, format: (value) => formatCurrency(value) },
  { id: 'costOfGoods', label: 'Cost of Goods', numeric: true, format: (value) => formatCurrency(value) },
  { id: 'emagCommission', label: 'eMAG Commission', numeric: true, format: (value) => formatCurrency(value) },
  { id: 'profitMargin', label: 'Profit Margin', numeric: true, format: (value) => {
    return (
      <Chip 
        label={formatPercent(value)}
        size="small"
        sx={{ 
          bgcolor: value >= 30 ? 'success.light' : value >= 15 ? 'warning.light' : 'error.light',
          color: value >= 30 ? 'success.dark' : value >= 15 ? 'warning.dark' : 'error.dark',
          fontWeight: 500,
        }}
      />
    );
  }},
];

const ProductOffersTable: React.FC<ProductOffersTableProps> = ({
  data,
  isLoading = false
}) => {
  const theme = useTheme();
  const [order, setOrder] = useState<Order>('desc');
  const [orderBy, setOrderBy] = useState<keyof ProductOffer>('grossRevenue');
  
  const handleRequestSort = (property: keyof ProductOffer) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };
  
  const sortedData = React.useMemo(() => {
    if (!data) return [];
    
    return [...data].sort((a, b) => {
      const aValue = a[orderBy];
      const bValue = b[orderBy];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return order === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return order === 'asc'
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });
  }, [data, order, orderBy]);
  
  return (
    <DashboardCard
      title="Product Performance"
      subtitle="Analytics of your products"
    >
      <TableContainer 
        component={Paper}
        elevation={0}
        sx={{ 
          maxHeight: 440,
          mt: 2,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 1,
        }}
      >
        <Table stickyHeader sx={{ minWidth: 750 }} aria-label="product offers table">
          <TableHead>
            <TableRow>
              {headCells.map((headCell) => (
                <TableCell
                  key={headCell.id}
                  align={headCell.numeric ? 'right' : 'left'}
                  sortDirection={orderBy === headCell.id ? order : false}
                  sx={{ 
                    bgcolor: theme.palette.mode === 'dark' 
                      ? theme.palette.grey[800] 
                      : theme.palette.grey[100],
                    fontWeight: 600,
                  }}
                >
                  <TableSortLabel
                    active={orderBy === headCell.id}
                    direction={orderBy === headCell.id ? order : 'asc'}
                    onClick={() => handleRequestSort(headCell.id)}
                  >
                    {headCell.label}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={headCells.length} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : sortedData.length > 0 ? (
              sortedData.map((row) => (
                <TableRow
                  key={row.id}
                  hover
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  {headCells.map((headCell) => (
                    <TableCell 
                      key={headCell.id}
                      align={headCell.numeric ? 'right' : 'left'}
                    >
                      {headCell.format 
                        ? headCell.format(row[headCell.id]) 
                        : row[headCell.id].toString()}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={headCells.length} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No product data available
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </DashboardCard>
  );
};

export default ProductOffersTable; 