'use client';

import { Box, Avatar, Typography, IconButton, Tooltip, useMediaQuery } from '@mui/material';
import { useSelector } from '@/store/hooks';
import { IconPower } from '@tabler/icons-react';
import { AppState } from '@/store/store';
import { useSession, signOut } from 'next-auth/react';

export const Profile = () => {
  const customizer = useSelector((state: AppState) => state.customizer);
  const lgUp = useMediaQuery((theme: any) => theme.breakpoints.up('lg'));
  const hideMenu = lgUp ? customizer.isCollapse && !customizer.isSidebarHover : '';
  const { data: session } = useSession();

  // Use user data from session or fallback to defaults
  const userImage = session?.user?.image || null;
  const userName = session?.user?.name || "User";
  const userEmail = session?.user?.email || "user@example.com";
  const userRole = "User"; // Default role, can be expanded later

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
          {userImage ? (
            <Avatar alt={userName} src={userImage} sx={{height: 40, width: 40}} />
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
