'use client';

import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Box, Typography, Button, Paper, CircularProgress, Stack } from '@mui/material';

export default function TestSession() {
  const { data: session, status, update } = useSession();
  const [apiSession, setApiSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  }, []);

  const handleRefreshSession = () => {
    update();
    fetchSessionFromApi();
  };

  const handleClearSessionData = () => {
    // Clear local storage and session storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear cookies (this is a bit of a hacky approach but works for testing)
    document.cookie.split(";").forEach(function(c) {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    // Refresh the page
    window.location.reload();
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>Session Debugging Page</Typography>
      
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleRefreshSession} 
          disabled={loading}
        >
          Refresh Session Data
        </Button>
        
        <Button 
          variant="outlined" 
          color="error" 
          onClick={handleClearSessionData}
        >
          Clear Local Session Data
        </Button>
        
        <Button 
          variant="outlined" 
          onClick={() => signOut()}
        >
          Sign Out
        </Button>
      </Stack>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Session Status: <strong>{status}</strong>
        </Typography>
        
        <Typography variant="subtitle1" gutterBottom>
          React useSession() Hook Data:
        </Typography>
        
        <Box 
          component="pre" 
          sx={{ 
            bgcolor: '#f5f5f5', 
            p: 2, 
            borderRadius: 1,
            overflow: 'auto',
            maxHeight: 300
          }}
        >
          {JSON.stringify(session, null, 2)}
        </Box>
      </Paper>
      
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Direct API Session Data:
        </Typography>
        
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
              maxHeight: 300
            }}
          >
            {JSON.stringify(apiSession, null, 2)}
          </Box>
        )}
      </Paper>
    </Box>
  );
} 