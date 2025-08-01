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
import axios from 'axios';
import { useTranslation } from 'react-i18next';

const Profile = () => {
  const { t } = useTranslation();
  const { data, update: updateSession } = useSession();
  const [anchorEl2, setAnchorEl2] = useState(null);
  const hasTriedUpdate = useRef(false);
  // Add state for fresh user data
  const [userData, setUserData] = useState<any>(null);
  
  // Extract the actual session data from the nested structure
  const sessionData = data as any; // Cast to any to avoid TypeScript errors
  const session = sessionData?.session?.user ? sessionData.session : sessionData;
  
  // Fetch fresh user data directly from API
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get('/api/user/profile');
        if (response.data.success) {
          // console.log('Header Profile - Fresh user data:', response.data.data.user);
          setUserData(response.data.data.user);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };
    
    fetchUserProfile();
  }, []);
  
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

  // Prefer fresh data from API over session data
  const userImage = userData?.image || session?.user?.image || null;
  const userName = userData?.name || session?.user?.name || "User";
  const userEmail = userData?.email || session?.user?.email || "user@example.com";
  
  // Format image URL correctly for S3 paths
  const formattedUserImage = userImage ? 
    (userImage.startsWith('http') ? 
      userImage : 
      `/api/image?path=${encodeURIComponent(userImage)}`) 
    : null;
  
  // Add logging for debugging
  // useEffect(() => {
  //   console.log('Header Profile - Session data:', data);
  //   console.log('Header Profile - Fresh userData:', userData);
  //   console.log('Header Profile - Using image:', userImage);
  //   console.log('Header Profile - Formatted image URL:', formattedUserImage);
  // }, [data, userData, userImage, formattedUserImage]);
  
  // Get first letter of email for avatar if no image is available
  const getAvatarContent = () => {
    if (formattedUserImage) {
      return (
        <Avatar 
          key={formattedUserImage} 
          src={formattedUserImage} 
          alt={userName} 
          sx={{ width: 35, height: 35 }} 
        />
      );
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

  // Modified profile data with translations and correct paths
  const profileItems = [
    {
      title: t('profile.myAccount'),
      subtitle: t('profile.accountSettings'),
      href: '/account-settings',
      icon: dropdownData.profile[0].icon
    },
    {
      title: t('profile.integrations'),
      subtitle: t('profile.emagIntegrations'),
      href: dropdownData.profile[1].href,
      icon: dropdownData.profile[1].icon
    },
    {
      title: t('profile.subscriptions'),
      subtitle: t('profile.paymentsAndSubscriptions'),
      href: dropdownData.profile[2].href,
      icon: dropdownData.profile[2].icon
    }
  ];

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
        <Typography variant="h5">{t('profile.userProfile')}</Typography>
        <Stack direction="row" py={3} spacing={2} alignItems="center">
          {formattedUserImage ? (
            <Avatar 
              key={formattedUserImage} 
              src={formattedUserImage} 
              alt={userName} 
              sx={{ width: 95, height: 95 }} 
            />
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
        {profileItems.map((profile) => (
          <Box key={profile.title}>
            <Box sx={{ py: 2, px: 0 }} className="hover-text-primary">
              <Link href={profile.href} onClick={handleClose2}>
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
                  {t('profile.unlimitedAccess')}
                </Typography>
                <Button variant="contained" color="primary" onClick={handleClose2}>
                  {t('profile.upgrade')}
                </Button>
              </Box>
              <Image src={"/images/backgrounds/unlimited-bg.png"} width={150} height={183} style={{ height: 'auto', width: 'auto' }} alt="unlimited" className="signup-bg" />
            </Box>
          </Box>
          <Button onClick={() => { handleClose2(); handleLogout(); }} variant="outlined" color="primary" fullWidth>
            {t('profile.logout')}
          </Button>
        </Box>
      </Menu>
    </Box>
  );
};

export default Profile;
