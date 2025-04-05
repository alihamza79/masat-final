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
  const userImage = session?.user?.image || "/images/profile/user-1.jpg";
  const userName = session?.user?.name || "User";
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
          <Avatar alt={userName} src={userImage} sx={{height: 40, width: 40}} />

          <Box>
            <Typography variant="h6">{userName}</Typography>
            <Typography variant="caption">{userRole}</Typography>
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
