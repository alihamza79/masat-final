import React from 'react';
import {
  Stack,
  Typography,
  IconButton,
} from '@mui/material';
import {
  IconChevronDown,
  IconChevronUp,
} from '@tabler/icons-react';

interface SectionHeaderProps {
  category: string;
  section: string;
  title: string;
  value?: string;
  isExpanded: boolean;
  onToggle: () => void;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  value,
  isExpanded,
  onToggle,
}) => {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      onClick={onToggle}
      sx={{ 
        cursor: 'pointer', 
        mb: isExpanded ? 2 : 1,
        '&:hover': {
          bgcolor: 'rgba(0,0,0,0.06)',
        },
        py: 1,
        px: 1.5,
        borderRadius: 1,
        transition: 'all 0.2s ease-in-out',
        bgcolor: 'rgba(0,0,0,0.03)'
      }}
    >
      <Typography 
        variant="subtitle1" 
        sx={{
          color: 'text.primary',
          fontWeight: 900,
          fontSize: '13px'
        }}
      >
        {title}
      </Typography>
      <Stack direction="row" spacing={1} alignItems="center">
        {value && (
          <Typography 
            variant="subtitle1" 
            sx={{ 
              color: 'text.primary',
              fontWeight: 600,
              fontSize: '13px'
            }}
          >
            {value}
          </Typography>
        )}
        <IconButton 
          size="small" 
          sx={{ 
            color: 'text.secondary',
            p: 0.5,
            '&:hover': {
              bgcolor: 'transparent',
              color: 'primary.main'
            }
          }}
        >
          {isExpanded ? (
            <IconChevronUp size={18} />
          ) : (
            <IconChevronDown size={18} />
          )}
        </IconButton>
      </Stack>
    </Stack>
  );
};

export default SectionHeader; 