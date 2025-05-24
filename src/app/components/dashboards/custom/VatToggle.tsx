import React from 'react';
import { 
  Box, 
  FormControlLabel,
  Switch, 
  Typography, 
  useTheme,
  Tooltip
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { alpha } from '@mui/material/styles';

interface VatToggleProps {
  vatEnabled: boolean;
  onVatToggle: (enabled: boolean) => void;
}

const VatToggle: React.FC<VatToggleProps> = ({
  vatEnabled,
  onVatToggle
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const tooltipTitle = vatEnabled 
    ? t('dashboard.vat.enabled')
    : t('dashboard.vat.disabled');

  const handleToggle = () => {
    onVatToggle(!vatEnabled);
  };

  return (
    <Tooltip title={tooltipTitle} arrow>
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          bgcolor: 'background.paper',
          border: `1px solid ${vatEnabled ? theme.palette.primary.main : theme.palette.divider}`,
          borderRadius: 1,
          py: 0.5,
          px: { xs: 1, sm: 1.5 },
          height: '36.5px',
          cursor: 'pointer',
          minWidth: { xs: '60px', sm: '80px' },
          maxWidth: { xs: '80px', sm: '120px' },
          '&:hover': {
            borderColor: theme.palette.primary.main,
            bgcolor: vatEnabled ? alpha(theme.palette.primary.main, 0.04) : 'background.paper',
          },
        }}
        onClick={handleToggle}
      >
        <FormControlLabel
          control={
            <Switch
              checked={vatEnabled}
              onChange={handleToggle}
              color="primary"
              size="small"
              sx={{
                m: 0,
                '& .MuiSwitch-switchBase': {
                  padding: '6px',
                  '&.Mui-checked': {
                    '& .MuiSwitch-thumb': {
                      backgroundColor: '#ffffff',
                    },
                    '& + .MuiSwitch-track': {
                      opacity: 1,
                    },
                  },
                },
                '& .MuiSwitch-thumb': {
                  width: 16,
                  height: 16,
                  backgroundColor: '#ffffff',
                  boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)',
                },
                '& .MuiSwitch-track': {
                  borderRadius: 8,
                  opacity: 1,
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.25)' 
                    : 'rgba(0, 0, 0, 0.25)',
                }
              }}
            />
          }
          label={
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 500,
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                color: vatEnabled ? theme.palette.primary.main : theme.palette.text.primary,
                ml: 0.5,
                userSelect: 'none'
              }}
            >
              {t('dashboard.vat.toggle')}
            </Typography>
          }
          sx={{
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            height: '100%',
            '& .MuiFormControlLabel-label': {
              cursor: 'pointer'
            }
          }}
        />
      </Box>
    </Tooltip>
  );
};

export default VatToggle; 