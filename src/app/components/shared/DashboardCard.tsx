import { useTheme } from '@mui/material/styles';
import { Card, CardContent, Typography, Stack, Box, SxProps, Theme } from '@mui/material';
import { useSelector } from '@/store/hooks';
import { AppState } from '@/store/store';
import { ReactNode } from 'react';

type Props = {
  title?: string | ReactNode;
  subtitle?: string;
  action?: JSX.Element | any;
  footer?: JSX.Element;
  cardheading?: string | JSX.Element;
  headtitle?: string | JSX.Element;
  headsubtitle?: string | JSX.Element;
  children?: JSX.Element;
  middlecontent?: string | JSX.Element;
  sx?: SxProps<Theme>;
};

const DashboardCard = ({
  title,
  subtitle,
  children,
  action,
  footer,
  cardheading,
  headtitle,
  headsubtitle,
  middlecontent,
  sx
}: Props) => {
  const customizer = useSelector((state: AppState) => state.customizer);

  const theme = useTheme();
  const borderColor = theme.palette.divider;

  return (
    <Card
      sx={{ 
        padding: 0, 
        border: !customizer.isCardShadow ? `1px solid ${borderColor}` : 'none',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        ...sx
      }}
      elevation={customizer.isCardShadow ? 9 : 0}
      variant={!customizer.isCardShadow ? 'outlined' : undefined}
    >
      {cardheading ? (
        <CardContent>
          <Typography variant="h5">{headtitle}</Typography>
          <Typography variant="subtitle2" color="textSecondary">
            {headsubtitle}
          </Typography>
        </CardContent>
      ) : (
        <CardContent sx={{p: "20px", flexGrow: 1, display: 'flex', flexDirection: 'column'}}>
          {title ? (
            <Stack
              direction="row"
              spacing={2}
              justifyContent="space-between"
              alignItems={'center'}
              mb={2}
            >
              <Box>
                {title ? <Typography variant="h5">{title}</Typography> : ''}

                {subtitle ? (
                  <Typography variant="subtitle2" color="textSecondary">
                    {subtitle}
                  </Typography>
                ) : (
                  ''
                )}
              </Box>
              {action}
            </Stack>
          ) : null}

          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          {children}
          </Box>
        </CardContent>
      )}

      {middlecontent}
      {footer}
    </Card>
  );
};

export default DashboardCard;
