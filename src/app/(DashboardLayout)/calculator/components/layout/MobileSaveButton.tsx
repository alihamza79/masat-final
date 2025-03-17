import React from 'react';
import { Button } from '@mui/material';
import { IconDeviceFloppy } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

interface MobileSaveButtonProps {
  onOpenSaveModal: () => void;
}

const MobileSaveButton: React.FC<MobileSaveButtonProps> = ({ onOpenSaveModal }) => {
  const { t } = useTranslation();

  return (
    <Button
      variant="contained"
      size="small"
      startIcon={<IconDeviceFloppy size={18} />}
      onClick={onOpenSaveModal}
      sx={{
        display: { xs: 'flex', sm: 'none' },
        bgcolor: '#00c292',
        color: 'white',
        '&:hover': {
          bgcolor: '#00a67d',
        },
        px: 2.5,
        height: '40px',
        borderRadius: '8px',
        textTransform: 'none',
        fontSize: '13px',
        fontWeight: 500,
        boxShadow: 'none',
        width: '100%',
        mt: 3
      }}
    >
      {t('calculator.general.saveCalculation')}
    </Button>
  );
};

export default MobileSaveButton; 