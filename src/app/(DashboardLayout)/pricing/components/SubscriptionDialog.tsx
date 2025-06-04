'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Paper,
  Stack,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress
} from '@mui/material';
import { IconCreditCard, IconCheck, IconArrowRight } from '@tabler/icons-react';
import { useTheme } from '@mui/material/styles';

// Define a User interface for the component
interface User {
  subscriptionPlan?: string | null;
  subscriptionStatus?: string | null;
}

interface SubscriptionDialogProps {
  open: boolean;
  onClose: () => void;
  onManageSubscription: () => void;
  user: User | null;
  portalLoading: boolean;
}

const SubscriptionDialog: React.FC<SubscriptionDialogProps> = ({
  open,
  onClose,
  onManageSubscription,
  user,
  portalLoading
}) => {
  const theme = useTheme();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="subscription-dialog-title"
      aria-describedby="subscription-dialog-description"
      PaperProps={{
        sx: {
          borderRadius: '12px',
          maxWidth: '500px',
          width: '100%'
        }
      }}
    >
      <DialogContent sx={{ pt: 2, pb: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: theme.palette.grey[100], borderRadius: '8px' }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                <IconCreditCard size={22} />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight="medium">
                  Current Plan: <Box component="span" sx={{ color: theme.palette.primary.main }}>{user?.subscriptionPlan?.toUpperCase()}</Box>
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Status: <Box component="span" sx={{ 
                    color: user?.subscriptionStatus === 'active' ? theme.palette.success.main : theme.palette.warning.main,
                    fontWeight: 'medium'
                  }}>
                    {user?.subscriptionStatus?.toUpperCase()}
                  </Box>
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Box>
        
        <Typography variant="body1" id="subscription-dialog-description" sx={{ mb: 2 }}>
          You'll be redirected to the Stripe billing portal where you can:
        </Typography>
        
        <List disablePadding sx={{ mb: 2 }}>
          <ListItem disableGutters sx={{ py: 0.5 }}>
            <ListItemIcon sx={{ minWidth: '32px' }}>
              <IconCheck width={18} color={theme.palette.success.main} />
            </ListItemIcon>
            <ListItemText primary="Upgrade to a higher tier plan" />
          </ListItem>
          <ListItem disableGutters sx={{ py: 0.5 }}>
            <ListItemIcon sx={{ minWidth: '32px' }}>
              <IconCheck width={18} color={theme.palette.success.main} />
            </ListItemIcon>
            <ListItemText primary="Downgrade to a lower tier plan" />
          </ListItem>
          <ListItem disableGutters sx={{ py: 0.5 }}>
            <ListItemIcon sx={{ minWidth: '32px' }}>
              <IconCheck width={18} color={theme.palette.success.main} />
            </ListItemIcon>
            <ListItemText primary="Cancel your current subscription" />
          </ListItem>
          <ListItem disableGutters sx={{ py: 0.5 }}>
            <ListItemIcon sx={{ minWidth: '32px' }}>
              <IconCheck width={18} color={theme.palette.success.main} />
            </ListItemIcon>
            <ListItemText primary="Update your payment method" />
          </ListItem>
        </List>
      </DialogContent>
      
      <Divider />
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button 
          onClick={onClose} 
          variant="outlined"
          color="inherit"
          disabled={portalLoading}
        >
          Stay on Pricing
        </Button>
        <Button 
          onClick={onManageSubscription} 
          color="primary" 
          variant="contained" 
          startIcon={portalLoading ? <CircularProgress size={18} color="inherit" /> : <IconArrowRight size={18} />}
          disabled={portalLoading}
          autoFocus
        >
          {portalLoading ? 'Loading...' : 'Manage Subscription'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SubscriptionDialog; 