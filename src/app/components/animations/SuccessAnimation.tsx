'use client';

import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Box } from '@mui/material';

interface SuccessAnimationProps {
  type?: 'confetti' | 'fireworks' | 'trophy';
  duration?: number;
  particleCount?: number;
}

const SuccessAnimation: React.FC<SuccessAnimationProps> = ({
  type = 'confetti',
  duration = 3000,
  particleCount = 200,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const confettiInstance = useRef<confetti.CreateTypes | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Create confetti instance
    confettiInstance.current = confetti.create(canvasRef.current, {
      resize: true,
      useWorker: true,
    });

    // Run the selected animation type
    switch (type) {
      case 'confetti':
        runConfetti();
        break;
      case 'fireworks':
        runFireworks();
        break;
      case 'trophy':
        runTrophy();
        break;
      default:
        runConfetti();
    }

    // Cleanup function
    return () => {
      if (confettiInstance.current) {
        confettiInstance.current.reset();
      }
    };
  }, [type, particleCount]);

  const runConfetti = () => {
    if (!confettiInstance.current) return;

    // Launch confetti from both sides with moderate intensity
    const end = Date.now() + duration;

    // Initial burst
    confettiInstance.current({
      particleCount: particleCount / 25,
      angle: 60,
      spread: 50,
      origin: { x: 0, y: 0.5 },
      colors: ['#26c6da', '#00d084', '#8ed1fc', '#0693e3', '#9b51e0'],
      gravity: 0.8,
      scalar: 0.8,
      ticks: 50
    });
    confettiInstance.current({
      particleCount: particleCount / 25,
      angle: 120,
      spread: 50,
      origin: { x: 1, y: 0.5 },
      colors: ['#26c6da', '#00d084', '#8ed1fc', '#0693e3', '#9b51e0'],
      gravity: 0.8,
      scalar: 0.8,
      ticks: 50
    });

    // Add a slightly bigger second burst after a short delay
    setTimeout(() => {
      if (!confettiInstance.current) return;
      
      confettiInstance.current({
        particleCount: particleCount / 30,
        angle: 90,
        spread: 70,
        origin: { x: 0.5, y: 0.5 },
        colors: ['#26c6da', '#00d084', '#8ed1fc', '#0693e3', '#9b51e0'],
        startVelocity: 15,
        gravity: 0.7,
        scalar: 0.7,
        ticks: 40
      });
    }, 300);
  };

  const runFireworks = () => {
    if (!confettiInstance.current) return;

    // Create fireworks effect
    const end = Date.now() + duration;

    (function frame() {
      confettiInstance.current!({
        particleCount: particleCount / 8,
        angle: 90,
        spread: 360,
        startVelocity: 30,
        decay: 0.9,
        gravity: 1,
        drift: 0,
        ticks: 60,
        shapes: ['circle', 'square'],
        origin: { x: Math.random(), y: Math.random() * 0.6 + 0.2 },
        colors: ['#ff0000', '#ffa500', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#ee82ee'],
      });

      if (Date.now() < end) {
        setTimeout(frame, 250);
      }
    })();
  };

  const runTrophy = () => {
    if (!confettiInstance.current) return;

    // Gold shower from the top
    const end = Date.now() + duration;

    (function frame() {
      confettiInstance.current!({
        particleCount: particleCount / 10,
        angle: 90,
        spread: 70,
        origin: { x: 0.5, y: 0 },
        colors: ['#FFD700', '#FFC000', '#FFDF00', '#F8D568'],
        shapes: ['star'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      />
    </Box>
  );
};

export default SuccessAnimation; 