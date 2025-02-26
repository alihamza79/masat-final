"use client";
import PageContainer from "@/app/components/container/PageContainer";
import Box from "@mui/material/Box";
// components

import { Typography } from "@mui/material";

export default function Dashboard() {
  return (
    <PageContainer title="Dashboard" description="this is Dashboard">
      <Box mt={3}>
        <Typography variant="h1">Dashboard</Typography>
      </Box>
    </PageContainer>
  );
}
