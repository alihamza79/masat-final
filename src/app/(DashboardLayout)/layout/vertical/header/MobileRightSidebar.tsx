import React, { useState } from 'react';
import {
  IconApps,
  IconCalendarEvent,
  IconChevronDown,
  IconChevronUp,
  IconGridDots,
  IconMail,
  IconMessages,
} from '@tabler/icons-react';
import {
  Box,
  Typography,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
} from '@mui/material';

import Link from 'next/link';
import QuickLinks from './QuickLinks';

const MobileRightSidebar = () => {
  const [showDrawer, setShowDrawer] = useState(false);

  const [open, setOpen] = React.useState(true);

  const handleClick = () => {
    setOpen(!open);
  };

 

  return (
    <Box>
      <IconButton
        size="large"
        color="inherit"
        onClick={() => setShowDrawer(true)}
        sx={{
          ...(showDrawer && {
            color: 'primary.main',
          }),
        }}
      >
        <IconGridDots size="21" stroke="1.5" />
      </IconButton>
    
      <Drawer
        anchor="right"
        open={showDrawer}
        onClose={() => setShowDrawer(false)}
        PaperProps={{ sx: { width: '300px' } }}
      >
        <Box p={3} pb={0}>
          <Typography variant="h5" fontWeight={600}>
            Navigation
          </Typography>
        </Box>

     
      </Drawer>
    </Box>
  );
};

export default MobileRightSidebar;
