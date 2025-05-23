'use client'
import CustomSocialButton from "@/app/components/forms/theme-elements/CustomSocialButton";
import { Avatar, Box, CircularProgress } from "@mui/material";
import { Stack } from "@mui/system";
import { signIn } from "next-auth/react";
import { useState } from "react";

interface Props {
  title: string;
  rememberDevice?: boolean;
}

const AuthSocialButtons = ({ title, rememberDevice = true }: Props) => {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      await signIn('google', { callbackUrl: '/', remember: rememberDevice });
    } catch (error) {
      console.error('Google sign in error:', error);
      setGoogleLoading(false);
      throw error;
    }
  };

  const handleFacebookSignIn = async () => {
    try {
      setFacebookLoading(true);
      await signIn('facebook', { callbackUrl: '/', remember: rememberDevice });
    } catch (error) {
      console.error('Facebook sign in error:', error);
      setFacebookLoading(false);
      throw error;
    }
  };

  return (
    <>
      <Stack direction="row" justifyContent="center" spacing={2} mt={3}>
        <CustomSocialButton onClick={handleGoogleSignIn} disabled={googleLoading}>
          {googleLoading ? (
            <CircularProgress size={24} sx={{ mr: 1 }} />
          ) : (
            <Avatar
              src={"/images/svgs/google-icon.svg"}
              alt={"icon1"}
              sx={{
                width: 16,
                height: 16,
                borderRadius: 0,
                mr: 1,
              }}
            />
          )}
          <Box
            sx={{
              display: { xs: "none", sm: "flex" },
              whiteSpace: "nowrap",
              mr: { sm: "3px" },
            }}
          >
            {title}{" "}
          </Box>{" "}
          Google
        </CustomSocialButton>
        <CustomSocialButton onClick={handleFacebookSignIn} disabled={facebookLoading}>
          {facebookLoading ? (
            <CircularProgress size={24} sx={{ mr: 1 }} />
          ) : (
            <Avatar
              src={"/images/svgs/facebook-icon.svg"}
              alt={"icon2"}
              sx={{
                width: 25,
                height: 25,
                borderRadius: 0,
                mr: 1,
              }}
            />
          )}
          <Box
            sx={{
              display: { xs: "none", sm: "flex" },
              whiteSpace: "nowrap",
              mr: { sm: "3px" },
            }}
          >
            {title}{" "}
          </Box>{" "}
          FB
        </CustomSocialButton>
      </Stack>
    </>
  );
};

export default AuthSocialButtons;
