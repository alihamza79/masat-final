'use client'

import React from 'react';
import {
  Grid,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Button,
  CardContent,
  ListItemIcon,
  Chip,
  Switch,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { styled } from '@mui/material/styles';
import Breadcrumb from '@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb';
import PageContainer from '@/app/components/container/PageContainer';

import { IconCheck, IconX } from '@tabler/icons-react';
import BlankCard from '@/app/components/shared/BlankCard';
import Image from 'next/image';


const BCrumb = [
  {
    to: '/',
    title: 'Home',
  },
  {
    title: 'Pricing',
  },
];

const pricing = [
  {
    id: 1,
    package: 'Free',
    plan: 'Free',
    monthlyplan: 0,
    yearlyplan: 0,
    avatar: "/images/backgrounds/silver.png",
    badge: false,
    btntext: 'Choose Free Plan',
    rules: [
      {
        limit: true,
        title: 'Learning & Training',
      },
      {
        limit: false,
        title: '24/7 Customer Support',
      },
      {
        limit: true,
        title: 'Limited eMAG API Integration',
      },
      {
        limit: true,
        title: 'Access to Community',
      },
      {
        limit: true,
        title: 'Limited Access to Masat Tools',
      },
      {
        limit: true,
        title: '1 API Integration',
      },
      {
        limit: true,
        title: 'PxL Calculator (5 calcs/day)',
      },
      {
        limit: false,
        title: 'Expenses Management',
      },
    ],
  },
  {
    id: 2,
    package: 'Premium',
    monthlyplan: 9,
    yearlyplan: 97,
    avatar: "/images/backgrounds/bronze.png",
    badge: true,
    btntext: 'Choose Premium',
    rules: [
      {
        limit: true,
        title: 'Learning & Training',
      },
      {
        limit: true,
        title: '24/7 Customer Support',
      },
      {
        limit: true,
        title: 'Limited eMAG API Integration',
      },
      {
        limit: true,
        title: 'Access to Community',
      },
      {
        limit: true,
        title: 'Limited Access to Masat Tools',
      },
      {
        limit: true,
        title: '4 API Integrations',
      },
      {
        limit: true,
        title: 'Unlimited PxL Calculations',
      },
      {
        limit: true,
        title: 'Early Bird Access to New Features',
      },
    ],
  },
  {
    id: 3,
    package: 'Professional',
    monthlyplan: 19,
    yearlyplan: 193,
    avatar: "/images/backgrounds/gold.png",
    badge: false,
    btntext: 'Choose Professional',
    rules: [
      {
        limit: true,
        title: 'Learning & Training',
      },
      {
        limit: true,
        title: '24/7 Customer Support',
      },
      {
        limit: true,
        title: 'Full eMAG API Integration',
      },
      {
        limit: true,
        title: 'Access to Community',
      },
      {
        limit: true,
        title: 'Full Access to Masat Tools',
      },
      {
        limit: true,
        title: '6 API Integrations',
      },
      {
        limit: true,
        title: 'Expenses Management',
      },
      {
        limit: true,
        title: 'VIP Access to New Features',
      },
    ],
  },
];

const Pricing = () => {
  const [show, setShow] = React.useState(false);

  const yearlyPrice = (a: any) => {
    if (a === 0) return 'Free';
    return a;
  };

  const theme = useTheme();
  const warninglight = theme.palette.warning.light;
  const warning = theme.palette.warning.main;


  const StyledChip = styled(Chip)({
    position: 'absolute',
    top: '15px',
    right: '30px',
    backgroundColor: warninglight,
    color: warning,
    textTransform: 'uppercase',
    fontSize: '11px',
  });

  return (
    <PageContainer title="Pricing" description="this is Pricing">
      {/* breadcrumb */}
      <Breadcrumb title="Pricing" items={BCrumb} />
      {/* end breadcrumb */}

      <Grid container spacing={3} justifyContent="center" mt={3}>
        <Grid item xs={12} sm={10} lg={8} textAlign="center">
          <Typography variant="h2">
            Flexible Plans Tailored to Fit Your Business Needs
          </Typography>
          <Box display="flex" alignItems="center" mt={3} justifyContent="center">
            <Typography variant="subtitle1">Monthly</Typography>
            <Switch onChange={() => setShow(!show)} />
            <Typography variant="subtitle1">Yearly</Typography>
          </Box>
        </Grid>
      </Grid>
      <Grid container spacing={3} mt={5}>
        {pricing.map((price, i) => (
          <Grid item xs={12} lg={4} sm={6} key={i}>
            <BlankCard>
              <CardContent sx={{ p: '30px' }}>
                {price.badge ? <StyledChip label="Popular" size="small"></StyledChip> : null}

                <Typography
                  variant="subtitle1"
                  fontSize="12px"
                  mb={3}
                  color="textSecondary"
                  textTransform="uppercase"
                >
                  {price.package}
                </Typography>
                <Image src={price.avatar} alt={price.avatar} width={90} height={90} />
                <Box my={4}>
                  {price.monthlyplan === 0 ? (
                    <Box fontSize="50px" mt={5} fontWeight="600">
                      Free
                    </Box>
                  ) : (
                    <Box display="flex">
                      <Typography variant="h6" mr="8px" mt="-12px">
                        €
                      </Typography>
                      {show ? (
                        <>
                          <Typography fontSize="48px" fontWeight="600">
                            {yearlyPrice(price.yearlyplan)}
                          </Typography>
                          <Typography
                            fontSize="15px"
                            fontWeight={400}
                            ml={1}
                            color="textSecondary"
                            mt={1}
                          >
                            /yr
                          </Typography>
                        </>
                      ) : (
                        <>
                          <Typography fontSize="48px" fontWeight="600">
                            {price.monthlyplan}
                          </Typography>
                          <Typography
                            fontSize="15px"
                            fontWeight={400}
                            ml={1}
                            color="textSecondary"
                            mt={1}
                          >
                            /mo
                          </Typography>
                        </>
                      )}
                    </Box>
                  )}
                </Box>

                <Box mt={3}>
                  <List>
                    {price.rules.map((rule, i) => (
                      <Box key={i}>
                        {rule.limit ? (
                          <>
                            <ListItem disableGutters>
                              <ListItemIcon sx={{ color: 'primary.main', minWidth: '32px' }}>
                                <IconCheck width={18} />
                              </ListItemIcon>
                              <ListItemText>{rule.title}</ListItemText>
                            </ListItem>
                          </>
                        ) : (
                          <ListItem disableGutters sx={{ color: 'grey.400' }}>
                            <ListItemIcon sx={{ color: 'grey.400', minWidth: '32px' }}>
                              <IconX width={18} />
                            </ListItemIcon>
                            <ListItemText>{rule.title}</ListItemText>
                          </ListItem>
                        )}
                      </Box>
                    ))}
                  </List>
                </Box>

                <Button
                  sx={{ width: '100%', mt: 3 }}
                  variant="contained"
                  size="large"
                  color="primary"
                >
                  {price.btntext}
                </Button>
              </CardContent>
            </BlankCard>
          </Grid>
        ))}
      </Grid>
    </PageContainer>
  );
};

export default Pricing; 