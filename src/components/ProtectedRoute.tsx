import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="body1" color="text.secondary">
          載入中...
        </Typography>
      </Box>
    );
  }

  if (!currentUser) {
    // 記錄用戶嘗試訪問的路徑，登入後可以重定向回來
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
