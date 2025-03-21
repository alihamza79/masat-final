import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Stack, 
  Switch, 
  Typography, 
  Menu, 
  MenuItem 
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { 
  IconSettings, 
  IconLayoutCollage, 
  IconLayoutGrid, 
  IconDeviceFloppy 
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { CardKey, VisibleCards } from '../../hooks/useCalculatorReset';

interface CalculatorControlsProps {
  syncValues: boolean;
  onSyncValuesChange: (value: boolean) => void;
  isExpanded: boolean;
  isAnySectionExpanded: boolean;
  onToggleAll: () => void;
  visibleCards: VisibleCards;
  onCardVisibilityToggle: (cardKey: CardKey) => void;
  onOpenSaveModal: () => void;
}

const CalculatorControls: React.FC<CalculatorControlsProps> = ({
  syncValues,
  onSyncValuesChange,
  isExpanded,
  isAnySectionExpanded,
  onToggleAll,
  visibleCards,
  onCardVisibilityToggle,
  onOpenSaveModal
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(null);

  const handleSettingsClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setSettingsAnchorEl(event.currentTarget);
  };

  const handleSettingsClose = () => {
    setSettingsAnchorEl(null);
  };

  return (
    <Stack 
      direction={{ xs: 'column', sm: 'row' }} 
      spacing={2}
      alignItems={{ xs: 'stretch', sm: 'center' }}
    >
      {/* Desktop Controls */}
      <Stack 
        direction="row" 
        spacing={2}
        alignItems="center"
        sx={{ 
          display: { xs: 'none', sm: 'flex' }
        }}
      >
        {/* Sync Toggle */}
        <Box sx={{ 
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <Typography 
            variant="body2" 
            color="textSecondary"
            sx={{ fontSize: '12px' }}
          >
            {t('calculator.general.syncAllValues')}
          </Typography>
          <Switch
            size="small"
            checked={syncValues}
            onChange={(e) => onSyncValuesChange(e.target.checked)}
          />
        </Box>

        {/* Expand/Collapse Button */}
        <Button
          variant="outlined"
          size="small"
          startIcon={isExpanded ? <IconLayoutCollage size={18} /> : <IconLayoutGrid size={18} />}
          onClick={onToggleAll}
          sx={{
            height: '35px',
            px: 2,
            borderColor: theme.palette.divider,
            color: theme.palette.text.primary,
            bgcolor: theme.palette.background.paper,
            textTransform: 'none',
            fontSize: '13px',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            '&:hover': {
              borderColor: theme.palette.text.primary,
              bgcolor: 'transparent',
              color: theme.palette.text.primary
            }
          }}
        >
          {isAnySectionExpanded ? t('calculator.general.collapseAll') : t('calculator.general.expandAll')}
        </Button>

        {/* Settings Button */}
        <Button
          variant="outlined"
          size="small"
          startIcon={<IconSettings size={18} />}
          onClick={handleSettingsClick}
          sx={{
            height: '35px',
            px: 2,
            borderColor: theme.palette.divider,
            color: theme.palette.text.primary,
            bgcolor: theme.palette.background.paper,
            textTransform: 'none',
            fontSize: '13px',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            '&:hover': {
              borderColor: theme.palette.text.primary,
              bgcolor: 'transparent',
              color: theme.palette.text.primary
            }
          }}
        >
          {t('calculator.general.chooseCalculator')}
        </Button>

        {/* Save Calculation Button */}
        <Button
          variant="contained"
          size="small"
          startIcon={<IconDeviceFloppy size={18} />}
          onClick={onOpenSaveModal}
          sx={{
            bgcolor: '#00c292',
            color: 'white',
            '&:hover': {
              bgcolor: '#00a67d',
            },
            px: { sm: 2.5 },
            height: '35px',
            borderRadius: '8px',
            textTransform: 'none',
            fontSize: '13px',
            fontWeight: 500,
            boxShadow: 'none',
            minWidth: 'auto',
            whiteSpace: 'nowrap'
          }}
        >
          {t('calculator.general.saveCalculation')}
        </Button>
      </Stack>

      {/* Mobile Controls */}
      <Box 
        sx={{ 
          display: { xs: 'block', sm: 'none' },
          width: '100%'
        }}
      >
        <Stack spacing={1} width="100%">
          {/* Settings Button - Mobile */}
          <Button
            variant="outlined"
            size="small"
            startIcon={<IconSettings size={18} />}
            onClick={handleSettingsClick}
            sx={{
              height: '35px',
              px: 1,
              width: '100%',
              borderColor: theme.palette.divider,
              color: theme.palette.text.primary,
              bgcolor: theme.palette.background.paper,
              textTransform: 'none',
              fontSize: '12px',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              '&:hover': {
                borderColor: theme.palette.text.primary,
                bgcolor: 'transparent',
                color: theme.palette.text.primary
              }
            }}
          >
            {t('calculator.general.chooseCalculator')}
          </Button>
          
          {/* Sync and Expand Controls - Mobile */}
          <Stack 
            direction="row" 
            spacing={0}
            alignItems="center"
            justifyContent="space-between"
            width="100%"
          >
            <Box 
              sx={{ 
                display: 'flex',
                alignItems: 'center',
                gap: 0.5
              }}
            >
              <Typography 
                variant="body2" 
                color="textSecondary"
                sx={{ fontSize: '11px' }}
              >
                {t('calculator.general.syncAllValues')}
              </Typography>
              <Switch
                size="small"
                checked={syncValues}
                onChange={(e) => onSyncValuesChange(e.target.checked)}
              />
            </Box>

            <Button
              variant="outlined"
              size="small"
              startIcon={isExpanded ? <IconLayoutCollage size={18} /> : <IconLayoutGrid size={18} />}
              onClick={onToggleAll}
              sx={{
                height: '35px',
                px: 1,
                borderColor: theme.palette.divider,
                color: theme.palette.text.primary,
                bgcolor: theme.palette.background.paper,
                textTransform: 'none',
                fontSize: '12px',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                '&:hover': {
                  borderColor: theme.palette.text.primary,
                  bgcolor: 'transparent',
                  color: theme.palette.text.primary
                }
              }}
            >
              {isAnySectionExpanded ? t('calculator.general.collapseAll') : t('calculator.general.expandAll')}
            </Button>
          </Stack>
          
          {/* Save Calculation Button - Mobile */}
          <Button
            variant="contained"
            size="small"
            startIcon={<IconDeviceFloppy size={18} />}
            onClick={onOpenSaveModal}
            sx={{
              bgcolor: '#00c292',
              color: 'white',
              '&:hover': {
                bgcolor: '#00a67d',
              },
              px: 1,
              height: '35px',
              borderRadius: '8px',
              textTransform: 'none',
              fontSize: '12px',
              fontWeight: 500,
              boxShadow: 'none',
              width: '100%'
            }}
          >
            {t('calculator.general.saveCalculation')}
          </Button>
        </Stack>
      </Box>

      {/* Settings Menu */}
      <Menu
        anchorEl={settingsAnchorEl}
        open={Boolean(settingsAnchorEl)}
        onClose={handleSettingsClose}
        PaperProps={{
          sx: {
            mt: 1.5,
            boxShadow: theme.shadows[8],
            minWidth: 200
          }
        }}
      >
        <Typography
          variant="caption"
          sx={{
            px: 2,
            py: 1,
            display: 'block',
            color: 'text.secondary'
          }}
        >
          {t('calculator.general.showHideCards')}
        </Typography>
        {(Object.keys(visibleCards) as CardKey[]).map((cardKey) => (
          <MenuItem
            key={cardKey}
            onClick={(e: React.MouseEvent<HTMLLIElement>) => {
              const target = e.target as HTMLElement;
              if (target.closest('.MuiSwitch-root')) {
                return;
              }
              onCardVisibilityToggle(cardKey);
            }}
            sx={{
              py: 1,
              px: 2
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1} width="100%">
              <Switch
                size="small"
                checked={visibleCards[cardKey]}
                onChange={(e) => {
                  e.stopPropagation();
                  onCardVisibilityToggle(cardKey);
                }}
                className="MuiSwitch-root"
              />
              <Typography variant="body2">
                {t(`calculator.cards.${cardKey}`)}
              </Typography>
            </Stack>
          </MenuItem>
        ))}
      </Menu>
    </Stack>
  );
};

export default CalculatorControls; 