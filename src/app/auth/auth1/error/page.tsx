'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, Button, Container, Typography, Paper, Alert } from '@mui/material';
import Link from 'next/link';
import PageContainer from '@/app/components/container/PageContainer';
import Logo from '@/app/(DashboardLayout)/layout/logo/Logo';

const getErrorMessage = (error: string | null) => {
  switch (error) {
    case 'CredentialsSignin':
      return 'Invalid email or password. Please try again.';
    case 'Verification':
      return 'The verification link may have expired or is invalid.';
    case 'Configuration':
      return 'There is a problem with the server configuration.';
    case 'AccessDenied':
      return 'You do not have permission to sign in.';
    case 'OAuthAccountNotLinked':
      return 'Email already used with a different provider.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
};

export default function ErrorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  useEffect(() => {
    const error = searchParams.get('error');
    setErrorMessage(getErrorMessage(error));
  }, [searchParams]);
  
  const handleGoBack = () => {
    router.back();
  };
  
  return (
    <PageContainer title="Authentication Error" description="Authentication error page">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'background.default',
        }}
      >
        <Container maxWidth="sm">
          <Box sx={{ mb: 5, textAlign: 'center' }}>
            <Logo />
          </Box>
          
          <Paper
            elevation={1}
            sx={{
              p: 4,
              borderRadius: 2,
              boxShadow: (theme) => theme.shadows[3],
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" color="error" gutterBottom>
                Authentication Error
              </Typography>
              
              <Alert severity="error" sx={{ mb: 3 }}>
                {errorMessage}
              </Alert>
              
              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={handleGoBack}
                >
                  Go Back
                </Button>
                
                <Button
                  variant="contained"
                  color="primary"
                  component={Link}
                  href="/auth/auth1/login"
                >
                  Return to Login
                </Button>
              </Box>
            </Box>
          </Paper>
        </Container>
      </Box>
    </PageContainer>
  );
} 