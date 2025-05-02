'use client';
import { Box, Card, CardContent, Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import React from 'react';

interface ExpenseLoadingSkeletonProps {
  isMobile: boolean;
}

const ExpenseLoadingSkeleton = ({ isMobile }: ExpenseLoadingSkeletonProps) => {
  return (
    <Card>
      <CardContent>
        <Box sx={{ mb: 3 }}>
          <Skeleton variant="text" width="200px" height={40} />
          <Skeleton variant="rectangular" height={48} sx={{ mt: 2 }} />
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {Array(isMobile ? 3 : 5).fill(0).map((_, index) => (
                  <TableCell key={index}>
                    <Skeleton variant="text" />
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {Array(5).fill(0).map((_, index) => (
                <TableRow key={index}>
                  {Array(isMobile ? 3 : 5).fill(0).map((_, cellIndex) => (
                    <TableCell key={cellIndex}>
                      <Skeleton variant="text" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default ExpenseLoadingSkeleton; 