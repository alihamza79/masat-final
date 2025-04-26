'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Box, Button, Card, CardContent, Typography, Divider, Grid, Alert, CircularProgress } from '@mui/material';
import PageContainer from '@/app/components/container/PageContainer';
import Breadcrumb from '@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb';

const BCrumb = [
  {
    to: '/',
    title: 'Home',
  },
  {
    title: 'Debug Auth',
  },
];

const DebugAuthPage = () => {
  const { data: session, status, update } = useSession();
  const [debugData, setDebugData] = useState<any>(null);
  const [cookieData, setCookieData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // Fetch debug data when component mounts
  useEffect(() => {
    const fetchDebugData = async () => {
      try {
        const response = await fetch('/api/debug-auth');
        const data = await response.json();
        setDebugData(data);
      } catch (error) {
        console.error('Error fetching debug data:', error);
      }
    };
    
    const fetchCookieData = async () => {
      try {
        const response = await fetch('/api/check-cookies');
        const data = await response.json();
        setCookieData(data);
      } catch (error) {
        console.error('Error fetching cookie data:', error);
      }
    };
    
    fetchDebugData();
    fetchCookieData();
  }, []);
  
  const handleForceRefresh = async () => {
    setLoading(true);
    try {
      await update();
      // After updating the session, refresh the debug data
      const response = await fetch('/api/debug-auth');
      const data = await response.json();
      setDebugData(data);
    } catch (error) {
      console.error('Error updating session:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleForceSignOut = async () => {
    setLoading(true);
    try {
      await signOut({ redirect: false });
      window.location.href = '/auth/auth1/login';
    } catch (error) {
      console.error('Error signing out:', error);
      setLoading(false);
    }
  };
  
  return (
    <PageContainer title="Debug Authentication" description="Diagnose and fix authentication issues">
      <Breadcrumb title="Debug Authentication" items={BCrumb} />
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Alert severity={status === 'authenticated' ? 'success' : 'error'}>
            <Typography variant="h6">
              Auth Status: {status.toUpperCase()}
            </Typography>
          </Alert>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>Session Information</Typography>
              <Divider sx={{ mb: 2 }} />
              
              {loading ? (
                <Box display="flex" justifyContent="center" my={3}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  <Typography variant="body1" gutterBottom>
                    Client-side session: {session ? 'Available' : 'Not available'}
                  </Typography>
                  
                  <Typography variant="body1" gutterBottom>
                    Server-side session: {debugData?.hasSession ? 'Available' : 'Not available'}
                  </Typography>
                  
                  <Typography variant="body1" gutterBottom>
                    JWT Token: {debugData?.hasToken ? 'Available' : 'Not available'}
                  </Typography>
                  
                  <Box mt={2}>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      onClick={handleForceRefresh}
                      disabled={loading}
                      sx={{ mr: 2 }}
                    >
                      Force Session Refresh
                    </Button>
                    
                    <Button 
                      variant="outlined" 
                      color="error" 
                      onClick={handleForceSignOut}
                      disabled={loading}
                    >
                      Force Sign Out
                    </Button>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>Cookie Information</Typography>
              <Divider sx={{ mb: 2 }} />
              
              {cookieData ? (
                <>
                  <Typography variant="body1" gutterBottom>
                    Total Cookies: {cookieData.cookies.count}
                  </Typography>
                  
                  <Typography variant="body1" gutterBottom>
                    Session Token Cookie: {cookieData.cookies.hasSessionToken ? 'Present' : 'Missing'}
                  </Typography>
                  
                  {cookieData.cookies.hasSessionToken === false && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      The session token cookie is missing. This is why you're not authenticated.
                      This could be caused by:
                      <ul>
                        <li>Browser cookie settings blocking third-party cookies</li>
                        <li>Cookie being deleted by other means</li>
                        <li>Session expiration</li>
                      </ul>
                      Try signing out and signing in again.
                    </Alert>
                  )}
                </>
              ) : (
                <Box display="flex" justifyContent="center" my={3}>
                  <CircularProgress />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>Environment Configuration</Typography>
              <Divider sx={{ mb: 2 }} />
              
              {debugData?.envCheck ? (
                <>
                  <Typography variant="body1" gutterBottom>
                    NEXTAUTH_URL: {debugData.envCheck.NEXTAUTH_URL ? 'Set' : 'Not set'}
                  </Typography>
                  
                  <Typography variant="body1" gutterBottom>
                    NEXTAUTH_SECRET: {debugData.envCheck.NEXTAUTH_SECRET ? 'Set' : 'Not set'}
                  </Typography>
                  
                  <Typography variant="body1" gutterBottom>
                    NODE_ENV: {debugData.envCheck.NODE_ENV}
                  </Typography>
                  
                  {(!debugData.envCheck.NEXTAUTH_URL || !debugData.envCheck.NEXTAUTH_SECRET) && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      Missing required environment variables. Make sure both NEXTAUTH_URL and NEXTAUTH_SECRET 
                      are set in your .env file.
                    </Alert>
                  )}
                </>
              ) : (
                <Box display="flex" justifyContent="center" my={3}>
                  <CircularProgress />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </PageContainer>
  );
};

export default DebugAuthPage; 