'use client'

import PageContainer from '@/app/components/container/PageContainer';
import { Alert, Box, CardContent, CircularProgress, Divider, Grid, Tab, Tabs, Typography } from '@mui/material';
import { useSession } from 'next-auth/react';
import * as React from 'react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

// Import our custom hook
import { useUserProfile } from '@/hooks/useUserProfile';

// components
import AccountTab from '@/app/components/pages/account-setting/AccountTab';
import SecurityTab from '@/app/components/pages/account-setting/SecurityTab';
import BlankCard from '@/app/components/shared/BlankCard';
import { IconLock, IconUserCircle, IconReceipt } from '@tabler/icons-react';

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
  const { t } = useTranslation();
  
  // Define breadcrumb with translations
  const BCrumb = [
    {
      to: '/',
      title: t('common.home'),
    },
    {
      title: t('accountSettings.title'),
    },
  ];

  // Use our custom hook to get user profile data with caching
  const { 
    userData, 
    companyData, 
    isLoading, 
    error, 
    updateProfile, 
    refreshUserProfile 
  } = useUserProfile();

  // Determine if security tab should be shown (only for users with credentials linked)
  const canChangePassword = userData?.credentialsLinked === true;

  // Reset tab selection if security tab is hidden and user was on it
  useEffect(() => {
    if (!canChangePassword && value === 1) {
      setValue(0);
    }
  }, [canChangePassword, value]);

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
    <PageContainer title={t('accountSettings.title')} description={t('accountSettings.pageDescription')}>
<Grid container spacing={3}>
          <Grid item xs={12}>
            <Box 
              display="flex" 
              alignItems="center" 
              justifyContent="space-between" 
              mb={3}
              flexDirection={{ xs: 'column', sm: 'row' }}
              gap={2}
            >
              <Typography 
                variant="h2" 
                sx={{ 
                  fontSize: { xs: '1.5rem', md: 'h2.fontSize' },
                  textAlign: { xs: 'center', sm: 'left' },
                  width: '100%'
                }}
              >
                {t('accountSettings.title')}
              </Typography>
            </Box>
          </Grid>
        </Grid>
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
                  label={t('accountSettings.tabNames.account')}
                  {...a11yProps(0)}
                />

                {canChangePassword && (
                <Tab
                  iconPosition="start"
                  icon={<IconLock size="22" />}
                  label={t('accountSettings.tabNames.security')}
                  {...a11yProps(1)}
                />
                )}

                <Tab
                  iconPosition="start"
                  icon={<IconReceipt size="22" />}
                  label={t('accountSettings.tabNames.bills')}
                  {...a11yProps(canChangePassword ? 2 : 1)}
                />
              </Tabs>
            </Box>
            <Divider />
            <CardContent>
              {isLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" p={3}>
                  <CircularProgress />
                  <Typography ml={2}>{t('accountSettings.loadingProfile')}</Typography>
                </Box>
              ) : error ? (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error instanceof Error ? error.message : t('accountSettings.loadingError')}
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
                  
                  {canChangePassword && (
                  <TabPanel value={value} index={1}>
                    <SecurityTab userData={userData} />
                  </TabPanel>
                  )}
                  
                  <TabPanel value={value} index={canChangePassword ? 2 : 1}>
                    <Box py={4} display="flex" flexDirection="column" alignItems="center">
                      <Typography variant="h4" mb={2}>
                        {t('accountSettings.bills.noInvoicesTitle', 'No invoices yet')}
                      </Typography>
                      <Typography variant="body1" color="textSecondary" align="center" maxWidth={450}>
                        {t('accountSettings.bills.noInvoicesDescription', 'Your billing information and invoice history will appear here once available.')}
                      </Typography>
                    </Box>
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
