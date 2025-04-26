'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Box,
  Menu,
  Avatar,
  Typography,
  Divider,
  Button,
  IconButton,
} from '@mui/material';
import * as dropdownData from './data';
import { useSession, signOut } from 'next-auth/react';
import { IconMail } from '@tabler/icons-react';
import { Stack } from '@mui/system';
import Image from 'next/image';

const Profile = () => {
  const { data, update: updateSession } = useSession();
  const [anchorEl2, setAnchorEl2] = useState(null);
  const hasTriedUpdate = useRef(false);
  
  // Extract the actual session data from the nested structure
  // Handle both standard NextAuth and our custom API response format
  const sessionData = data as any; // Cast to any to avoid TypeScript errors
  const session = sessionData?.session?.user ? sessionData.session : sessionData;
  
  // Try to update session once when component mounts
  useEffect(() => {
    // Only update if we don't have a session or if it's the default data
    // AND we haven't tried updating before
    if ((!session?.user?.name || session?.user?.name === 'User') && !hasTriedUpdate.current) {
      hasTriedUpdate.current = true;
      console.log('Attempting to update session...', data);
      updateSession();
    }
  }, [session, updateSession, data]);

  const handleClick2 = (event: any) => {
    setAnchorEl2(event.currentTarget);
  };
  
  const handleClose2 = () => {
    setAnchorEl2(null);
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/auth/auth1/login' });
  };

  // Use user data from session or fallback to defaults
  const userImage = session?.user?.image || null;
  const userName = session?.user?.name || "User";
  const userEmail = session?.user?.email || "user@example.com";
  const userRole = "User"; // Default role, can be expanded later
  
  // Add logging for debugging
  useEffect(() => {
    console.log('Profile component session data:', data);
    console.log('Extracted user data:', {
      image: userImage,
      name: userName,
      email: userEmail
    });
  }, [data, userImage, userName, userEmail]);
  
  // Get first letter of email for avatar if no image is available
  const getAvatarContent = () => {
    if (userImage) {
      return <Avatar src={userImage} alt={userName} sx={{ width: 35, height: 35 }} />;
    } else {
      const emailFirstLetter = userEmail.charAt(0).toUpperCase();
      return (
        <Avatar 
          sx={{ 
            width: 35, 
            height: 35, 
            bgcolor: 'primary.main',
            color: 'white',
          }}
        >
          {emailFirstLetter}
        </Avatar>
      );
    }
  };

  return (
    <Box>
      <IconButton
        aria-label="user profile"
        color="inherit"
        aria-controls="msgs-menu"
        aria-haspopup="true"
        sx={{
          ...(typeof anchorEl2 === 'object' && {
            color: 'primary.main',
          }),
        }}
        onClick={handleClick2}
      >
        {getAvatarContent()}
      </IconButton>
      {/* ------------------------------------------- */}
      {/* Message Dropdown */}
      {/* ------------------------------------------- */}
      <Menu
        id="msgs-menu"
        anchorEl={anchorEl2}
        keepMounted
        open={Boolean(anchorEl2)}
        onClose={handleClose2}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        sx={{
          '& .MuiMenu-paper': {
            width: '360px',
            p: 4,
          },
        }}
      >
        <Typography variant="h5">User Profile</Typography>
        <Stack direction="row" py={3} spacing={2} alignItems="center">
          {userImage ? (
            <Avatar src={userImage} alt={userName} sx={{ width: 95, height: 95 }} />
          ) : (
            <Avatar
              sx={{
                width: 95, 
                height: 95,
                bgcolor: 'primary.main',
                color: 'white',
                fontSize: '40px',
                fontWeight: 'bold'
              }}
            >
              {userEmail.charAt(0).toUpperCase()}
            </Avatar>
          )}
          <Box>
            <Typography variant="subtitle2" color="textPrimary" fontWeight={600}>
              {userName}
            </Typography>
           
            <Typography
              variant="subtitle2"
              color="textSecondary"
              display="flex"
              alignItems="center"
              gap={1}
            >
              <IconMail width={15} height={15} />
              {userEmail}
            </Typography>
          </Box>
        </Stack>
        <Divider />
        {dropdownData.profile.map((profile) => (
          <Box key={profile.title}>
            <Box sx={{ py: 2, px: 0 }} className="hover-text-primary">
              <Link href={profile.href}>
                <Stack direction="row" spacing={2}>
                  <Box
                    width="45px"
                    height="45px"
                    bgcolor="primary.light"
                    display="flex"
                    alignItems="center"
                    justifyContent="center" flexShrink="0"
                  >
                    <Avatar
                      src={profile.icon}
                      alt={profile.icon}
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: 0,
                      }}
                    />
                  </Box>
                  <Box>
                    <Typography
                      variant="subtitle2"
                      fontWeight={600}
                      color="textPrimary"
                      className="text-hover"
                      noWrap
                      sx={{
                        width: '240px',
                      }}
                    >
                      {profile.title}
                    </Typography>
                    <Typography
                      color="textSecondary"
                      variant="subtitle2"
                      sx={{
                        width: '240px',
                      }}
                      noWrap
                    >
                      {profile.subtitle}
                    </Typography>
                  </Box>
                </Stack>
              </Link>
            </Box>
          </Box>
        ))}
        <Box mt={2}>
          <Box bgcolor="primary.light" p={3} mb={3} overflow="hidden" position="relative">
            <Box display="flex" justifyContent="space-between">
              <Box>
                <Typography variant="h5" mb={2}>
                  Unlimited <br />
                  Access
                </Typography>
                <Button variant="contained" color="primary">
                  Upgrade
                </Button>
              </Box>
              <Image src={"/images/backgrounds/unlimited-bg.png"} width={150} height={183} style={{ height: 'auto', width: 'auto' }} alt="unlimited" className="signup-bg" />
            </Box>
          </Box>
          <Button onClick={handleLogout} variant="outlined" color="primary" fullWidth>
            Logout
          </Button>
        </Box>
      </Menu>
    </Box>
  );
};

export default Profile;
