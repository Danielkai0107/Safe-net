import React from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

interface LoadingSpinnerProps {
  size?: number;
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 40,
  text = '載入中...',
}) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      p={4}
    >
      <CircularProgress size={size} />
      {text && (
        <Typography variant="body2" color="text.secondary" mt={2}>
          {text}
        </Typography>
      )}
    </Box>
  );
};
