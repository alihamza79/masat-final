import React from 'react';
import { Stack, Typography, Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { IconRefresh } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

interface CalculatorHeaderProps {
  onNewCalculation: () => void;
}

const CalculatorHeader: React.FC<CalculatorHeaderProps> = ({ onNewCalculation }) => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Stack 
      direction="row" 
      justifyContent="flex-start"
      alignItems="center"
      mb={{ xs: 2, sm: 4 }}
    >
      <Typography 
        variant="h5" 
        sx={{ 
          fontSize: '24px',
          fontWeight: 600,
          color: 'text.primary',
          mr: 2
        }}
      >
        {t('calculator.general.title')}
      </Typography>
      
      {/* New Calculation Button next to heading */}
      <Button
        variant="contained"
        size="small"
        startIcon={<IconRefresh size={14} />}
        onClick={onNewCalculation}
        sx={{
          bgcolor: theme.palette.primary.main,
          color: 'white',
          '&:hover': {
            bgcolor: theme.palette.primary.dark,
          },
          px: { xs: 0.8, sm: 1.2 },
          height: '28px',
          minWidth: '28px',
          borderRadius: '5px',
          textTransform: 'none',
          fontSize: '11px',
          fontWeight: 500,
          boxShadow: 'none'
        }}
      >
        {t('calculator.general.newCalculation')}
      </Button>
    </Stack>
  );
};

export default CalculatorHeader; 