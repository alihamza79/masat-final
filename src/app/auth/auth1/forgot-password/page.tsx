'use client';
import { Grid, Box, Card, Typography } from '@mui/material';
import PageContainer from '@/app/components/container/PageContainer';
import Logo from '@/app/(DashboardLayout)/layout/logo/Logo';
import ForgotPasswordFlow from '@/app/components/auth/ForgotPasswordFlow';
import { useRouter } from 'next/navigation';
import Image from "next/image";

const ForgotPassword = () => {
  const router = useRouter();

  const handleComplete = () => {
    router.push('/auth/auth1/login');
  };

  const handleCancel = () => {
    router.push('/auth/auth1/login');
  };

  return (
    <PageContainer title="Forgot Password" description="Recover your account password">
      <Grid
        container
        spacing={0}
        justifyContent="center"
        sx={{ height: '100vh' }}
      >
        <Grid
          item
          xs={12}
          sm={12}
          lg={7}
          xl={8}
          sx={{
            position: "relative",
            "&:before": {
              content: '""',
              background: "radial-gradient(#d2f1df, #d3d7fa, #bad8f4)",
              backgroundSize: "400% 400%",
              animation: "gradient 15s ease infinite",
              position: "absolute",
              height: "100%",
              width: "100%",
              opacity: "0.3",
            },
          }}
        >
          <Box position="relative">
            <Box px={3}>
              <Logo/>
            </Box>
            <Box
              alignItems="center"
              justifyContent="center"
              height={"calc(100vh - 75px)"}
              sx={{
                display: {
                  xs: "none",
                  lg: "flex",
                },
              }}
            >
              <Image
                src={"/images/backgrounds/login-bg.svg"}
                alt="bg"
                width={500}
                height={500}
                style={{
                  width: "100%",
                  maxWidth: "500px",
                  maxHeight: "500px",
                }}
              />
            </Box>
          </Box>
        </Grid>
        <Grid
          item
          xs={12}
          sm={12}
          lg={5}
          xl={4}
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          <Card sx={{ width: '100%', maxWidth: '500px', p: { xs: 2, sm: 4 } }}>
            <ForgotPasswordFlow
              onComplete={handleComplete}
              onCancel={handleCancel}
              variant="inside-modal"
            />
          </Card>
        </Grid>
      </Grid>
    </PageContainer>
  );
};

export default ForgotPassword;
