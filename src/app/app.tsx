"use client";
import React from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeSettings } from "@/utils/theme/Theme";
import { useSelector } from 'react-redux';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import { AppState } from "@/store/store";
import "@/utils/i18n";
import "@/app/api/index";


const MyApp = ({ children }: { children: React.ReactNode }) => {
    const theme = ThemeSettings();
    const customizer = useSelector((state: AppState) => state.customizer);

    return (
        <>
            <AppRouterCacheProvider options={{ enableCssLayer: true }}>
                <ThemeProvider theme={theme}>
                        <CssBaseline />
                        {children}
                </ThemeProvider>
            </AppRouterCacheProvider>
        </>
    );
};

export default MyApp;
