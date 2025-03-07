'use client';
import React, { useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  IconButton,
  Card,
  Menu,
  MenuItem,
  Button,
  useTheme,
  Chip,
} from '@mui/material';
import {
  IconChevronLeft,
  IconChevronRight,
  IconCalendar,
  IconSettings,
} from '@tabler/icons-react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import dynamic from 'next/dynamic';
import { format, addDays, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { ApexOptions } from 'apexcharts';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const PageHeader = () => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [frequency, setFrequency] = useState('Daily');
  const [currency, setCurrency] = useState('RON');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [openMobilePicker, setOpenMobilePicker] = useState(false);
  const [openDesktopPicker, setOpenDesktopPicker] = useState(false);

  // Menu handlers
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  // Date handlers
  const handlePrevDay = () => {
    setSelectedDate(prev => subDays(prev, 1));
  };

  const handleNextDay = () => {
    setSelectedDate(prev => addDays(prev, 1));
  };

  // Shared date picker component with isDesktop parameter
  const DatePickerComponent = ({ isDesktop = false }) => (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Stack 
        direction="row" 
        alignItems="center" 
        spacing={1}
        sx={{ cursor: 'pointer' }}
      >
        <IconCalendar size={18} />
        <DatePicker
          open={isDesktop ? openDesktopPicker : openMobilePicker}
          onOpen={() => isDesktop ? setOpenDesktopPicker(true) : setOpenMobilePicker(true)}
          onClose={() => isDesktop ? setOpenDesktopPicker(false) : setOpenMobilePicker(false)}
          value={selectedDate}
          onChange={(newValue) => {
            if (newValue) {
              setSelectedDate(newValue);
            }
            isDesktop ? setOpenDesktopPicker(false) : setOpenMobilePicker(false);
          }}
          renderInput={(params) => (
            <Box ref={params.inputRef} onClick={() => isDesktop ? setOpenDesktopPicker(true) : setOpenMobilePicker(true)}>
              <Typography 
                variant="h6"
                sx={{ 
                  cursor: 'pointer',
                  fontSize: { xs: '14px', sm: '16px' }
                }}
              >
                {format(selectedDate, 'dd, MMM yy')}
              </Typography>
            </Box>
          )}
          PopperProps={{
            sx: {
              '& .MuiPaper-root': {
                boxShadow: theme.shadows[3],
                borderRadius: '8px',
              },
            },
          }}
        />
      </Stack>
    </LocalizationProvider>
  );

  // chart color
  const primary = theme.palette.primary.main;
  const primarylight = theme.palette.primary.light;

  // Get all days of current month
  const monthDays = eachDayOfInterval({
    start: startOfMonth(selectedDate),
    end: endOfMonth(selectedDate)
  });

  // Chart options for the revenue area chart
  const chartOptions: ApexOptions = {
    chart: {
      type: 'area',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      foreColor: '#adb0bb',
      toolbar: {
        show: false,
      },
      height: 60,
      sparkline: {
        enabled: true,
      },
      group: 'sparklines',
    },
    colors: [primary],
    stroke: {
      curve: 'smooth',
      width: 2,
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 0.5,
        opacityFrom: 0.7,
        opacityTo: 0,
        stops: [0, 100],
      },
    },
    markers: {
      size: 0,
      hover: {
        size: 5,
      }
    },
    tooltip: {
      theme: theme.palette.mode === 'dark' ? 'dark' : 'light',
      x: {
        show: true,
        formatter: (val: number) => format(new Date(val), 'MMM dd'),
      },
      y: {
        formatter: (val: number) => `lei ${val.toFixed(2)}`,
      },
    },
    xaxis: {
      type: 'datetime',
      categories: monthDays.map(day => day.getTime()),
    },
  };

  // Generate random-ish data for the month
  const generateMonthData = () => {
    return monthDays.map(() => {
      return Math.floor(1500 + Math.random() * 1000);
    });
  };

  const chartSeries = [
    {
      name: 'Revenue',
      data: generateMonthData(),
    },
  ];

  return (
    <Card
      sx={{
        p: { xs: 2, md: 1.5 },
        mb: 3,
        background: theme.palette.background.paper,
        boxShadow: theme.shadows[1],
      }}
    >
      {/* Mobile Layout Container */}
      <Stack 
        spacing={2}
        sx={{ display: { xs: 'flex', md: 'none' } }}
      >
        {/* Date Navigation */}
        <Stack 
          direction="row" 
          alignItems="center" 
          spacing={2}
          justifyContent="center"
        >
          <IconButton 
            size="small" 
            sx={{ 
              bgcolor: 'primary.light',
              width: '28px',
              height: '28px',
            }}
            onClick={handlePrevDay}
          >
            <IconChevronLeft size={18} />
          </IconButton>
          <DatePickerComponent isDesktop={false} />
          <IconButton 
            size="small" 
            sx={{ 
              bgcolor: 'primary.light',
              width: '28px',
              height: '28px',
            }}
            onClick={handleNextDay}
          >
            <IconChevronRight size={18} />
          </IconButton>
        </Stack>

        {/* Choose Metrics Button */}
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="outlined"
            size="small"
            onClick={handleClick}
            endIcon={<IconSettings size={18} />}
            sx={{
              minWidth: '200px'
            }}
          >
            Choose Metrics
          </Button>
        </Box>
      </Stack>

      {/* Desktop Layout */}
      <Stack 
        spacing={1}
        sx={{ display: { xs: 'none', md: 'flex' } }}
      >
        <Stack 
          direction="row" 
          alignItems="center" 
          justifyContent="space-between"
          spacing={2}
        >
          {/* Left Section */}
          <Box sx={{ flex: 1.1, display: 'flex', justifyContent: 'flex-start' }}>
            <Stack 
              direction="row" 
              alignItems="center" 
              spacing={2}
            >
              <IconButton 
                size="small" 
                sx={{ 
                  bgcolor: 'primary.light',
                  width: '28px',
                  height: '28px',
                }}
                onClick={handlePrevDay}
              >
                <IconChevronLeft size={18} />
              </IconButton>
              <DatePickerComponent isDesktop={true} />
              <IconButton 
                size="small" 
                sx={{ 
                  bgcolor: 'primary.light',
                  width: '28px',
                  height: '28px',
                }}
                onClick={handleNextDay}
              >
                <IconChevronRight size={18} />
              </IconButton>
            </Stack>
          </Box>

          {/* Center Section */}
          <Box sx={{ 
            flex: 0.6, 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center'
          }}>
            <Typography
              variant="h6"
              color="textSecondary"
              sx={{
                fontSize: '14px',
                fontWeight: 600,
                letterSpacing: '0.5px',
                whiteSpace: 'nowrap'
              }}
            >
              REVENUE
            </Typography>
          </Box>

          {/* Right Section */}
          <Box sx={{ flex: 1.2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              size="small"
              onClick={handleClick}
              endIcon={<IconSettings size={18} />}
            >
              Choose Metrics
            </Button>
          </Box>
        </Stack>

        {/* Metrics Section */}
        <Stack
          spacing={0}
        >
          {/* Revenue Label (Mobile Only) */}
          <Typography
            variant="h6"
            color="textSecondary"
            sx={{
              fontSize: '16px',
              fontWeight: 600,
              letterSpacing: '0.5px',
              textAlign: 'center',
              display: { xs: 'block', md: 'none' }
            }}
          >
            REVENUE
          </Typography>

          {/* Rest of the metrics content */}
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={{ xs: 3, md: 4 }}
            alignItems={{ xs: 'stretch', md: 'center' }}
            justifyContent="space-between"
            sx={{ mt: { md: 1 } }}
          >
            <Box sx={{ width: { xs: '100%', md: 'auto' } }}>
              <Typography 
                color="textSecondary" 
                variant="subtitle2" 
                mb={0.5}
                sx={{ textAlign: { xs: 'center', md: 'left' } }}
              >
                Gross Revenue
              </Typography>
              <Stack 
                direction="row" 
                alignItems="center" 
                spacing={2}
                justifyContent={{ xs: 'center', md: 'flex-start' }}
              >
                <Typography variant="h4" sx={{ fontSize: '20px' }}>
                  lei 1925.48
                </Typography>
                <Chip
                  label="-lei 1966.29"
                  size="small"
                  color="error"
                  sx={{ borderRadius: '4px', height: '20px' }}
                />
              </Stack>
            </Box>

            <Box sx={{ 
              width: { xs: '100%', md: '300px' },
              maxWidth: '100%'
            }}>
              <Box height="50px">
                <Chart
                  options={chartOptions}
                  series={chartSeries}
                  type="area"
                  height="50px"
                  width="100%"
                />
              </Box>
              <Stack direction="row" justifyContent="space-between" px={1}>
                <Typography variant="caption" color="textSecondary" sx={{ fontSize: '10px' }}>
                  {format(startOfMonth(selectedDate), 'MMM d')}
                </Typography>
                <Typography variant="caption" color="textSecondary" sx={{ fontSize: '10px' }}>
                  {format(endOfMonth(selectedDate), 'MMM d')}
                </Typography>
              </Stack>
            </Box>

            <Stack 
              direction={{ xs: 'row', sm: 'row' }} 
              spacing={{ xs: 2, sm: 4 }}
              sx={{ 
                width: { xs: '100%', md: 'auto' },
                justifyContent: { xs: 'space-around', md: 'flex-end' },
                flexWrap: { xs: 'wrap', sm: 'nowrap' }
              }}
            >
              <Box sx={{ minWidth: { xs: '30%', sm: 'auto' } }}>
                <Typography 
                  color="textSecondary" 
                  variant="subtitle2" 
                  mb={0.5}
                  sx={{ textAlign: { xs: 'center', md: 'left' } }}
                >
                  Orders
                </Typography>
                <Stack 
                  direction="row" 
                  alignItems="center" 
                  spacing={1}
                  justifyContent={{ xs: 'center', md: 'flex-start' }}
                >
                  <Typography variant="h5" sx={{ fontSize: '20px' }}>
                    16
                  </Typography>
                  <Chip
                    label="-10"
                    size="small"
                    color="error"
                    sx={{ borderRadius: '4px', height: '20px' }}
                  />
                </Stack>
              </Box>

              <Box sx={{ minWidth: { xs: '30%', sm: 'auto' } }}>
                <Typography 
                  color="textSecondary" 
                  variant="subtitle2" 
                  mb={0.5}
                  sx={{ textAlign: { xs: 'center', md: 'left' } }}
                >
                  Units Sold
                </Typography>
                <Stack 
                  direction="row" 
                  alignItems="center" 
                  spacing={1}
                  justifyContent={{ xs: 'center', md: 'flex-start' }}
                >
                  <Typography variant="h5" sx={{ fontSize: '20px' }}>
                    16
                  </Typography>
                  <Chip
                    label="-10"
                    size="small"
                    color="error"
                    sx={{ borderRadius: '4px', height: '20px' }}
                  />
                </Stack>
              </Box>

              <Box sx={{ minWidth: { xs: '30%', sm: 'auto' } }}>
                <Typography 
                  color="textSecondary" 
                  variant="subtitle2" 
                  mb={0.5}
                  sx={{ textAlign: { xs: 'center', md: 'left' } }}
                >
                  Refunds
                </Typography>
                <Stack 
                  direction="row" 
                  alignItems="center" 
                  spacing={1}
                  justifyContent={{ xs: 'center', md: 'flex-start' }}
                >
                  <Typography variant="h5" sx={{ fontSize: '20px' }}>
                    2
                  </Typography>
                  <Chip
                    label="0"
                    size="small"
                    color="success"
                    sx={{ borderRadius: '4px', height: '20px' }}
                  />
                </Stack>
              </Box>
            </Stack>
          </Stack>
        </Stack>
      </Stack>

      {/* Mobile Metrics Section */}
      <Stack
        spacing={{ xs: 2, md: 0 }}
        mt={{ xs: 2, md: 0 }}
        sx={{ display: { xs: 'block', md: 'none' } }}
      >
        <Typography
          variant="h6"
          color="textSecondary"
          sx={{
            fontSize: '16px',
            fontWeight: 600,
            letterSpacing: '0.5px',
            textAlign: 'center',
            display: { xs: 'block', md: 'none' }
          }}
        >
          REVENUE
        </Typography>

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={{ xs: 3, md: 4 }}
          alignItems={{ xs: 'stretch', md: 'center' }}
          justifyContent="space-between"
        >
          <Box sx={{ width: { xs: '100%', md: 'auto' } }}>
            <Typography 
              color="textSecondary" 
              variant="subtitle2" 
              mb={0.5}
              sx={{ textAlign: { xs: 'center', md: 'left' } }}
            >
              Gross Revenue
            </Typography>
            <Stack 
              direction="row" 
              alignItems="center" 
              spacing={2}
              justifyContent={{ xs: 'center', md: 'flex-start' }}
            >
              <Typography variant="h4" sx={{ fontSize: '20px' }}>
                lei 1925.48
              </Typography>
              <Chip
                label="-lei 1966.29"
                size="small"
                color="error"
                sx={{ borderRadius: '4px', height: '20px' }}
              />
            </Stack>
          </Box>

          <Box sx={{ 
            width: { xs: '100%', md: '300px' },
            maxWidth: '100%'
          }}>
            <Box height="50px">
              <Chart
                options={chartOptions}
                series={chartSeries}
                type="area"
                height="50px"
                width="100%"
              />
            </Box>
            <Stack direction="row" justifyContent="space-between" px={1}>
              <Typography variant="caption" color="textSecondary" sx={{ fontSize: '10px' }}>
                {format(startOfMonth(selectedDate), 'MMM d')}
              </Typography>
              <Typography variant="caption" color="textSecondary" sx={{ fontSize: '10px' }}>
                {format(endOfMonth(selectedDate), 'MMM d')}
              </Typography>
            </Stack>
          </Box>

          <Stack 
            direction={{ xs: 'row', sm: 'row' }} 
            spacing={{ xs: 2, sm: 4 }}
            sx={{ 
              width: { xs: '100%', md: 'auto' },
              justifyContent: { xs: 'space-around', md: 'flex-end' },
              flexWrap: { xs: 'wrap', sm: 'nowrap' }
            }}
          >
            <Box sx={{ minWidth: { xs: '30%', sm: 'auto' } }}>
              <Typography 
                color="textSecondary" 
                variant="subtitle2" 
                mb={0.5}
                sx={{ textAlign: { xs: 'center', md: 'left' } }}
              >
                Orders
              </Typography>
              <Stack 
                direction="row" 
                alignItems="center" 
                spacing={1}
                justifyContent={{ xs: 'center', md: 'flex-start' }}
              >
                <Typography variant="h5" sx={{ fontSize: '20px' }}>
                  16
                </Typography>
                <Chip
                  label="-10"
                  size="small"
                  color="error"
                  sx={{ borderRadius: '4px', height: '20px' }}
                />
              </Stack>
            </Box>

            <Box sx={{ minWidth: { xs: '30%', sm: 'auto' } }}>
              <Typography 
                color="textSecondary" 
                variant="subtitle2" 
                mb={0.5}
                sx={{ textAlign: { xs: 'center', md: 'left' } }}
              >
                Units Sold
              </Typography>
              <Stack 
                direction="row" 
                alignItems="center" 
                spacing={1}
                justifyContent={{ xs: 'center', md: 'flex-start' }}
              >
                <Typography variant="h5" sx={{ fontSize: '20px' }}>
                  16
                </Typography>
                <Chip
                  label="-10"
                  size="small"
                  color="error"
                  sx={{ borderRadius: '4px', height: '20px' }}
                />
              </Stack>
            </Box>

            <Box sx={{ minWidth: { xs: '30%', sm: 'auto' } }}>
              <Typography 
                color="textSecondary" 
                variant="subtitle2" 
                mb={0.5}
                sx={{ textAlign: { xs: 'center', md: 'left' } }}
              >
                Refunds
              </Typography>
              <Stack 
                direction="row" 
                alignItems="center" 
                spacing={1}
                justifyContent={{ xs: 'center', md: 'flex-start' }}
              >
                <Typography variant="h5" sx={{ fontSize: '20px' }}>
                  2
                </Typography>
                <Chip
                  label="0"
                  size="small"
                  color="success"
                  sx={{ borderRadius: '4px', height: '20px' }}
                />
              </Stack>
            </Box>
          </Stack>
        </Stack>
      </Stack>
    </Card>
  );
};

export default PageHeader; 