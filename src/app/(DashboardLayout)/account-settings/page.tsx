'use client'

import Breadcrumb from '@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb';
import PageContainer from '@/app/components/container/PageContainer';
import { Box, CardContent, Divider, Grid, Tab, Tabs, CircularProgress, Alert } from '@mui/material';
import * as React from 'react';
import { useState } from 'react';
import { useSession } from 'next-auth/react';

// Import our custom hook
import { useUserProfile } from '@/hooks/useUserProfile';

// components
import AccountTab from '@/app/components/pages/account-setting/AccountTab';
import SecurityTab from '@/app/components/pages/account-setting/SecurityTab';
import BlankCard from '@/app/components/shared/BlankCard';
import { IconArticle, IconBell, IconLock, IconUserCircle } from '@tabler/icons-react';
const BCrumb = [
  {
    to: '/',
    title: 'Home',
  },
  {
    title: 'Account Setting',
  },
];

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

const AccountSetting = () => {
  const [value, setValue] = useState(0);
  const { data: session, update } = useSession();
  
  // Use our custom hook to get user profile data with caching
  const { 
    userData, 
    companyData, 
    isLoading, 
    error, 
    updateProfile, 
    refreshUserProfile 
  } = useUserProfile();

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  // Handler for when data is updated in any tab
  const handleDataUpdate = (data: any) => {
    // Update the cache and session
    updateProfile(data);
    
    // If the update includes user data we need to update next-auth session
    if (data.name || data.profileImage) {
      if (session) {
        update({
          ...session,
          user: {
            ...session.user,
            name: data.name || session.user.name,
            image: userData?.image || session.user.image
          }
        });
      }
    }
  };

  return (
    <PageContainer title="Account Setting" description="this is Account Setting">

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <BlankCard>
            <Box sx={{ maxWidth: { xs: 320, sm: 480 } }}>
              <Tabs
                value={value}
                onChange={handleChange}
                scrollButtons="auto"
                aria-label="basic tabs example"
              >
                <Tab
                  iconPosition="start"
                  icon={<IconUserCircle size="22" />}
                  label="Account"
                  {...a11yProps(0)}
                />

                <Tab
                  iconPosition="start"
                  icon={<IconLock size="22" />}
                  label="Security"
                  {...a11yProps(1)}
                />

                <Tab
                  iconPosition="start"
                  icon={<IconArticle size="22" />}
                  label="Bills"
                  {...a11yProps(2)}
                />
              </Tabs>
            </Box>
            <Divider />
            <CardContent>
              {isLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error instanceof Error ? error.message : 'Failed to load user data'}
                </Alert>
              ) : (
                <>
                  <TabPanel value={value} index={0}>
                    <AccountTab 
                      userData={userData} 
                      companyData={companyData} 
                      onDataUpdate={handleDataUpdate}
                      sessionUpdate={update}
                    />
                  </TabPanel>
                  <TabPanel value={value} index={1}>
                    <SecurityTab userData={userData} />
                  </TabPanel>
                  <TabPanel value={value} index={2}>
                  </TabPanel>
                </>
              )}
            </CardContent>
          </BlankCard>
        </Grid>
      </Grid>
    </PageContainer>
  );
};

export default AccountSetting;
