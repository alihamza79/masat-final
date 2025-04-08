import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Divider,
  Dialog,
  DialogContent,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { 
  IconBrandGoogle, 
  IconLock 
} from '@tabler/icons-react';
import OTPVerification from './OTPVerification';
import { signIn } from 'next-auth/react';

interface SetPasswordModalProps {
  open: boolean;
  onClose: () => void;
  email: string;
}

const SetPasswordModal: React.FC<SetPasswordModalProps> = ({ 
  open, 
  onClose, 
  email 
}) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [showOtpFlow, setShowOtpFlow] = useState(false);

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/dashboard' });
    onClose();
  };

  const handleSetPassword = () => {
    setShowOtpFlow(true);
  };

  const handleOtpComplete = () => {
    // After password is set, close the modal
    // This will only be called if auto-login failed
    setShowOtpFlow(false);
    onClose();
  };

  const handleCancel = () => {
    setShowOtpFlow(false);
  };

  // Additional handler to handle dialog close
  const handleDialogClose = (event: object, reason: string) => {
    // Prevent closing by clicking outside when in OTP flow
    if (showOtpFlow && reason === 'backdropClick') {
      return;
    }
    
    // Otherwise close as normal
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleDialogClose}
      maxWidth="sm"
      fullWidth
      fullScreen={fullScreen && showOtpFlow}
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: { xs: showOtpFlow ? 0 : 2, sm: 2 },
          m: { xs: showOtpFlow ? 0 : 2, sm: 2 }
        }
      }}
    >
      <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
        {!showOtpFlow ? (
          <Box sx={{ p: { xs: 1, sm: 2 } }}>
            <Typography variant="h5" align="center" gutterBottom>
              Account Found
            </Typography>
            <Typography variant="body1" align="center" sx={{ mb: 3 }}>
              You already have an account with Google for {email}. 
              How would you like to proceed?
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 300, mx: 'auto' }}>
              <Button
                variant="contained"
                startIcon={<IconBrandGoogle />}
                onClick={handleGoogleSignIn}
                fullWidth
                sx={{ py: 1 }}
              >
                Continue with Google
              </Button>

              <Divider sx={{ my: 1 }}>or</Divider>

              <Button
                variant="outlined"
                startIcon={<IconLock />}
                onClick={handleSetPassword}
                fullWidth
                sx={{ py: 1 }}
              >
                Set Password for Email Login
              </Button>
            </Box>
          </Box>
        ) : (
          <OTPVerification 
            email={email} 
            onComplete={handleOtpComplete} 
            onCancel={handleCancel}
            variant="inside-modal" 
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SetPasswordModal; 