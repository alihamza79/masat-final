import React, { useState } from 'react';
import {
  Box,
  ToggleButtonGroup,
  ToggleButton,
  Stack,
  IconButton,
  TextField,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import { IconCalendar } from '@tabler/icons-react';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';

export type PeriodType = 'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'custom';

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
  
  const handlePeriodChange = (
    event: React.MouseEvent<HTMLElement>,
    newPeriod: PeriodType,
  ) => {
    if (newPeriod === 'custom') {
      setOpenDateDialog(true);
    } else if (newPeriod !== null) {
      onPeriodChange(newPeriod);
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
  
  return (
    <>
      <ToggleButtonGroup
        value={selectedPeriod}
        exclusive
        onChange={handlePeriodChange}
        aria-label="period selector"
        size="small"
        sx={{
          bgcolor: theme.palette.background.default,
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          '& .MuiToggleButton-root': {
            border: 'none',
            fontSize: '13px',
            py: 0.75,
            px: 2,
            textTransform: 'none',
            '&.Mui-selected': {
              backgroundColor: theme.palette.primary.main,
              color: '#fff',
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
              }
            }
          }
        }}
      >
        <ToggleButton value="today">
          Daily
        </ToggleButton>
        <ToggleButton value="last7days">
          Weekly
        </ToggleButton>
        <ToggleButton value="last30days">
          Monthly
        </ToggleButton>
      </ToggleButtonGroup>
      
      {/* Custom date range dialog */}
      <Dialog open={openDateDialog} onClose={handleDateDialogClose}>
        <DialogTitle>Select Date Range</DialogTitle>
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