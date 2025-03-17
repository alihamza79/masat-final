'use client'
import { useSelector } from "@/store/hooks";
import Link from "next/link";
import { styled } from "@mui/material/styles";
import { AppState } from "@/store/store";
import Image from "next/image";

const Logo = () => {
  const customizer = useSelector((state: AppState) => state.customizer);
  const LinkStyled = styled(Link)(() => ({
    height: customizer.TopbarHeight,
    width: customizer.isCollapse ? "40px" : "180px",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: customizer.isCollapse ? "center" : "flex-start",
  }));

  // Single logo for both light and dark mode
  return (
    <LinkStyled href="/">
      <Image
        src="/images/logos/masat-logo.png"
        alt="Masat Logo"
        height={customizer.isCollapse ? 35 : 40}
        width={customizer.isCollapse ? 35 : 120}
        priority
        style={{
          maxWidth: '100%',
          height: 'auto',
          objectFit: 'contain'
        }}
      />
    </LinkStyled>
  );
};

export default Logo;
