'use client';

import React, { useState, useEffect } from 'react';
import SuccessAnimation from './SuccessAnimation';
import TrophyAnimation from './TrophyAnimation';
import { Box, Typography, Fade } from '@mui/material';

interface CelebrationEffectProps {
  type?: 'confetti' | 'fireworks' | 'trophy' | 'complete';
  message?: string;
  duration?: number;
  onComplete?: () => void;
}

const CelebrationEffect: React.FC<CelebrationEffectProps> = ({
  type = 'complete',
  message = 'Congratulations!',
  duration = 4000,
  onComplete,
}) => {
  const [showMessage, setShowMessage] = useState(true);
  const [showTrophy, setShowTrophy] = useState(type === 'trophy' || type === 'complete');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowMessage(false);
      if (onComplete) {
        onComplete();
      }
    }, duration);
    
    return () => clearTimeout(timer);
  }, [duration, onComplete]);
  
  return (
    <>
      {/* Confetti or Fireworks Animation */}
      {(type === 'confetti' || type === 'fireworks' || type === 'complete') && (
        <SuccessAnimation 
          type={type === 'complete' ? 'confetti' : type} 
          duration={duration} 
          particleCount={type === 'complete' ? 300 : 200}
        />
      )}
      
      {/* Trophy Animation */}
      {showTrophy && (
        <TrophyAnimation 
          size={100} 
          duration={type === 'complete' ? duration / 2 : duration}
        />
      )}
      
      {/* Congratulatory Message */}
      {showMessage && (
        <Fade in={showMessage} timeout={500}>
          <Box
            sx={{
              position: 'fixed',
              top: '30%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 10000,
              textAlign: 'center',
              pointerEvents: 'none',
            }}
          >
            <Typography
              variant="h2"
              sx={{
                fontWeight: 'bold',
                color: '#FFD700',
                textShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
                mb: 2,
              }}
            >
              {message}
            </Typography>
          </Box>
        </Fade>
      )}
    </>
  );
};

export default CelebrationEffect; 