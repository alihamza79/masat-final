'use client';
import { Grid, Skeleton, Box } from '@mui/material';
import PageContainer from '@/app/components/container/PageContainer';

const Loading = () => {
  return (
    <PageContainer>
      <Box>
        <Grid container spacing={3}>
          {/* Summary Cards Loading */}
          <Grid item xs={12}>
            <Grid container spacing={3}>
              {[1, 2, 3, 4].map((item) => (
                <Grid item xs={12} sm={6} lg={3} key={item}>
                  <Skeleton variant="rectangular" height={120} />
                </Grid>
              ))}
            </Grid>
          </Grid>

          {/* Chart Loading */}
          <Grid item xs={12}>
            <Skeleton variant="rectangular" height={400} />
          </Grid>

          {/* Table Loading */}
          <Grid item xs={12}>
            <Skeleton variant="rectangular" height={400} />
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  );
};

export default Loading; 