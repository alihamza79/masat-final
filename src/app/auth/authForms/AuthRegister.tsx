'use client'
import { Box, Typography, Button, Divider, Alert, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import Link from "next/link";
import CustomTextField from "@/app/components/forms/theme-elements/CustomTextField";
import CustomFormLabel from "@/app/components/forms/theme-elements/CustomFormLabel";
import { Stack } from "@mui/system";
import { registerType } from "@/app/(DashboardLayout)/types/auth/auth";
import AuthSocialButtons from "./AuthSocialButtons";
import { useState, FormEvent, useEffect, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import OTPInput from '@/app/components/auth/OTPInput';

// Define the steps for registration (keep this for functionality but remove visual stepper)
const REGISTRATION_STEPS = ['Account Details', 'Email Verification', 'Complete'];

const AuthRegister = ({ title, subtitle, subtext }: registerType) => {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailTimeout, setEmailTimeout] = useState<NodeJS.Timeout | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  
  // Account linking dialog
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [existingAuthMethods, setExistingAuthMethods] = useState<{
    googleLinked: boolean;
    credentialsLinked: boolean;
  }>({ googleLinked: false, credentialsLinked: false });
  
  // Check if this is a password-setting flow for an existing Google account
  const isSettingPasswordForGoogleAccount = existingAuthMethods.googleLinked && !existingAuthMethods.credentialsLinked;

  // Check if redirected from login with email parameter
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const emailParam = queryParams.get('email');
    
    if (emailParam) {
      setEmail(emailParam);
      // Check if email exists with Google auth
      checkEmailExists(emailParam);
    }
  }, []);

  // Check if email already exists with a delay after typing
  useEffect(() => {
    if (email && email.includes('@')) {
      // Clear previous timeout
      if (emailTimeout) {
        clearTimeout(emailTimeout);
      }
      
      // Set new timeout to avoid checking on every keystroke
      const timeout = setTimeout(() => {
        checkEmailExists(email);
      }, 800);
      
      setEmailTimeout(timeout);
    }
    
    return () => {
      if (emailTimeout) {
        clearTimeout(emailTimeout);
      }
    };
  }, [email]);

  // Handle resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => {
        setResendTimer(prevTimer => prevTimer - 1);
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [resendTimer]);

  const checkEmailExists = async (email: string) => {
    try {
      setCheckingEmail(true);
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      
      if (data.success && data.exists) {
        setExistingAuthMethods({
          googleLinked: data.googleLinked,
          credentialsLinked: data.credentialsLinked
        });
        
        const queryParams = new URLSearchParams(window.location.search);
        const fromLogin = queryParams.get('email') === email;
        
        if (data.googleLinked) {
          // If redirected from login to set password for Google account
          if (fromLogin && !data.credentialsLinked) {
            setSuccess('Please set a password for your Google account.');
          } 
          // Otherwise show dialog for regular registration flow
          else if (!fromLogin) {
            setShowLinkDialog(true);
          }
        }
      }
    } catch (err) {
      console.error('Error checking email:', err);
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleGoogleSignIn = async () => {
    await signIn('google', { callbackUrl: '/' });
  };

  const handleSetPassword = async () => {
    setShowLinkDialog(false);
    
    try {
      setLoading(true);
      
      const response = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.message || 'Failed to set password');
        return;
      }
      
      setSuccess('Password set successfully! Signing you in...');
      
      // Automatically sign in after setting password
      const signInResult = await signIn('credentials', {
        redirect: false,
        email,
        password
      });
      
      if (signInResult?.error) {
        setError(`Password set but sign-in failed: ${signInResult.error}`);
        setTimeout(() => {
          router.push('/auth/auth1/login');
        }, 2000);
      } else {
        // Sign-in successful, redirect to dashboard
        try {
          // Use replace instead of push for better navigation
          await router.replace('/');
          
          // If router.replace doesn't trigger navigation fast enough, force reload after 2 seconds
          setTimeout(() => {
            if (window.location.pathname.includes('/auth')) {
              window.location.href = '/';
            }
          }, 2000);
        } catch (navError) {
          console.error("Navigation error:", navError);
          // Fallback to direct location change if router navigation fails
          window.location.href = '/';
        }
      }
      
    } catch (err) {
      console.error('Set password error:', err);
      setError('An error occurred while setting password');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitInitialForm = async (e: FormEvent) => {
    e.preventDefault();
    
    // Reset messages
    setError("");
    setSuccess("");
    
    // Basic validation
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    // If setting password for Google account, use the existing flow
    if (isSettingPasswordForGoogleAccount) {
      handleSetPassword();
      return;
    }
    
    // For regular registration, send OTP for email verification
    try {
      setLoading(true);
      
      const response = await fetch('/api/auth/send-registration-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.message || 'Failed to send verification code');
        return;
      }
      
      setSuccess('Verification code sent to your email');
      setActiveStep(1); // Move to OTP verification step
      setResendTimer(60); // Set 60 seconds countdown for resend
      
    } catch (err) {
      console.error('Error sending OTP:', err);
      setError('An error occurred while sending verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!otp) {
      setError('Verification code is required');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/auth/verify-registration-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.message || 'Failed to verify code');
        return;
      }
      
      setSuccess('Email verified and account created successfully!');
      setActiveStep(2); // Move to completion step
      
      // After 2 seconds, sign in and redirect to dashboard
      setTimeout(async () => {
        const signInResult = await signIn('credentials', {
          redirect: false,
          email,
          password
        });
        
        if (signInResult?.error) {
          setError(`Account created but sign-in failed: ${signInResult.error}`);
        } else {
          try {
            // Use replace instead of push for better navigation
            await router.replace('/');
            
            // If router.replace doesn't trigger navigation fast enough, force reload after 2 seconds
            setTimeout(() => {
              if (window.location.pathname.includes('/auth')) {
                window.location.href = '/';
              }
            }, 2000);
          } catch (navError) {
            console.error("Navigation error:", navError);
            // Fallback to direct location change if router navigation fails
            window.location.href = '/';
          }
        }
      }, 2000);
      
    } catch (err) {
      console.error('Error verifying OTP:', err);
      setError('An error occurred while verifying code');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setOtp('');
    
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/auth/send-registration-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.message || 'Failed to resend verification code');
        return;
      }
      
      setSuccess('Verification code resent to your email');
      setResendTimer(60); // Reset countdown timer
      
    } catch (err) {
      console.error('Error resending OTP:', err);
      setError('An error occurred while resending verification code');
    } finally {
      setLoading(false);
    }
  };

  // Render step content based on active step
  const renderStepContent = () => {
    switch (activeStep) {
      case 0: // Account details form
        return (
          <form onSubmit={handleSubmitInitialForm}>
            <Stack mb={3}>
              {!isSettingPasswordForGoogleAccount && (
                <>
                  <CustomFormLabel htmlFor="name">Name</CustomFormLabel>
                  <CustomTextField 
                    id="name" 
                    variant="outlined" 
                    fullWidth 
                    value={name}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                  />
                </>
              )}
              <CustomFormLabel htmlFor="email">Email Address</CustomFormLabel>
              <CustomTextField 
                id="email" 
                variant="outlined" 
                fullWidth 
                value={email}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                type="email"
                required
                disabled={isSettingPasswordForGoogleAccount}
                InputProps={{
                  endAdornment: checkingEmail ? (
                    <CircularProgress size={16} />
                  ) : null,
                }}
              />
              <CustomFormLabel htmlFor="password">Password</CustomFormLabel>
              <CustomTextField 
                id="password" 
                variant="outlined" 
                fullWidth 
                type="password"
                value={password}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                required
              />
              <CustomFormLabel htmlFor="confirmPassword">Confirm Password</CustomFormLabel>
              <CustomTextField 
                id="confirmPassword" 
                variant="outlined" 
                fullWidth 
                type="password"
                value={confirmPassword}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                required
              />
            </Stack>
            <Button
              color="primary"
              variant="contained"
              size="large"
              fullWidth
              type="submit"
              disabled={loading || checkingEmail}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : "Continue"}
            </Button>
          </form>
        );
      
      case 1: // OTP verification
        return (
          <form onSubmit={handleVerifyOTP}>
            <Stack spacing={3} my={3}>
              <Typography variant="body1" align="center">
                We've sent a verification code to {email}
              </Typography>
              
              <Box>
                <OTPInput
                  length={6}
                  value={otp}
                  onChange={setOtp}
                  disabled={loading}
                />
              </Box>
              
              <Box textAlign="center">
                <Button
                  variant="text"
                  onClick={handleResendOTP}
                  disabled={loading || resendTimer > 0}
                  size="small"
                >
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                </Button>
              </Box>
            </Stack>
            
            <Button
              color="primary"
              variant="contained"
              size="large"
              fullWidth
              type="submit"
              disabled={loading || otp.length < 6}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : "Verify & Create Account"}
            </Button>
          </form>
        );
      
      case 2: // Completion
        return (
          <Box textAlign="center" my={3}>
            <Typography variant="h6" gutterBottom>
              Account Created Successfully!
            </Typography>
            <Typography variant="body1" gutterBottom>
              Your account has been created and you will be redirected to the dashboard.
            </Typography>
            <CircularProgress size={24} sx={{ mt: 2 }} />
          </Box>
        );
      
      default:
        return null;
    }
  };

  return (
    <>
      {isSettingPasswordForGoogleAccount ? (
        <Typography fontWeight="700" variant="h3" mb={1}>
          Set Password
        </Typography>
      ) : (
        title && (
          <Typography fontWeight="700" variant="h3" mb={1}>
            {title}
          </Typography>
        )
      )}

      {!isSettingPasswordForGoogleAccount && subtext}
      
      {!isSettingPasswordForGoogleAccount && activeStep === 0 && (
        <>
          <AuthSocialButtons title="Sign up with" />
          <Box mt={3}>
            <Divider>
              <Typography
                component="span"
                color="textSecondary"
                variant="h6"
                fontWeight="400"
                position="relative"
                px={2}
              >
                or sign up with
              </Typography>
            </Divider>
          </Box>
        </>
      )}
      
      {isSettingPasswordForGoogleAccount && (
        <Box mt={2} mb={3}>
          <Typography variant="body1" gutterBottom>
            You've previously signed in with Google using this email.
            Please set a password to enable login with credentials.
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Security note: For your safety, in a production environment, this would typically require 
              email verification first. Anyone who knows your email address could potentially 
              set a password for your account.
            </Typography>
          </Alert>
        </Box>
      )}
      
      {error && (
        <Box mt={2}>
          <Alert severity="error">{error}</Alert>
        </Box>
      )}
      
      {success && (
        <Box mt={2}>
          <Alert severity="success">{success}</Alert>
        </Box>
      )}

      <Box>
        {renderStepContent()}
      </Box>
      
      {activeStep === 0 && (
        <Stack direction="row" justifyContent="center" spacing={1} mt={3}>
          <Typography color="textSecondary" variant="h6" fontWeight="500">
            Already have an account?
          </Typography>
          <Typography
            component={Link}
            href="/auth/auth1/login"
            fontWeight="500"
            sx={{
              textDecoration: "none",
              color: "primary.main",
            }}
          >
            Sign In
          </Typography>
        </Stack>
      )}

      <Dialog
        open={showLinkDialog}
        onClose={() => setShowLinkDialog(false)}
        aria-labelledby="link-dialog-title"
      >
        <DialogTitle id="link-dialog-title">
          Account Already Exists
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            An account with this email already exists using Google Sign In.
            Would you like to set a password for this account?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLinkDialog(false)}>Cancel</Button>
          <Button
            onClick={handleGoogleSignIn}
            variant="outlined"
          >
            Sign In with Google
          </Button>
          <Button 
            onClick={handleSetPassword}
            variant="contained"
            disabled={!password || password.length < 6}
          >
            Set Password
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AuthRegister;
