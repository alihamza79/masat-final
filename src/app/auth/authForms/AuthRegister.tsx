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

const AuthRegister = ({ title, subtitle, subtext }: registerType) => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailTimeout, setEmailTimeout] = useState<NodeJS.Timeout | null>(null);
  
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
        router.push('/');
      }
      
    } catch (err) {
      console.error('Set password error:', err);
      setError('An error occurred while setting password');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
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
    
    try {
      setLoading(true);
      
      if (isSettingPasswordForGoogleAccount) {
        // Use set-password endpoint instead of register
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
      } else {
        // Regular registration flow
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, email, password }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          setError(data.message || 'Registration failed');
          return;
        }
        
        setSuccess('Registration successful! Signing you in...');
      }
      
      // Automatically sign in after successful registration or password set
      const signInResult = await signIn('credentials', {
        redirect: false,
        email,
        password
      });
      
      if (signInResult?.error) {
        setError(`${isSettingPasswordForGoogleAccount ? 'Password set' : 'Registration successful'} but sign-in failed: ${signInResult.error}`);
        // Still redirect to login page if auto sign-in fails
        setTimeout(() => {
          router.push('/auth/auth1/login');
        }, 2000);
      } else {
        // Registration and sign-in successful, redirect to dashboard
        router.push('/');
      }
      
    } catch (err) {
      console.error(existingAuthMethods.googleLinked ? 'Set password error:' : 'Registration error:', err);
      setError(`An error occurred during ${existingAuthMethods.googleLinked ? 'password setting' : 'registration'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
  <>
    {title ? (
      <Typography fontWeight="700" variant="h3" mb={1}>
          {isSettingPasswordForGoogleAccount ? "Set Password" : title}
      </Typography>
    ) : null}

      {!isSettingPasswordForGoogleAccount && subtext}
      {!isSettingPasswordForGoogleAccount && (
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
        <form onSubmit={handleSubmit}>
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
            ) : isSettingPasswordForGoogleAccount ? (
              "Set Password"
            ) : (
              "Sign Up"
            )}
          </Button>
        </form>
      </Box>
      {!isSettingPasswordForGoogleAccount && subtitle}

      {/* Account Linking Dialog */}
      <Dialog
        open={showLinkDialog}
        onClose={() => setShowLinkDialog(false)}
        aria-labelledby="link-dialog-title"
      >
        <DialogTitle id="link-dialog-title">
          Account Already Exists
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            You already have an account with this email using Google Sign-In.
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Would you like to continue with Google or set a password for this account?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
          <Button 
            onClick={() => setShowLinkDialog(false)} 
            color="inherit"
          >
            Cancel
          </Button>
          <Box>
            <Button 
              onClick={handleSetPassword} 
              color="primary" 
              sx={{ mr: 1 }}
            >
              Set Password
            </Button>
            <Button 
              onClick={handleGoogleSignIn} 
              variant="contained" 
              color="primary"
            >
              Continue with Google
      </Button>
    </Box>
        </DialogActions>
      </Dialog>
  </>
);
};

export default AuthRegister;
