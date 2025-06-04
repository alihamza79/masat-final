'use client';

import React, { useEffect, useState } from 'react';
import { Box, keyframes, styled } from '@mui/material';
import { IconTrophy } from '@tabler/icons-react';

interface TrophyAnimationProps {
  size?: number;
  color?: string;
  duration?: number;
}

// Define animations
const pulse = keyframes`
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

const rotate = keyframes`
  0% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(10deg);
  }
  75% {
    transform: rotate(-10deg);
  }
  100% {
    transform: rotate(0deg);
  }
`;

const glow = keyframes`
  0% {
    box-shadow: 0 0 5px 2px rgba(255, 215, 0, 0.3);
  }
  50% {
    box-shadow: 0 0 20px 10px rgba(255, 215, 0, 0.6);
  }
  100% {
    box-shadow: 0 0 5px 2px rgba(255, 215, 0, 0.3);
  }
`;

const StyledTrophy = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  animation: `${pulse} 0.5s ease-out forwards, ${rotate} 0.5s ease-in-out 0.5s, ${glow} 2s infinite 1s`,
  borderRadius: '50%',
  padding: theme.spacing(2),
  backgroundColor: 'rgba(255, 215, 0, 0.1)',
}));

const TrophyAnimation: React.FC<TrophyAnimationProps> = ({
  size = 80,
  color = '#FFD700',
  duration = 3000,
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Hide the trophy after the specified duration
    if (duration !== Infinity) {
      const timer = setTimeout(() => {
        setVisible(false);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  if (!visible) return null;

  return (
    <Box
      sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      <StyledTrophy>
        <IconTrophy size={size} color={color} stroke={1.5} />
      </StyledTrophy>
    </Box>
  );
};

export default TrophyAnimation; 