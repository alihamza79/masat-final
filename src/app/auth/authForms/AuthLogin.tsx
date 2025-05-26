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
import { signIn, getSession } from "next-auth/react";
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
    
    try {
      setError("");
      setLoading(true);
      setLoadingText("Signing in...");
      
      const result = await signIn("credentials", {
        redirect: false,
        email: email.trim(),
        password: password,
      });
      
      if (result?.ok) {
        setLoadingText("Redirecting...");
        window.location.href = '/dashboard';
      } else {
        setError(result?.error || 'Invalid email or password');
      }
    } catch (error) {
      console.error("Sign in error:", error);
      setError('An error occurred during sign in');
    } finally {
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
    </>
  );
};

export default AuthLogin;