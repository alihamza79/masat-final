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
import { useState, FormEvent, useEffect, useRef, ChangeEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import SetPasswordModal from "@/app/components/auth/SetPasswordModal";

const AuthLogin = ({ title, subtitle, subtext }: loginType) => {
  const router = useRouter();
  const searchParams = useSearchParams();
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

  // Social login loading states
  const [googleLoading, setGoogleLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);
  
  // Check for errors in URL from NextAuth
  useEffect(() => {
    const errorFromQuery = searchParams?.get("error");
    if (errorFromQuery) {
      let errorMessage = "Authentication failed";
      
      // Map Next-Auth error codes to user-friendly messages
      switch (errorFromQuery) {
        case "CredentialsSignin":
          errorMessage = "Invalid email or password";
          break;
        case "OAuthSignin":
        case "OAuthCallback":
        case "OAuthCreateAccount":
          errorMessage = "Error connecting with social login. Please try another method.";
          break;
        case "Callback":
          errorMessage = "Login callback error. Please try again.";
          break;
        default:
          errorMessage = `Login error: ${errorFromQuery}`;
      }
      
      setError(errorMessage);
    }
  }, [searchParams]);

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
      
      if (data.success && data.exists) {
        const googleLinked = !!data.googleLinked;
        const credentialsLinked = !!data.credentialsLinked;
        
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
    try {
      setGoogleLoading(true);
      
      // Direct navigation to Google OAuth endpoint
      // This is more reliable than using the signIn function
      window.location.href = `/api/auth/signin/google?callbackUrl=${encodeURIComponent('/dashboard')}`;
    } catch (error) {
      console.error("Google sign in error:", error);
      setGoogleLoading(false);
      setError("Failed to connect to Google. Please try again.");
    }
  };

  const handleFacebookSignIn = async () => {
    try {
      setFacebookLoading(true);
      
      // Direct navigation to Facebook OAuth endpoint
      window.location.href = `/api/auth/signin/facebook?callbackUrl=${encodeURIComponent('/dashboard')}`;
    } catch (error) {
      console.error("Facebook sign in error:", error);
      setFacebookLoading(false);
      setError("Failed to connect to Facebook. Please try again.");
    }
  };

  // Reimplemented handleSubmit with more robust approach
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
    
    try {
      setError("");
      setLoading(true);
      
      // Use a more direct approach for credential login
      // Setting callbackUrl directly ensures better redirection in production
      window.location.href = `/api/auth/callback/credentials?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}&callbackUrl=${encodeURIComponent('/dashboard')}`;
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

      <AuthSocialButtons 
        title="Sign in with" 
        onGoogleSignIn={handleGoogleSignIn}
        onFacebookSignIn={handleFacebookSignIn}
        googleLoading={googleLoading}
        facebookLoading={facebookLoading}
      />
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
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                <Typography variant="button">Signing in...</Typography>
              </Box>
            ) : "Sign In"}
          </Button>
        </Box>
      </form>
      {subtitle}

      <SetPasswordModal
        open={showGoogleAccountDialog}
        onClose={() => setShowGoogleAccountDialog(false)}
        email={email}
      />
    </>
  );
};

export default AuthLogin;
