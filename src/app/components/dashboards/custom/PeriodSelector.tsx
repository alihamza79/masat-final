import React, { useState } from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  Stack,
  TextField,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { 
  IconCalendar, 
  IconChevronDown,
  IconClock,
  IconCalendarTime
} from '@tabler/icons-react';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';

export type PeriodType = 
  | 'today' 
  | 'yesterday' 
  | 'last7days' 
  | 'last30days' 
  | 'thisMonth' 
  | 'lastMonth' 
  | 'thisQuarter'
  | 'lastQuarter'
  | 'thisYear'
  | 'lastYear'
  | 'allTime'
  | 'custom';

interface PeriodSelectorProps {
  selectedPeriod: PeriodType;
  customStartDate?: string;
  customEndDate?: string;
  onPeriodChange: (period: PeriodType, startDate?: string, endDate?: string) => void;
}

const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  selectedPeriod,
  customStartDate,
  customEndDate,
  onPeriodChange
}) => {
  const theme = useTheme();
  const [openDateDialog, setOpenDateDialog] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<Date | null>(customStartDate ? new Date(customStartDate) : null);
  const [tempEndDate, setTempEndDate] = useState<Date | null>(customEndDate ? new Date(customEndDate) : null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  
  const periodLabels: Record<PeriodType, string> = {
    today: 'Today',
    yesterday: 'Yesterday',
    last7days: 'Last 7 days',
    last30days: 'Last 30 days',
    thisMonth: 'Current month',
    lastMonth: 'Previous month',
    thisQuarter: 'Actual quarter',
    lastQuarter: 'Previous quarter',
    thisYear: 'Actual year',
    lastYear: 'Last year',
    allTime: 'All time',
    custom: 'Custom period'
  };
  
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handlePeriodSelect = (period: PeriodType) => {
    handleClose();
    
    if (period === 'custom') {
      setOpenDateDialog(true);
    } else {
      onPeriodChange(period);
    }
  };
  
  const handleDateDialogClose = () => {
    setOpenDateDialog(false);
  };
  
  const handleDateDialogSubmit = () => {
    if (tempStartDate && tempEndDate) {
      const startString = tempStartDate.toISOString().split('T')[0];
      const endString = tempEndDate.toISOString().split('T')[0];
      onPeriodChange('custom', startString, endString);
    }
    setOpenDateDialog(false);
  };
  
  // Format date for display
  const getSelectedPeriodText = () => {
    if (selectedPeriod === 'custom' && customStartDate && customEndDate) {
      const start = new Date(customStartDate).toLocaleDateString();
      const end = new Date(customEndDate).toLocaleDateString();
      return `${start} - ${end}`;
    }
    
    return periodLabels[selectedPeriod] || 'Select period';
  };
  
  return (
    <>
      <Button
        id="period-selector-button"
        aria-controls={open ? 'period-selector-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
        variant="outlined"
        endIcon={<IconChevronDown size={16} />}
        startIcon={<IconCalendarTime size={18} />}
        sx={{
          py: 1,
          px: 2,
          borderRadius: 2,
          textTransform: 'none',
          fontWeight: 500,
          color: theme.palette.text.primary,
          borderColor: theme.palette.divider,
          '&:hover': {
            borderColor: theme.palette.text.primary
          }
        }}
      >
        {getSelectedPeriodText()}
      </Button>
      
      <Menu
        id="period-selector-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'period-selector-button',
          dense: true
        }}
        PaperProps={{
          elevation: 3,
          sx: {
            minWidth: 220,
            maxWidth: 280,
            mt: 0.5
          }
        }}
      >
        <MenuItem onClick={() => handlePeriodSelect('today')}>
          <ListItemIcon>
            <IconClock size={18} />
          </ListItemIcon>
          <ListItemText>Today</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handlePeriodSelect('yesterday')}>
          <ListItemIcon>
            <IconClock size={18} />
          </ListItemIcon>
          <ListItemText>Yesterday</ListItemText>
        </MenuItem>
        
        <Divider sx={{ my: 1 }} />
        
        <MenuItem onClick={() => handlePeriodSelect('last7days')}>
          <ListItemIcon>
            <IconCalendar size={18} />
          </ListItemIcon>
          <ListItemText>Last 7 days</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handlePeriodSelect('last30days')}>
          <ListItemIcon>
            <IconCalendar size={18} />
          </ListItemIcon>
          <ListItemText>Last 30 days</ListItemText>
        </MenuItem>
        
        <Divider sx={{ my: 1 }} />
        
        <MenuItem onClick={() => handlePeriodSelect('thisMonth')}>
          <ListItemIcon>
            <IconCalendar size={18} />
          </ListItemIcon>
          <ListItemText>Current month</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handlePeriodSelect('lastMonth')}>
          <ListItemIcon>
            <IconCalendar size={18} />
          </ListItemIcon>
          <ListItemText>Previous month</ListItemText>
        </MenuItem>
        
        <Divider sx={{ my: 1 }} />
        
        <MenuItem onClick={() => handlePeriodSelect('thisQuarter')}>
          <ListItemIcon>
            <IconCalendar size={18} />
          </ListItemIcon>
          <ListItemText>Actual quarter</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handlePeriodSelect('lastQuarter')}>
          <ListItemIcon>
            <IconCalendar size={18} />
          </ListItemIcon>
          <ListItemText>Previous quarter</ListItemText>
        </MenuItem>
        
        <Divider sx={{ my: 1 }} />
        
        <MenuItem onClick={() => handlePeriodSelect('thisYear')}>
          <ListItemIcon>
            <IconCalendar size={18} />
          </ListItemIcon>
          <ListItemText>Actual year</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handlePeriodSelect('lastYear')}>
          <ListItemIcon>
            <IconCalendar size={18} />
          </ListItemIcon>
          <ListItemText>Last year</ListItemText>
        </MenuItem>
        
        <Divider sx={{ my: 1 }} />
        
        <MenuItem onClick={() => handlePeriodSelect('allTime')}>
          <ListItemIcon>
            <IconCalendarTime size={18} />
          </ListItemIcon>
          <ListItemText>All time</ListItemText>
        </MenuItem>
        
        <Divider sx={{ my: 1 }} />
        
        <MenuItem onClick={() => handlePeriodSelect('custom')}>
          <ListItemIcon>
            <IconCalendarTime size={18} />
          </ListItemIcon>
          <ListItemText>Custom period...</ListItemText>
        </MenuItem>
      </Menu>
      
      {/* Custom date range dialog */}
      <Dialog open={openDateDialog} onClose={handleDateDialogClose}>
        <DialogTitle>Select Custom Date Range</DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <DatePicker
                label="Start Date"
                value={tempStartDate}
                onChange={(newValue) => setTempStartDate(newValue)}
              />
              <DatePicker
                label="End Date"
                value={tempEndDate}
                onChange={(newValue) => setTempEndDate(newValue)}
                minDate={tempStartDate || undefined}
              />
            </Stack>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDateDialogClose}>Cancel</Button>
          <Button 
            onClick={handleDateDialogSubmit} 
            variant="contained" 
            disabled={!tempStartDate || !tempEndDate}
          >
            Apply
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PeriodSelector; 