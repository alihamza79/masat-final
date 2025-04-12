'use client'
import CustomSocialButton from "@/app/components/forms/theme-elements/CustomSocialButton";
import { Stack } from "@mui/system";
import { Avatar, Box, CircularProgress } from "@mui/material";
import { signInType } from "@/app/(DashboardLayout)/types/auth/auth";

interface AuthSocialButtonsProps extends signInType {
  onGoogleSignIn?: () => void;
  onFacebookSignIn?: () => void;
  googleLoading?: boolean;
  facebookLoading?: boolean;
}

const AuthSocialButtons = ({ 
  title, 
  onGoogleSignIn, 
  onFacebookSignIn,
  googleLoading = false,
  facebookLoading = false
}: AuthSocialButtonsProps) => {
  return (
    <>
      <Stack direction="row" justifyContent="center" spacing={2} mt={3}>
        <CustomSocialButton 
          onClick={onGoogleSignIn} 
          disabled={googleLoading}
        >
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
        <CustomSocialButton 
          onClick={onFacebookSignIn} 
          disabled={facebookLoading}
        >
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
