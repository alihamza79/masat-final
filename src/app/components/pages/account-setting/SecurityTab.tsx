import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  CardContent,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';

// components
import BlankCard from '../../shared/BlankCard';
import CustomTextField from '../../forms/theme-elements/CustomTextField';
import CustomFormLabel from '../../forms/theme-elements/CustomFormLabel';

// services
import axios from 'axios';

// Define props interface
interface SecurityTabProps {
  userData: any;
}

const SecurityTab = ({ userData }: SecurityTabProps) => {
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Auto-hide success message after 3 seconds
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (message.type === 'success') {
      timeoutId = setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    }
    
    // Cleanup timeout on component unmount or when message changes
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [message]);

  // Handle password data change
  const handlePasswordDataChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  // Handle password change
  const handleChangePassword = async () => {
    try {
      // Reset any existing messages
      setMessage({ type: '', text: '' });

      // Validate passwords
      if (!passwordData.currentPassword) {
        setMessage({ type: 'error', text: 'Current password is required' });
        return;
      }
      
      if (!passwordData.newPassword) {
        setMessage({ type: 'error', text: 'New password is required' });
        return;
      }
      
      if (passwordData.newPassword.length < 6) {
        setMessage({ type: 'error', text: 'New password must be at least 6 characters' });
        return;
      }

      // Check if new password is same as current password
      if (passwordData.currentPassword === passwordData.newPassword) {
        setMessage({ type: 'error', text: 'New password must be different from current password' });
        return;
      }
      
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setMessage({ type: 'error', text: 'Passwords do not match' });
        return;
      }
      
      setLoading(true);
      
      // Send password change request
      const response = await axios.post('/api/user/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Password changed successfully' });
        // Reset password fields
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        setMessage({ type: 'error', text: response.data.error || 'Failed to change password' });
      }
    } catch (error: any) {
      console.error('Error changing password:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to change password' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Grid container spacing={3}>
      {message.text && message.type === 'error' && (
        <Grid item xs={12}>
          <Alert severity="error">{message.text}</Alert>
        </Grid>
      )}
      {message.text && message.type === 'success' && (
        <Grid item xs={12}>
          <Alert severity="success">{message.text}</Alert>
        </Grid>
      )}
      
      {/* Password Security Section */}
      <Grid item xs={12}>
        <BlankCard>
          <CardContent>
            <Typography variant="h5" mb={1}>
              Change Password
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Typography color="textSecondary" mb={3}>
              Choose a password that is at least 6 characters long and different from your current password
            </Typography>
            
            <Grid container spacing={3} maxWidth="md">
              <Grid item xs={12}>
                <CustomFormLabel 
                  htmlFor="current-password"
                  sx={{ mt: 0 }}
                >
                  Current Password
                </CustomFormLabel>
                <CustomTextField
                  id="current-password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordDataChange}
                  variant="outlined"
                  fullWidth
                  type="password"
                  disabled={loading}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <CustomFormLabel 
                  sx={{ mt: { xs: 2, sm: 0 } }}
                  htmlFor="new-password"
                >
                  New Password
                </CustomFormLabel>
                <CustomTextField
                  id="new-password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordDataChange}
                  variant="outlined"
                  fullWidth
                  type="password"
                  disabled={loading}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <CustomFormLabel 
                  sx={{ mt: { xs: 2, sm: 0 } }}
                  htmlFor="confirm-password"
                >
                  Confirm New Password
                </CustomFormLabel>
                <CustomTextField
                  id="confirm-password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordDataChange}
                  variant="outlined"
                  fullWidth
                  type="password"
                  disabled={loading}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Box>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={handleChangePassword}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Change Password'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </BlankCard>
      </Grid>
      
      {/* Security Tips */}
      <Grid item xs={12}>
        <BlankCard>
          <CardContent>
            <Typography variant="h5" mb={1}>
              Password Security Tips
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Typography variant="body1" gutterBottom>
              Follow these guidelines to create a strong, secure password:
            </Typography>
            
            <Grid container spacing={2} mt={1}>
              <Grid item xs={12} md={6}>
                <ul style={{ paddingLeft: '20px' }}>
                  <li>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Use at least 8 characters, preferably more
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Mix uppercase and lowercase letters
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Include numbers and special characters
                    </Typography>
                  </li>
                </ul>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <ul style={{ paddingLeft: '20px' }}>
                  <li>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Avoid using easily guessable information
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Don't reuse passwords across multiple sites
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Consider using a password manager
                    </Typography>
                  </li>
                </ul>
              </Grid>
            </Grid>
          </CardContent>
        </BlankCard>
      </Grid>
    </Grid>
  );
};

export default SecurityTab; 