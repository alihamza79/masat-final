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
import SetPasswordModal from "@/app/components/auth/SetPasswordModal";

const AuthLogin = ({ title, subtitle, subtext }: loginType) => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailTimeout, setEmailTimeout] = useState<NodeJS.Timeout | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  
  // Google account dialog
  const [showGoogleAccountDialog, setShowGoogleAccountDialog] = useState(false);
  const [existingAuthMethods, setExistingAuthMethods] = useState<{
    googleLinked: boolean;
    credentialsLinked: boolean;
  }>({ googleLinked: false, credentialsLinked: false });

  const [signingIn, setSigningIn] = useState(false);
  const [loadingText, setLoadingText] = useState("Signing in...");

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
      console.log("🌐 [CLIENT] Checking if email exists:", email);
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      
      // Log debugging information
      console.log('🌐 [CLIENT] Email check response:', data);
      
      if (data.success && data.exists) {
        // Force boolean values and log what we're setting
        const googleLinked = !!data.googleLinked;
        const credentialsLinked = !!data.credentialsLinked;
        
        console.log(`🌐 [CLIENT] Setting auth methods - googleLinked: ${googleLinked}, credentialsLinked: ${credentialsLinked}`);
        
        setExistingAuthMethods({
          googleLinked,
          credentialsLinked
        });
      }
    } catch (err) {
      console.error('🌐 [CLIENT] Error checking email:', err);
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleGoogleSignIn = async () => {
    console.log("🌐 [CLIENT] Initiating Google sign in");
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
      console.log("🌐 [CLIENT] Showing Google account dialog for:", email);
      setShowGoogleAccountDialog(true);
      return;
    }
    
    // Continue with normal login
    try {
      console.log("🌐 [CLIENT] Attempting login for email:", email);
      setError("");
      setLoading(true);
      setSigningIn(true);
      setLoadingText("Authenticating...");
      
      // Attempt sign in - pass remember device preference
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
        remember: rememberDevice
      });
      
      console.log("🌐 [CLIENT] Login result:", result);
      
      if (result?.error) {
        console.error("🌐 [CLIENT] Login failed:", result.error);
        setError(result.error);
        setLoading(false);
        setSigningIn(false);
      } else {
        // Use router.replace instead of push for a cleaner redirect
        console.log("🌐 [CLIENT] Login successful, redirecting...");
        setLoadingText("Redirecting to dashboard...");
        
        try {
          // Get the callbackUrl from the query parameters if it exists
          const urlParams = new URLSearchParams(window.location.search);
          const callbackUrl = urlParams.get('callbackUrl') || '/dashboard';
          
          // SECURITY: Validate callback URL to prevent open redirect vulnerabilities
          // Only allow relative URLs or URLs to your own domain
          const isValidRedirect = (url: string) => {
            // Allow relative URLs
            if (url.startsWith('/')) return true;
            
            try {
              // For absolute URLs, check if they point to your domain
              const urlObj = new URL(url);
              return urlObj.hostname === window.location.hostname;
            } catch {
              return false;
            }
          };
          
          const safeCallbackUrl = isValidRedirect(decodeURIComponent(callbackUrl)) 
            ? decodeURIComponent(callbackUrl) 
            : '/dashboard';
          
          console.log("🌐 [CLIENT] Redirecting to:", safeCallbackUrl);
          
          // Use replace instead of push for better navigation
          await router.replace(safeCallbackUrl);
          
          // If router.replace doesn't trigger navigation fast enough, force reload after 2 seconds
          setTimeout(() => {
            if (window.location.pathname.includes('/auth')) {
              console.log("🌐 [CLIENT] Router navigation didn't complete, using fallback redirect");
              window.location.href = safeCallbackUrl;
            }
          }, 2000);
        } catch (navError) {
          console.error("🌐 [CLIENT] Navigation error:", navError);
          // Fallback to direct location change if router navigation fails
          window.location.href = '/dashboard';
        }
      }
    } catch (error) {
      console.error("🌐 [CLIENT] Sign in error:", error);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
      setSigningIn(false);
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

      <AuthSocialButtons title="Sign in with" rememberDevice={rememberDevice} />
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
                control={
                  <CustomCheckbox 
                    checked={rememberDevice} 
                    onChange={(e) => setRememberDevice(e.target.checked)} 
                  />
                }
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
                <Typography variant="button">{loadingText}</Typography>
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

      {signingIn && !error && (
        <Box 
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(255,255,255,0.7)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            backdropFilter: 'blur(2px)',
          }}
        >
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <Typography variant="h6">Authenticating...</Typography>
        </Box>
      )}
    </>
  );
};

export default AuthLogin;