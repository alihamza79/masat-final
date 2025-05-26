'use client';

import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  CircularProgress, 
  Stack, 
  Grid, 
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface EnvironmentInfo {
  nextAuthUrl?: string;
  nodeEnv?: string;
  hasSecret: boolean;
  hasMongoUri: boolean;
  hasGoogleClientId: boolean;
  hasFacebookClientId: boolean;
  windowLocation?: string;
  userAgent?: string;
  buildTime: string;
  timestamp: string;
}

interface SystemInfo {
  browser: string;
  os: string;
  viewport: { width: number; height: number };
  timezone: string;
  language: string;
  cookiesEnabled: boolean;
  localStorageAvailable: boolean;
  sessionStorageAvailable: boolean;
}

export default function TestSession() {
  const { data: session, status, update } = useSession();
  const [apiSession, setApiSession] = useState<any>(null);
  const [environmentInfo, setEnvironmentInfo] = useState<EnvironmentInfo | null>(null);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authConfig, setAuthConfig] = useState<any>(null);
  const [serverAuthTest, setServerAuthTest] = useState<any>(null);
  const [credentialsTest, setCredentialsTest] = useState<any>(null);
  const [testEmail, setTestEmail] = useState('');
  const [testPassword, setTestPassword] = useState('');

  // Fetch environment info from API
  const fetchEnvironmentInfo = async () => {
    try {
      const response = await fetch('/api/debug/environment');
      if (response.ok) {
        const data = await response.json();
        setEnvironmentInfo(data);
      }
    } catch (err) {
      console.error('Failed to fetch environment info:', err);
    }
  };

  // Fetch auth configuration info
  const fetchAuthConfig = async () => {
    try {
      const response = await fetch('/api/debug/auth-config');
      if (response.ok) {
        const data = await response.json();
        setAuthConfig(data);
      }
    } catch (err) {
      console.error('Failed to fetch auth config:', err);
    }
  };

  // Test server-side authentication
  const testServerAuth = async () => {
    try {
      const response = await fetch('/api/auth/test-session');
      if (response.ok) {
        const data = await response.json();
        setServerAuthTest(data);
      }
    } catch (err) {
      console.error('Failed to test server auth:', err);
    }
  };

  // Test credentials authentication
  const testCredentials = async () => {
    if (!testEmail || !testPassword) {
      alert('Please enter email and password');
      return;
    }
    
    try {
      const response = await fetch('/api/debug/test-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, password: testPassword })
      });
      
      const data = await response.json();
      setCredentialsTest(data);
    } catch (err) {
      console.error('Failed to test credentials:', err);
      setCredentialsTest({ success: false, error: 'Network error' });
    }
  };

  // Gather system information
  const gatherSystemInfo = () => {
    const info: SystemInfo = {
      browser: navigator.userAgent.split(' ').pop() || 'Unknown',
      os: navigator.platform,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      cookiesEnabled: navigator.cookieEnabled,
      localStorageAvailable: typeof Storage !== 'undefined' && !!window.localStorage,
      sessionStorageAvailable: typeof Storage !== 'undefined' && !!window.sessionStorage
    };
    setSystemInfo(info);
  };

  // Fetch session directly from API
  const fetchSessionFromApi = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/session');
      const data = await response.json();
      setApiSession(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch session from API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionFromApi();
    fetchEnvironmentInfo();
    fetchAuthConfig();
    gatherSystemInfo();
    testServerAuth();
  }, []);

  const handleRefreshAll = () => {
    update();
    fetchSessionFromApi();
    fetchEnvironmentInfo();
    fetchAuthConfig();
    gatherSystemInfo();
    testServerAuth();
  };

  const handleClearSessionData = () => {
    // Clear local storage and session storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear cookies
    document.cookie.split(";").forEach(function(c) {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    // Refresh the page
    window.location.reload();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'authenticated': return 'success';
      case 'loading': return 'warning';
      case 'unauthenticated': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Authentication Debugging Dashboard
      </Typography>
      <Typography variant="body1" color="textSecondary" gutterBottom sx={{ mb: 3 }}>
        This page is publicly accessible for debugging authentication issues in both development and production environments.
      </Typography>
      
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleRefreshAll} 
          disabled={loading}
        >
          Refresh All Data
        </Button>
        
        <Button 
          variant="outlined" 
          color="info" 
          onClick={testServerAuth}
        >
          Test Server Auth
        </Button>
        
        <Button 
          variant="outlined" 
          color="error" 
          onClick={handleClearSessionData}
        >
          Clear Session Data
        </Button>
        
        {status === 'authenticated' && (
        <Button 
          variant="outlined" 
          onClick={() => signOut()}
        >
          Sign Out
        </Button>
        )}
        
        {status === 'unauthenticated' && (
          <Button 
            variant="contained" 
            color="secondary"
            onClick={() => window.location.href = '/auth/auth1/login'}
          >
            Go to Login
          </Button>
        )}
      </Stack>
      
      <Grid container spacing={3}>
        {/* Session Status Overview */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
              Authentication Status
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
              <Chip 
                label={`Status: ${status}`} 
                color={getStatusColor(status)} 
                variant="filled"
              />
              <Chip 
                label={session?.user?.email ? `User: ${session.user.email}` : 'No User'} 
                color={session ? 'success' : 'default'}
              />
              {status === 'unauthenticated' && (
                <Chip 
                  label="Public Debug Mode" 
                  color="info" 
                  variant="outlined"
                />
              )}
              <Typography variant="body2" color="textSecondary">
                Last Updated: {new Date().toLocaleTimeString()}
        </Typography>
            </Stack>
          </Paper>
        </Grid>

        {/* Environment Information */}
        <Grid item xs={12} md={6}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Environment Configuration</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {environmentInfo ? (
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell><strong>NODE_ENV</strong></TableCell>
                        <TableCell>{environmentInfo.nodeEnv || 'Not Set'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>NEXTAUTH_URL</strong></TableCell>
                        <TableCell>{environmentInfo.nextAuthUrl || 'Not Set'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>NEXTAUTH_SECRET</strong></TableCell>
                        <TableCell>
                          <Chip 
                            label={environmentInfo.hasSecret ? 'Present' : 'Missing'} 
                            color={environmentInfo.hasSecret ? 'success' : 'error'} 
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>MONGODB_URI</strong></TableCell>
                        <TableCell>
                          <Chip 
                            label={environmentInfo.hasMongoUri ? 'Present' : 'Missing'} 
                            color={environmentInfo.hasMongoUri ? 'success' : 'error'} 
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Google OAuth</strong></TableCell>
                        <TableCell>
                          <Chip 
                            label={environmentInfo.hasGoogleClientId ? 'Configured' : 'Missing'} 
                            color={environmentInfo.hasGoogleClientId ? 'success' : 'error'} 
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Facebook OAuth</strong></TableCell>
                        <TableCell>
                          <Chip 
                            label={environmentInfo.hasFacebookClientId ? 'Configured' : 'Missing'} 
                            color={environmentInfo.hasFacebookClientId ? 'success' : 'error'} 
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Build Time</strong></TableCell>
                        <TableCell>{environmentInfo.buildTime}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography>Loading environment info...</Typography>
              )}
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* System Information */}
        <Grid item xs={12} md={6}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">System Information</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {systemInfo ? (
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell><strong>Operating System</strong></TableCell>
                        <TableCell>{systemInfo.os}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Browser</strong></TableCell>
                        <TableCell>{systemInfo.browser}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Viewport</strong></TableCell>
                        <TableCell>{systemInfo.viewport.width} x {systemInfo.viewport.height}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Timezone</strong></TableCell>
                        <TableCell>{systemInfo.timezone}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Language</strong></TableCell>
                        <TableCell>{systemInfo.language}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Cookies</strong></TableCell>
                        <TableCell>
                          <Chip 
                            label={systemInfo.cookiesEnabled ? 'Enabled' : 'Disabled'} 
                            color={systemInfo.cookiesEnabled ? 'success' : 'error'} 
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Local Storage</strong></TableCell>
                        <TableCell>
                          <Chip 
                            label={systemInfo.localStorageAvailable ? 'Available' : 'Not Available'} 
                            color={systemInfo.localStorageAvailable ? 'success' : 'error'} 
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography>Loading system info...</Typography>
              )}
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Session Data */}
        <Grid item xs={12} md={6}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Session Data (useSession Hook)</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {status === 'unauthenticated' ? (
                <Box>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    No active session - user is not authenticated
        </Typography>
                  <Box 
                    component="pre" 
                    sx={{ 
                      bgcolor: '#f5f5f5', 
                      p: 2, 
                      borderRadius: 1,
                      overflow: 'auto',
                      maxHeight: 400,
                      fontSize: '0.75rem'
                    }}
                  >
                    {JSON.stringify({ status: 'unauthenticated', data: null }, null, 2)}
                  </Box>
                </Box>
              ) : (
        <Box 
          component="pre" 
          sx={{ 
            bgcolor: '#f5f5f5', 
            p: 2, 
            borderRadius: 1,
            overflow: 'auto',
                    maxHeight: 400,
                    fontSize: '0.75rem'
          }}
        >
          {JSON.stringify(session, null, 2)}
        </Box>
              )}
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* API Session Data */}
        <Grid item xs={12} md={6}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">API Session Data</Typography>
            </AccordionSummary>
            <AccordionDetails>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <Box 
            component="pre" 
            sx={{ 
              bgcolor: '#f5f5f5', 
              p: 2, 
              borderRadius: 1,
              overflow: 'auto',
                    maxHeight: 400,
                    fontSize: '0.75rem'
            }}
          >
            {JSON.stringify(apiSession, null, 2)}
          </Box>
        )}
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Auth Configuration */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Authentication Configuration</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {authConfig ? (
                <Box 
                  component="pre" 
                  sx={{ 
                    bgcolor: '#f5f5f5', 
                    p: 2, 
                    borderRadius: 1,
                    overflow: 'auto',
                    maxHeight: 400,
                    fontSize: '0.75rem'
                  }}
                >
                  {JSON.stringify(authConfig, null, 2)}
                </Box>
              ) : (
                <Typography>Loading auth configuration...</Typography>
              )}
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Server Authentication Test */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Server Authentication Test</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {serverAuthTest ? (
                <Box>
                  <Typography variant="body2" gutterBottom>
                    Server-side session check: {serverAuthTest.hasSession ? '✅ Active' : '❌ No Session'}
                  </Typography>
                  <Box 
                    component="pre" 
                    sx={{ 
                      bgcolor: '#f5f5f5', 
                      p: 2, 
                      borderRadius: 1,
                      overflow: 'auto',
                      maxHeight: 400,
                      fontSize: '0.75rem'
                    }}
                  >
                    {JSON.stringify(serverAuthTest, null, 2)}
                  </Box>
                </Box>
              ) : (
                <Typography>Click "Test Server Auth" to check server-side session...</Typography>
              )}
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Credentials Testing */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Credentials Authentication Test</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2}>
                <Typography variant="body2" color="textSecondary">
                  Test credentials authentication independently to debug session creation issues.
                </Typography>
                
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    label="Email"
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    size="small"
                    sx={{ minWidth: 200 }}
                  />
                  <TextField
                    label="Password"
                    type="password"
                    value={testPassword}
                    onChange={(e) => setTestPassword(e.target.value)}
                    size="small"
                    sx={{ minWidth: 200 }}
                  />
                  <Button 
                    variant="contained" 
                    onClick={testCredentials}
                    disabled={!testEmail || !testPassword}
                  >
                    Test Credentials
                  </Button>
                </Stack>

                {credentialsTest && (
                  <Box>
                    <Typography variant="body2" gutterBottom>
                      Credentials test: {credentialsTest.success ? '✅ Valid' : '❌ Failed'}
                    </Typography>
                    <Box 
                      component="pre" 
                      sx={{ 
                        bgcolor: '#f5f5f5', 
                        p: 2, 
                        borderRadius: 1,
                        overflow: 'auto',
                        maxHeight: 400,
                        fontSize: '0.75rem'
                      }}
                    >
                      {JSON.stringify(credentialsTest, null, 2)}
                    </Box>
                  </Box>
                )}
              </Stack>
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>
    </Box>
  );
} 