'use client';
import { styled } from '@mui/material';

const MainWrapper = styled('div')(() => ({
  display: 'flex',
  minHeight: '100vh',
  width: '100%',
}));

const PageWrapper = styled('div')(() => ({
  display: 'flex',
  flexGrow: 1,
  paddingBottom: '60px',
  flexDirection: 'column',
  zIndex: 1,
  backgroundColor: 'transparent',
}));

export default function ExpensesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MainWrapper className="mainwrapper">
      <PageWrapper className="page-wrapper">{children}</PageWrapper>
    </MainWrapper>
  );
} 