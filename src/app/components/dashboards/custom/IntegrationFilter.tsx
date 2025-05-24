import React, { useState, MouseEvent } from 'react';
import { 
  Button, 
  Popover, 
  FormGroup, 
  FormControlLabel, 
  Checkbox, 
  Typography, 
  Box, 
  Divider, 
  Chip, 
  Tooltip,
  Badge
} from '@mui/material';
import { Integration } from '@/lib/services/integrationService';
import { IconFilter } from '@tabler/icons-react';
import { useTheme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

interface IntegrationFilterProps {
  integrations: Integration[];
  selectedIntegrationIds: string[];
  onChange: (selectedIds: string[]) => void;
}

const IntegrationFilter: React.FC<IntegrationFilterProps> = ({
  integrations,
  selectedIntegrationIds,
  onChange
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const theme = useTheme();
  const { t } = useTranslation();
  
  const handleClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };
  
  const open = Boolean(anchorEl);
  
  const handleToggleAll = () => {
    if (selectedIntegrationIds.length === integrations.length) {
      // If all are selected, do nothing
      // This prevents deselecting all integrations
      return;
    } else {
      // Otherwise, select all
      onChange(integrations.map(integration => integration._id as string));
    }
  };

  const handleToggleIntegration = (integrationId: string) => {
    if (selectedIntegrationIds.includes(integrationId)) {
      // Prevent deselecting if this is the only selected integration
      if (selectedIntegrationIds.length === 1) {
        return;
      }
      // Remove from selection
      onChange(selectedIntegrationIds.filter(id => id !== integrationId));
    } else {
      // Add to selection
      onChange([...selectedIntegrationIds, integrationId]);
    }
  };

  const allSelected = integrations.length > 0 && selectedIntegrationIds.length === integrations.length;
  const someSelected = selectedIntegrationIds.length > 0 && selectedIntegrationIds.length < integrations.length;
  
  // Get the count of selected integrations for the badge
  const selectedCount = selectedIntegrationIds.length;
  
  // Get text for button showing what's selected
  const getFilterText = () => {
    if (allSelected) return t('dashboard.integrations.allIntegrations');
    if (selectedIntegrationIds.length === 1) {
      const selectedName = integrations.find(
        i => i._id === selectedIntegrationIds[0]
      )?.accountName || t('dashboard.integrations.oneIntegration');
      return selectedName;
    }
    return t('dashboard.integrations.multipleIntegrations', { count: selectedIntegrationIds.length });
  };

  return (
    <>
      <Badge 
        badgeContent={selectedCount} 
        color="primary"
        sx={{ 
          '& .MuiBadge-badge': { 
            right: -4, 
            top: 4,
            display: allSelected ? 'none' : 'flex' 
          } 
        }}
      >
        <Button
          variant="outlined"
          startIcon={<IconFilter size={18} color={isHovered ? theme.palette.primary.main : undefined} />}
          onClick={handleClick}
          size="medium"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          sx={{ 
            bgcolor: 'background.paper', 
            borderColor: 'divider',
            minWidth: { xs: 'auto', sm: '160px' },
            maxWidth: { xs: '140px', sm: 'none' },
            justifyContent: 'flex-start',
            px: { xs: 1.5, sm: 2 },
            py: 1,
            height: '36.5px',
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            transition: 'all 0.2s ease-in-out',
            '& .MuiButton-startIcon': {
              marginRight: { xs: 0.5, sm: 1 },
              '& svg': {
                fontSize: { xs: 16, sm: 18 }
              }
            },
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              color: 'primary.main'
            }
          }}
        >
          <Box
            component="span"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: { xs: '80px', sm: 'none' }
            }}
          >
            {getFilterText()}
          </Box>
        </Button>
      </Badge>
      
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          elevation: 3,
          sx: { 
            mt: 0.5, 
            p: 2,
            width: { xs: 280, sm: 260 },
            maxWidth: '90vw',
            borderRadius: 1,
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: -5,
              left: 24,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'rotate(45deg)',
              zIndex: 0,
              borderTop: '1px solid',
              borderLeft: '1px solid',
              borderColor: 'divider'
            }
          }
        }}
      >
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>
          {t('dashboard.integrations.filterByIntegration')}
        </Typography>
      
        {integrations.length === 0 ? (
          <Typography variant="body2" color="textSecondary">
            {t('dashboard.integrations.noIntegrationsFound')}
          </Typography>
        ) : (
          <>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={allSelected}
                    indeterminate={someSelected}
                    onChange={handleToggleAll}
                    color="primary"
                    size="small"
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" fontWeight={600}>{t('dashboard.integrations.allIntegrations')}</Typography>
                    <Chip 
                      size="small" 
                      label={integrations.length} 
                      sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                    />
                  </Box>
                }
              />
              
              <Divider sx={{ my: 1 }} />
              
              {integrations.map(integration => (
                <FormControlLabel
                  key={integration._id}
                  control={
                    <Tooltip 
                      title={selectedIntegrationIds.length === 1 && selectedIntegrationIds.includes(integration._id as string) 
                        ? t('dashboard.integrations.atLeastOneRequired')
                        : ""}
                    >
                      <span>
                        <Checkbox 
                          checked={selectedIntegrationIds.includes(integration._id as string)}
                          onChange={() => handleToggleIntegration(integration._id as string)}
                          color="primary"
                          size="small"
                          // Disable checkbox if this is the only selected integration
                          disabled={selectedIntegrationIds.length === 1 && selectedIntegrationIds.includes(integration._id as string)}
                        />
                      </span>
                    </Tooltip>
                  }
                  label={
                    <Typography variant="body2">
                      {integration.accountName}
                    </Typography>
                  }
                />
              ))}
            </FormGroup>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button 
                size="small" 
                onClick={handleClose}
                variant="outlined"
              >
                {t('dashboard.integrations.done')}
              </Button>
            </Box>
          </>
        )}
      </Popover>
    </>
  );
};

export default IntegrationFilter; 