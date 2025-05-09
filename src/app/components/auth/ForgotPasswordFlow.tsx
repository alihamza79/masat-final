import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  InputAdornment,
  useMediaQuery,
  useTheme,
  Fade
} from '@mui/material';
import { IconCheck, IconEye, IconEyeOff, IconMail, IconLock, IconArrowLeft } from '@tabler/icons-react';
import axios from 'axios';
import { signIn } from 'next-auth/react';
import OTPInput from './OTPInput';

const STEPS = ['Email Verification', 'Enter OTP', 'Reset Password'];

interface ForgotPasswordFlowProps {
  onComplete: () => void;
  onCancel: () => void;
  variant?: 'standalone' | 'inside-modal';
}

const ForgotPasswordFlow: React.FC<ForgotPasswordFlowProps> = ({ 
  onComplete, 
  onCancel,
  variant = 'standalone'
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [activeStep, setActiveStep] = useState(0);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);
  const [verificationToken, setVerificationToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Start a countdown timer after sending OTP
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleSendOTP = async () => {
    if (!email) {
      setError('Email is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const response = await axios.post('/api/auth/forgot-password', { email });
      
      if (response.data.success) {
        setSuccess('If your email exists in our system, you will receive a verification code shortly');
        setActiveStep(1);
        setTimer(60); // 60 seconds countdown for resend
      } else if (response.data.action === 'set-password') {
        // Special case for Google-only accounts
        setError(response.data.message || 'This account uses Google Sign-In. Please use "Set Password" option instead.');
      } else {
        setError(response.data.message || 'Failed to send reset code');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred while sending reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp) {
      setError('Verification code is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post('/api/auth/verify-reset-otp', { email, otp });
      
      if (response.data.success) {
        setSuccess('Verification successful');
        setVerificationToken(response.data.data.token);
        setActiveStep(2);
      } else {
        setError(response.data.message || 'Invalid verification code');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred while verifying your code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!password) {
      setError('Password is required');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post('/api/auth/reset-password', { 
        email, 
        password,
        token: verificationToken
      });
      
      if (response.data.success) {
        setSuccess('Password reset successfully! You can now login with your new password.');
        
        // Delay before redirecting to login page
        setTimeout(() => {
          onComplete();
        }, 2000);
      } else {
        setError(response.data.message || 'Failed to reset password');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred while resetting your password');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = () => {
    setOtp('');
    handleSendOTP();
  };

  // Render different step content based on activeStep
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box my={3}>
            <Typography variant="body2" align="center" gutterBottom mb={2}>
              Enter your email address and we'll send you a verification code to reset your password
            </Typography>
            
            <TextField
              label="Email Address"
              type="email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconMail size={20} />
                  </InputAdornment>
                ),
              }}
            />
            <Box mt={3} display="flex" justifyContent="space-between">
              <Button 
                variant="outlined" 
                onClick={onCancel}
                disabled={loading}
                startIcon={<IconArrowLeft size={16} />}
              >
                Back to Login
              </Button>
              <Button 
                variant="contained" 
                onClick={handleSendOTP}
                disabled={loading || !email}
                endIcon={loading ? <CircularProgress size={20} /> : null}
              >
                Send Reset Code
              </Button>
            </Box>
          </Box>
        );
        
      case 1:
        return (
          <Box my={3}>
            <Typography variant="body2" align="center" gutterBottom>
              Please check your email for the verification code
            </Typography>
            
            {success && success.includes('receive') && (
              <Fade in={true} timeout={700}>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: 1,
                    backgroundColor: 'success.main',
                    color: 'white',
                    borderRadius: 1,
                    p: 1.5,
                    mb: 2,
                    mt: 1
                  }}
                >
                  <IconCheck size={20} />
                  <Typography variant="body2" fontWeight={500}>
                    If your email exists in our database, you will receive the verification code
                  </Typography>
                </Box>
              </Fade>
            )}
            
            <OTPInput
              length={6}
              value={otp}
              onChange={setOtp}
              disabled={loading}
            />
            
            <Box mt={1} mb={2} textAlign="center">
              <Button 
                variant="text" 
                onClick={handleResendOTP}
                disabled={loading || timer > 0}
                size="small"
              >
                {timer > 0 ? `Resend in ${timer}s` : 'Resend Code'}
              </Button>
            </Box>
            <Box mt={3} display="flex" justifyContent="space-between">
              <Button 
                variant="outlined" 
                onClick={() => setActiveStep(0)}
                disabled={loading}
              >
                Back
              </Button>
              <Button 
                variant="contained" 
                onClick={handleVerifyOTP}
                disabled={loading || otp.length !== 6}
                endIcon={loading ? <CircularProgress size={20} /> : null}
              >
                Verify
              </Button>
            </Box>
          </Box>
        );
        
      case 2:
        return (
          <Box my={3}>
            <Typography variant="body2" align="center" gutterBottom sx={{ mb: 2 }}>
              Create a new password for your account
            </Typography>
            
            <TextField
              label="New Password"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconLock size={20} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <IconEyeOff size={20} /> : <IconEye size={20} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            {password && password.length < 6 && (
              <Typography variant="caption" color="error" sx={{ ml: 1 }}>
                Password must be at least 6 characters
              </Typography>
            )}
            
            <TextField
              label="Confirm New Password"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              margin="normal"
              error={Boolean(password && confirmPassword && password !== confirmPassword)}
              helperText={
                password && confirmPassword && password !== confirmPassword 
                  ? "Passwords don't match" 
                  : ""
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconLock size={20} />
                  </InputAdornment>
                ),
              }}
            />
            
            <Box mt={3} display="flex" justifyContent="space-between">
              <Button 
                variant="outlined" 
                onClick={() => setActiveStep(1)}
                disabled={loading}
              >
                Back
              </Button>
              <Button 
                variant="contained" 
                onClick={handleResetPassword}
                disabled={loading || !password || password.length < 6 || password !== confirmPassword}
                endIcon={loading ? <CircularProgress size={20} /> : <IconCheck size={20} />}
              >
                Reset Password
              </Button>
            </Box>
          </Box>
        );
        
      default:
        return null;
    }
  };

  const content = (
    <>
      <Typography variant="h5" gutterBottom align="center">
        Forgot Password
      </Typography>
      
      <Stepper 
        activeStep={activeStep} 
        alternativeLabel={!isMobile} 
        orientation={isMobile ? 'vertical' : 'horizontal'} 
        sx={{ 
          mb: 4, 
          mt: 2,
          '& .MuiStepLabel-label': {
            fontSize: { xs: '0.75rem', sm: '0.875rem' }
          },
          '& .MuiStepConnector-line': {
            minHeight: isMobile ? 20 : undefined
          }
        }}
      >
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      {/* Only show error alerts at the top level */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 2,
            '& .MuiAlert-message': {
              width: '100%'
            }
          }}
        >
          {error}
        </Alert>
      )}
      
      {/* Only show success messages for completion here */}
      {success && !success.includes('receive') && !success.includes('sent') && (
        <Alert 
          severity="success" 
          sx={{ 
            mb: 2,
            '& .MuiAlert-message': {
              width: '100%'
            }
          }}
        >
          {success}
        </Alert>
      )}
      
      {renderStepContent()}
    </>
  );

  // When used inside a modal, don't wrap in Paper
  if (variant === 'inside-modal') {
    return content;
  }

  // Standalone version with Paper wrapper
  return (
    <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, maxWidth: 500, mx: 'auto' }}>
      {content}
    </Paper>
  );
};

export default ForgotPasswordFlow; 