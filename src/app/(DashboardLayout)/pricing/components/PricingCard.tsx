'use client';

import React from 'react';
import {
  CardContent,
  Typography,
  Box,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  CircularProgress,
  Badge,
} from '@mui/material';
import { useTheme, styled } from '@mui/material/styles';
import { IconCheck, IconX } from '@tabler/icons-react';
import BlankCard from '@/app/components/shared/BlankCard';
import Image from 'next/image';

interface PricingRule {
  limit: boolean;
  title: string;
}

interface PricingCardProps {
  id: number;
  package: string;
  monthlyplan: number;
  yearlyplan: number;
  avatar: string;
  badge: boolean;
  btntext: string;
  rules: PricingRule[];
  isCurrentPlan: boolean;
  buttonText: string;
  loading: string | null;
  showYearly: boolean;
  onSubscribe: (plan: string) => void;
}

const PricingCard: React.FC<PricingCardProps> = (props) => {
  const {
    id,
    package: packageName,
    monthlyplan,
    yearlyplan,
    avatar,
    badge,
    rules,
    isCurrentPlan,
    buttonText,
    loading,
    showYearly,
    onSubscribe
  } = props;

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

  const yearlyPrice = (price: number) => {
    if (price === 0) return 'Free';
    return price;
  };

  return (
    <BlankCard sx={isCurrentPlan ? { border: `2px solid ${theme.palette.success.main}` } : {}}>
      <CardContent sx={{ p: '30px' }}>
        {badge ? <StyledChip label="Popular" size="small"></StyledChip> : null}

        <Typography
          variant="subtitle1"
          fontSize="12px"
          mb={3}
          color="textSecondary"
          textTransform="uppercase"
        >
          {packageName}
        </Typography>
        <Image src={avatar} alt={avatar} width={90} height={90} />
        <Box my={4}>
          {monthlyplan === 0 ? (
            <Box fontSize="50px" mt={5} fontWeight="600">
              Free
            </Box>
          ) : (
            <Box display="flex">
              <Typography variant="h6" mr="8px" mt="-12px">
                €
              </Typography>
              {showYearly ? (
                <>
                  <Typography fontSize="48px" fontWeight="600">
                    {yearlyPrice(yearlyplan)}
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
                    {monthlyplan}
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
            {rules.map((rule, i) => (
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
          variant={isCurrentPlan ? "outlined" : "contained"}
          size="large"
          color={isCurrentPlan ? "success" : "primary"}
          onClick={() => onSubscribe(packageName)}
          disabled={loading === packageName || (isCurrentPlan && buttonText === 'Current Plan')}
        >
          {loading === packageName ? (
            <CircularProgress size={24} />
          ) : (
            buttonText
          )}
        </Button>
      </CardContent>
    </BlankCard>
  );
};

export default PricingCard; 