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
import { IconCheck, IconEye, IconEyeOff, IconMail, IconLock } from '@tabler/icons-react';
import axios from 'axios';
import { signIn } from 'next-auth/react';
import OTPInput from './OTPInput';

const STEPS = ['Email Verification', 'Enter OTP', 'Set Password'];

interface OTPVerificationProps {
  email: string;
  onComplete: () => void;
  onCancel: () => void;
  variant?: 'standalone' | 'inside-modal';
}

const OTPVerification: React.FC<OTPVerificationProps> = ({ 
  email: initialEmail, 
  onComplete, 
  onCancel,
  variant = 'standalone'
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [activeStep, setActiveStep] = useState(0);
  const [email, setEmail] = useState(initialEmail);
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
      setSuccess(null); // Clear any previous success message
      
      const response = await axios.post('/api/auth/send-otp', { email });
      
      if (response.data.success) {
        setSuccess('Verification code sent to your email');
        setActiveStep(1);
        setTimer(60); // 60 seconds countdown for resend
      } else {
        setError(response.data.message || 'Failed to send verification code');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred while sending verification code');
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
      
      const response = await axios.post('/api/auth/verify-otp', { email, otp });
      
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

  const handleSetPassword = async () => {
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
      
      const response = await axios.post('/api/auth/set-password', { 
        email, 
        password,
        token: verificationToken
      });
      
      if (response.data.success) {
        setSuccess('Password set successfully! Logging you in...');
        
        // Auto login with the newly set password
        const loginResult = await signIn('credentials', {
          redirect: false,
          email,
          password
        });
        
        if (loginResult?.error) {
          setError('Password set successfully, but automatic login failed. Please log in manually.');
          setTimeout(() => {
            onComplete();
          }, 2000);
        } else {
          // On successful login, redirect to dashboard
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 1500);
        }
      } else {
        setError(response.data.message || 'Failed to set password');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred while setting your password');
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
              >
                Cancel
              </Button>
              <Button 
                variant="contained" 
                onClick={handleSendOTP}
                disabled={loading || !email}
                endIcon={loading ? <CircularProgress size={20} /> : null}
              >
                Send Verification Code
              </Button>
            </Box>
          </Box>
        );
        
      case 1:
        return (
          <Box my={3}>
            <Typography variant="body2" align="center" gutterBottom>
              We&apos;ve sent a verification code to {email}
            </Typography>
            
            {success && success.includes('sent') && (
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
                    Verification code sent to your email
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
              Create a password for your account
            </Typography>
            
            <TextField
              label="Password"
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
              label="Confirm Password"
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
                onClick={handleSetPassword}
                disabled={loading || !password || password.length < 6 || password !== confirmPassword}
                endIcon={loading ? <CircularProgress size={20} /> : <IconCheck size={20} />}
              >
                Set Password
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
        Set Password
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
      
      {success && !success.includes('sent') && (
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

export default OTPVerification; 