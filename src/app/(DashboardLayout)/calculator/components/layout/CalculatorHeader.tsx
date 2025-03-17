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
      direction={{ xs: 'column', sm: 'row' }} 
      justifyContent="space-between"
      alignItems="center"
      mb={{ xs: 2, sm: 4 }}
    >
      <Stack 
        direction={{ xs: 'row', sm: 'row' }} 
        justifyContent="space-between"
        alignItems="center"
        width={{ xs: '100%', sm: 'auto' }}
        mb={{ xs: 2, sm: 0 }}
      >
        <Typography 
          variant="h5" 
          sx={{ 
            fontSize: '24px',
            fontWeight: 600,
            color: 'text.primary'
          }}
        >
          {t('calculator.general.title')}
        </Typography>
        
        {/* New Calculation Button in Header - Mobile */}
        <Button
          variant="contained"
          size="small"
          startIcon={<IconRefresh size={18} />}
          onClick={onNewCalculation}
          sx={{
            bgcolor: theme.palette.primary.main,
            color: 'white',
            '&:hover': {
              bgcolor: theme.palette.primary.dark,
            },
            px: 1.5,
            height: '38px',
            borderRadius: '8px',
            textTransform: 'none',
            fontSize: '13px',
            fontWeight: 500,
            boxShadow: 'none',
            display: { xs: 'flex', sm: 'none' }
          }}
        >
          {t('calculator.general.newCalculation')}
        </Button>
      </Stack>
      
      {/* New Calculation Button in Header - Desktop */}
      <Button
        variant="contained"
        size="small"
        startIcon={<IconRefresh size={18} />}
        onClick={onNewCalculation}
        sx={{
          bgcolor: theme.palette.primary.main,
          color: 'white',
          '&:hover': {
            bgcolor: theme.palette.primary.dark,
          },
          px: { sm: 2.5 },
          height: '38px',
          borderRadius: '8px',
          textTransform: 'none',
          fontSize: '13px',
          fontWeight: 500,
          boxShadow: 'none',
          display: { xs: 'none', sm: 'flex' }
        }}
      >
        {t('calculator.general.newCalculation')}
      </Button>
    </Stack>
  );
};

export default CalculatorHeader; 