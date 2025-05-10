'use client';

import { Box, Avatar, Typography, IconButton, Tooltip, useMediaQuery } from '@mui/material';
import { useSelector } from '@/store/hooks';
import { IconPower } from '@tabler/icons-react';
import { AppState } from '@/store/store';
import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import axios from 'axios';

export const Profile = () => {
  const customizer = useSelector((state: AppState) => state.customizer);
  const lgUp = useMediaQuery((theme: any) => theme.breakpoints.up('lg'));
  const hideMenu = lgUp ? customizer.isCollapse && !customizer.isSidebarHover : '';
  const { data, status, update } = useSession();
  
  // Add state to store fresh user data from API
  const [userData, setUserData] = useState<any>(null);
  
  // Fetch fresh user data directly from API
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get('/api/user/profile');
        if (response.data.success) {
          // console.log('Profile sidebar - Fresh user data:', response.data.data.user);
          setUserData(response.data.data.user);
          
          // Update session with fresh data - removed to prevent loops
          // We'll let the AccountTab handle session updates
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };
    
    fetchUserProfile();
    // Only run this effect once on mount, not on every data change
  }, []);

  // Extract the actual session data from the nested structure
  const sessionData = data as any; // Cast to any to avoid TypeScript errors
  const session = sessionData?.session?.user ? sessionData.session : sessionData;

  // console.log("Sidebar Profile - Session data:", data);
  // console.log("Sidebar Profile - Extracted session:", session);
  // console.log("Sidebar Profile - Fresh userData:", userData);
  // console.log("Sidebar Profile - Status:", status);

  // Prefer the fresh userData over session data when available
  const userImage = userData?.image || session?.user?.image || null;
  const userName = userData?.name || session?.user?.name || "User";
  const userEmail = userData?.email || session?.user?.email || "user@example.com";
  
  // Log the image source for debugging
  // console.log("Sidebar Profile - Using image source:", userImage);

  // Format the image URL correctly - if it's an S3 path, use the image API
  const formattedUserImage = userImage ? 
    (userImage.startsWith('http') ? 
      userImage : 
      `/api/image?path=${encodeURIComponent(userImage)}`) 
    : null;
    
  // console.log("Sidebar Profile - Formatted image URL:", formattedUserImage);

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/auth/auth1/login' });
  };

  return (
    <Box
      display={'flex'}
      alignItems="center"
      gap={2}
      sx={{ m: 3, p: 2, bgcolor: `${'secondary.light'}` }}
    >
      {!hideMenu ? (
        <>
          {formattedUserImage ? (
            <Avatar 
              key={formattedUserImage}
              alt={userName} 
              src={formattedUserImage} 
              sx={{height: 40, width: 40}} 
            />
          ) : (
            <Avatar 
              sx={{ 
                height: 40, 
                width: 40, 
                bgcolor: 'primary.main',
                color: 'white',
              }}
            >
              {userEmail.charAt(0).toUpperCase()}
            </Avatar>
          )}

          <Box>
            <Typography variant="h6">{userName}</Typography>
          </Box>
          <Box sx={{ ml: 'auto' }}>
            <Tooltip title="Logout" placement="top">
              <IconButton
                color="primary"
                onClick={handleLogout}
                aria-label="logout"
                size="small"
              >
                <IconPower size="20" />
              </IconButton>
            </Tooltip>
          </Box>
        </>
      ) : (
        ''
      )}
    </Box>
  );
};
