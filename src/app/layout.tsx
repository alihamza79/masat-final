import React from "react";
import { Providers as ReduxProviders } from "@/store/providers";
import MyApp from "./app";
import "./global.css";
import { Inter } from 'next/font/google';
import { Providers } from '@/providers/Providers';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: "Masat",
  description: "Masat",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ReduxProviders>
          <Providers>
            <MyApp>{children}</MyApp>
            <Toaster position="top-right" />
          </Providers>
        </ReduxProviders>
      </body>
    </html>
  );
}
