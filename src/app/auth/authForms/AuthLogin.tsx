'use client'
import {
  Box,
  Typography,
  FormGroup,
  FormControlLabel,
  Button,
  Stack,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import Link from "next/link";
import { loginType } from "@/app/(DashboardLayout)/types/auth/auth";
import CustomCheckbox from "@/app/components/forms/theme-elements/CustomCheckbox";
import CustomTextField from "@/app/components/forms/theme-elements/CustomTextField";
import CustomFormLabel from "@/app/components/forms/theme-elements/CustomFormLabel";
import AuthSocialButtons from "./AuthSocialButtons";
import { useState, FormEvent, useEffect, ChangeEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

const AuthLogin = ({ title, subtitle, subtext }: loginType) => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailTimeout, setEmailTimeout] = useState<NodeJS.Timeout | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  
  // Google account dialog
  const [showGoogleAccountDialog, setShowGoogleAccountDialog] = useState(false);
  const [existingAuthMethods, setExistingAuthMethods] = useState<{
    googleLinked: boolean;
    credentialsLinked: boolean;
  }>({ googleLinked: false, credentialsLinked: false });

  // Check if email already exists with delay after typing
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
      
      // Log debugging information
      console.log('Email check response:', data);
      
      if (data.success && data.exists) {
        // Force boolean values and log what we're setting
        const googleLinked = !!data.googleLinked;
        const credentialsLinked = !!data.credentialsLinked;
        
        console.log(`Setting auth methods - googleLinked: ${googleLinked}, credentialsLinked: ${credentialsLinked}`);
        
        setExistingAuthMethods({
          googleLinked,
          credentialsLinked
        });
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (checkingEmail) return;
    
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }
    
    // Only show dialog if this is a Google-only account without credentials
    if (existingAuthMethods.googleLinked && !existingAuthMethods.credentialsLinked) {
      setShowGoogleAccountDialog(true);
      return;
    }
    
    // Continue with normal login
    try {
      setError("");
      setLoading(true);
      
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });
      
      if (result?.error) {
        setError(result.error);
        setLoading(false);
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Sign in error:", error);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleSetPassword = () => {
    // Redirect to registration page where they can set password
    router.push(`/auth/auth1/register?email=${encodeURIComponent(email)}`);
  };

  return (
    <>
      {title ? (
        <Typography fontWeight="700" variant="h3" mb={1}>
          {title}
        </Typography>
      ) : null}

      {subtext}

      <AuthSocialButtons title="Sign in with" />
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
            or sign in with
          </Typography>
        </Divider>
      </Box>

      {error && (
        <Box mt={2}>
          <Alert severity="error">{error}</Alert>
        </Box>
      )}

      <form onSubmit={handleSubmit}>
        <Stack>
          <Box>
            <CustomFormLabel htmlFor="email">Email</CustomFormLabel>
            <CustomTextField 
              id="email" 
              variant="outlined" 
              fullWidth 
              value={email}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              type="email"
              placeholder="Email address"
              required
              InputProps={{
                endAdornment: checkingEmail ? (
                  <CircularProgress size={16} />
                ) : null,
              }}
            />
          </Box>
          <Box>
            <CustomFormLabel htmlFor="password">Password</CustomFormLabel>
            <CustomTextField
              id="password"
              type="password"
              variant="outlined"
              fullWidth
              value={password}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              placeholder="Password"
              required
            />
          </Box>
          <Stack
            justifyContent="space-between"
            direction="row"
            alignItems="center"
            my={2}
          >
            <FormGroup>
              <FormControlLabel
                control={<CustomCheckbox defaultChecked />}
                label="Remember this Device"
              />
            </FormGroup>
            <Typography
              component={Link}
              href="/auth/auth1/forgot-password"
              fontWeight="500"
              sx={{
                textDecoration: "none",
                color: "primary.main",
              }}
            >
              Forgot Password ?
            </Typography>
          </Stack>
        </Stack>
        <Box>
          <Button
            color="primary"
            variant="contained"
            size="large"
            fullWidth
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </Box>
      </form>
      {subtitle}

      {/* Google Account Dialog */}
      <Dialog
        open={showGoogleAccountDialog}
        onClose={() => setShowGoogleAccountDialog(false)}
        aria-labelledby="google-dialog-title"
      >
        <DialogTitle id="google-dialog-title">
          Google Account Detected
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            You've previously signed in with Google using this email, but haven't set a password yet.
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Would you like to continue with Google Sign-In or set a password for this account?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
          <Button 
            onClick={() => setShowGoogleAccountDialog(false)} 
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

export default AuthLogin;
