import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import SalesEstimatorInput from '../SalesEstimatorInput';

interface SalesInputProps {
  totalPieces: number;
  onTotalPiecesChange: (value: number) => void;
}

const SalesInput: React.FC<SalesInputProps> = ({ totalPieces, onTotalPiecesChange }) => {
  return (
    <Box
      sx={{ 
        width: { xs: '100%', sm: '200px', md: '240px' },
        flex: { sm: '0 0 200px', md: '0 0 240px' }
      }}
    >
      <Stack spacing={1}>
        <Typography 
          sx={{ 
            fontSize: { xs: '12px', sm: '13px' }, 
            color: 'text.secondary',
            fontWeight: 500,
            height: '20px',
            lineHeight: '20px'
          }}
        >
          Number of sales (PCS)
        </Typography>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          height: '35px',
          position: 'relative'
        }}>
          <SalesEstimatorInput
            label="Number of sales"
            value={totalPieces}
            onChange={onTotalPiecesChange}
            showLabel={false}
          />
          <Typography 
            sx={{ 
              fontSize: '13px',
              color: 'text.secondary',
              userSelect: 'none',
              pl: 0.5,
              position: 'absolute',
              right: { xs: 8, sm: 12 }
            }}
          >
            PCS
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
};

export default SalesInput; 