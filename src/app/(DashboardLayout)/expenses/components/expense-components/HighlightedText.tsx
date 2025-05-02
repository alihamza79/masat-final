'use client';
import { Box } from '@mui/material';
import React from 'react';

// Add helper to highlight matched substrings in option text
const HighlightedText = ({ text, highlight }: { text: string, highlight: string }) => {
  if (!highlight) return <>{text}</>;
  
  const escapedHighlight = highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escapedHighlight})`, 'gi'));
  
  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <Box component="span" key={index} sx={{ backgroundColor: theme => theme.palette.warning.light, px: 0.5 }}>
            {part}
          </Box>
        ) : (
          part
        )
      )}
    </>
  );
};

export default HighlightedText; 