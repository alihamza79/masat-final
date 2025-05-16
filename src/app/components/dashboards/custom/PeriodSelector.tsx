import React, { useState, useMemo, useCallback, memo } from 'react';
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
import { enGB } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

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

// Memoized date picker component
const MemoizedDatePicker = memo(({ 
  label, 
  value, 
  onChange, 
  renderInput, 
  minDate,
  inputFormat 
}: any) => {
  return (
    <DatePicker
      label={label}
      value={value}
      onChange={onChange}
      inputFormat={inputFormat || "dd/MM/yyyy"}
      minDate={minDate}
      renderInput={renderInput}
    />
  );
});

// Custom Date Dialog Component
const CustomDateDialog = memo(({
  open,
  onClose,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onSubmit,
  datePickerSx,
  inputProps,
  translations
}: {
  open: boolean;
  onClose: () => void;
  startDate: Date | null;
  endDate: Date | null;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
  onSubmit: () => void;
  datePickerSx: any;
  inputProps: any;
  translations: {
    selectDateRange: string;
    startDate: string;
    endDate: string;
    cancel: string;
    apply: string;
  };
}) => {
  // Memoize the render input functions
  const renderStartDateInput = useCallback((params: any) => (
    <TextField
      {...params}
      fullWidth
      variant="outlined"
      placeholder="DD/MM/YYYY"
      sx={datePickerSx}
      InputProps={{
        ...params.InputProps,
        ...inputProps
      }}
    />
  ), [datePickerSx, inputProps]);

  const renderEndDateInput = useCallback((params: any) => (
    <TextField
      {...params}
      fullWidth
      variant="outlined"
      placeholder="DD/MM/YYYY"
      sx={datePickerSx}
      InputProps={{
        ...params.InputProps,
        ...inputProps
      }}
    />
  ), [datePickerSx, inputProps]);

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      sx={{ 
        '& .MuiDialog-paper': {
          width: 'auto',
          minWidth: '300px'
        }
      }}
    >
      <DialogTitle>{translations.selectDateRange}</DialogTitle>
      <DialogContent>
        <LocalizationProvider dateAdapter={AdapterDateFns} locale={enGB}>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <MemoizedDatePicker
              label={translations.startDate}
              value={startDate}
              onChange={onStartDateChange}
              inputFormat="dd/MM/yyyy"
              renderInput={renderStartDateInput}
            />
            <MemoizedDatePicker
              label={translations.endDate}
              value={endDate}
              onChange={onEndDateChange}
              minDate={startDate || undefined}
              inputFormat="dd/MM/yyyy"
              renderInput={renderEndDateInput}
            />
          </Stack>
        </LocalizationProvider>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{translations.cancel}</Button>
        <Button 
          onClick={onSubmit} 
          variant="contained" 
          disabled={!startDate || !endDate}
        >
          {translations.apply}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  selectedPeriod,
  customStartDate,
  customEndDate,
  onPeriodChange
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [openDateDialog, setOpenDateDialog] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<Date | null>(customStartDate ? new Date(customStartDate) : null);
  const [tempEndDate, setTempEndDate] = useState<Date | null>(customEndDate ? new Date(customEndDate) : null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  
  const periodLabels: Record<PeriodType, string> = {
    today: t('dashboard.period.today'),
    yesterday: t('dashboard.period.yesterday'),
    last7days: t('dashboard.period.last7days'),
    last30days: t('dashboard.period.last30days'),
    thisMonth: t('dashboard.period.thisMonth'),
    lastMonth: t('dashboard.period.lastMonth'),
    thisQuarter: t('dashboard.period.thisQuarter'),
    lastQuarter: t('dashboard.period.lastQuarter'),
    thisYear: t('dashboard.period.thisYear'),
    lastYear: t('dashboard.period.lastYear'),
    allTime: t('dashboard.period.allTime'),
    custom: t('dashboard.period.custom')
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
  
  const handleDateDialogClose = useCallback(() => {
    setOpenDateDialog(false);
  }, []);
  
  const handleDateDialogSubmit = useCallback(() => {
    if (tempStartDate && tempEndDate) {
      // Fix timezone issue by using explicit date components instead of ISO string
      const formatToLocalDateString = (date: Date) => {
        const year = date.getFullYear();
        // Month is 0-indexed, so add 1 and pad with leading zero if needed
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      const startString = formatToLocalDateString(tempStartDate);
      const endString = formatToLocalDateString(tempEndDate);
      
      onPeriodChange('custom', startString, endString);
    }
    setOpenDateDialog(false);
  }, [tempStartDate, tempEndDate, onPeriodChange]);
  
  // Format date for display
  const getSelectedPeriodText = useCallback(() => {
    if (selectedPeriod === 'custom' && customStartDate && customEndDate) {
      // Format dates as day/month/year
      const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      };
      
      const start = formatDate(customStartDate);
      const end = formatDate(customEndDate);
      return `${start} - ${end}`;
    }
    
    return periodLabels[selectedPeriod] || t('dashboard.period.select');
  }, [selectedPeriod, customStartDate, customEndDate, periodLabels, t]);

  // Memoize the date picker style to prevent recalculation on each render
  const datePickerSx = useMemo(() => ({
    '& .MuiInputBase-input': { 
      height: '1.4em',
      padding: '8px 14px',
      display: 'flex',
      alignItems: 'center'
    },
    '& .MuiOutlinedInput-root': {
      display: 'flex',
      alignItems: 'center',
      height: '45px'
    },
    '& .MuiInputLabel-root': {
      lineHeight: '1.4375em',
      transform: 'translate(14px, 12px) scale(1)'
    },
    '& .MuiInputLabel-shrink': {
      transform: 'translate(14px, -9px) scale(0.75)'
    },
    '& .MuiInputAdornment-root': {
      height: '100%',
      maxHeight: '45px',
      margin: 0,
      '& .MuiButtonBase-root': {
        height: '100%',
        padding: '0 5px',
        borderRadius: '50%',
        aspectRatio: '1/1',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 'unset',
        width: '36px'
      }
    }
  }), []);

  // Memoize input props to prevent recreating on each render
  const inputProps = useMemo(() => ({
    style: { height: '45px' }
  }), []);

  // Stabilize the date change handlers with useCallback
  const handleStartDateChange = useCallback((newValue: Date | null) => {
    setTempStartDate(newValue);
  }, []);

  const handleEndDateChange = useCallback((newValue: Date | null) => {
    setTempEndDate(newValue);
  }, []);
  
  // Translations for the date dialog
  const dialogTranslations = useMemo(() => ({
    selectDateRange: t('dashboard.period.selectDateRange'),
    startDate: t('dashboard.period.startDate'),
    endDate: t('dashboard.period.endDate'),
    cancel: t('dashboard.period.cancel'),
    apply: t('dashboard.period.apply')
  }), [t]);

  // Memoized dialog component
  const dateDialog = useMemo(() => (
    <CustomDateDialog
      open={openDateDialog}
      onClose={handleDateDialogClose}
      startDate={tempStartDate}
      endDate={tempEndDate}
      onStartDateChange={handleStartDateChange}
      onEndDateChange={handleEndDateChange}
      onSubmit={handleDateDialogSubmit}
      datePickerSx={datePickerSx}
      inputProps={inputProps}
      translations={dialogTranslations}
    />
  ), [
    openDateDialog, 
    handleDateDialogClose, 
    tempStartDate, 
    tempEndDate, 
    handleStartDateChange, 
    handleEndDateChange, 
    handleDateDialogSubmit,
    datePickerSx,
    inputProps,
    dialogTranslations
  ]);

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
        size="medium"
        sx={{
          py: 1,
          px: 2,
          borderRadius: 1,
          textTransform: 'none',
          fontWeight: 500,
          color: theme.palette.text.primary,
          borderColor: theme.palette.divider,
          height: '36.5px',
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
          <ListItemText>{t('dashboard.period.today')}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handlePeriodSelect('yesterday')}>
          <ListItemIcon>
            <IconClock size={18} />
          </ListItemIcon>
          <ListItemText>{t('dashboard.period.yesterday')}</ListItemText>
        </MenuItem>
        
        <Divider sx={{ my: 1 }} />
        
        <MenuItem onClick={() => handlePeriodSelect('last7days')}>
          <ListItemIcon>
            <IconCalendar size={18} />
          </ListItemIcon>
          <ListItemText>{t('dashboard.period.last7days')}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handlePeriodSelect('last30days')}>
          <ListItemIcon>
            <IconCalendar size={18} />
          </ListItemIcon>
          <ListItemText>{t('dashboard.period.last30days')}</ListItemText>
        </MenuItem>
        
        <Divider sx={{ my: 1 }} />
        
        <MenuItem onClick={() => handlePeriodSelect('thisMonth')}>
          <ListItemIcon>
            <IconCalendar size={18} />
          </ListItemIcon>
          <ListItemText>{t('dashboard.period.thisMonth')}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handlePeriodSelect('lastMonth')}>
          <ListItemIcon>
            <IconCalendar size={18} />
          </ListItemIcon>
          <ListItemText>{t('dashboard.period.lastMonth')}</ListItemText>
        </MenuItem>
        
        <Divider sx={{ my: 1 }} />
        
        <MenuItem onClick={() => handlePeriodSelect('thisQuarter')}>
          <ListItemIcon>
            <IconCalendar size={18} />
          </ListItemIcon>
          <ListItemText>{t('dashboard.period.thisQuarter')}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handlePeriodSelect('lastQuarter')}>
          <ListItemIcon>
            <IconCalendar size={18} />
          </ListItemIcon>
          <ListItemText>{t('dashboard.period.lastQuarter')}</ListItemText>
        </MenuItem>
        
        <Divider sx={{ my: 1 }} />
        
        <MenuItem onClick={() => handlePeriodSelect('thisYear')}>
          <ListItemIcon>
            <IconCalendar size={18} />
          </ListItemIcon>
          <ListItemText>{t('dashboard.period.thisYear')}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handlePeriodSelect('lastYear')}>
          <ListItemIcon>
            <IconCalendar size={18} />
          </ListItemIcon>
          <ListItemText>{t('dashboard.period.lastYear')}</ListItemText>
        </MenuItem>
        
        <Divider sx={{ my: 1 }} />
        
        <MenuItem onClick={() => handlePeriodSelect('allTime')}>
          <ListItemIcon>
            <IconCalendarTime size={18} />
          </ListItemIcon>
          <ListItemText>{t('dashboard.period.allTime')}</ListItemText>
        </MenuItem>
        
        <Divider sx={{ my: 1 }} />
        
        <MenuItem onClick={() => handlePeriodSelect('custom')}>
          <ListItemIcon>
            <IconCalendarTime size={18} />
          </ListItemIcon>
          <ListItemText>{t('dashboard.period.customPeriod')}</ListItemText>
        </MenuItem>
      </Menu>
      
      {dateDialog}
    </>
  );
};

export default PeriodSelector; 