import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import SecurityIcon from '@mui/icons-material/Security';
import GroupsIcon from '@mui/icons-material/Groups';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './admin/pages/Login';
import { FirebaseTest } from './admin/pages/FirebaseTest';
import { AdminDashboard } from './admin/pages/AdminDashboard';
import { TenantManagement } from './admin/pages/TenantManagement';
import { ElderManagement } from './admin/pages/ElderManagement';
import { DeviceManagement } from './admin/pages/DeviceManagement';
import { GatewayManagement } from './admin/pages/GatewayManagement';
import { TestingTools } from './admin/pages/TestingTools';
import { LiffApp } from './liff/pages/LiffApp';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Login Route */}
          <Route path="/login" element={<Login />} />
          
          {/* Firebase Test Route (for debugging) */}
          <Route path="/firebase-test" element={<FirebaseTest />} />
          
          {/* Protected Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/tenants"
            element={
              <ProtectedRoute>
                <TenantManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/elders"
            element={
              <ProtectedRoute>
                <ElderManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/devices"
            element={
              <ProtectedRoute>
                <DeviceManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/gateways"
            element={
              <ProtectedRoute>
                <GatewayManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/testing"
            element={
              <ProtectedRoute>
                <TestingTools />
              </ProtectedRoute>
            }
          />
          
          {/* LIFF Routes */}
          <Route path="/liff/*" element={<LiffApp />} />
          
          {/* Home/Landing Page */}
          <Route path="/" element={<HomePage />} />
          
          {/* Redirect unknown routes to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

// Simple Home Page to navigate between Admin and LIFF
const HomePage: React.FC = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        <Box textAlign="center" mb={8}>
          <Typography variant="h2" component="h1" fontWeight={700} color="white" gutterBottom>
            🏘️ Community Guardian SaaS
          </Typography>
          <Typography variant="h5" color="white" sx={{ opacity: 0.9 }}>
            B2B2C 物聯網社區守護系統
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Admin Portal Card */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card
              elevation={8}
              sx={{
                height: '100%',
                transition: 'all 0.3s',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: 16,
                },
              }}
            >
              <CardActionArea component={Link} to="/admin" sx={{ height: '100%' }}>
                <CardContent sx={{ p: 4 }}>
                  <Avatar
                    sx={{
                      width: 64,
                      height: 64,
                      bgcolor: 'primary.main',
                      mb: 3,
                    }}
                  >
                    <SecurityIcon sx={{ fontSize: 32 }} />
                  </Avatar>
                  <Typography variant="h4" fontWeight={600} gutterBottom>
                    超級後台
                  </Typography>
                  <Typography variant="body1" color="text.secondary" paragraph>
                    系統管理員專用控制面板，包含硬體模擬器、數據分析等功能。
                  </Typography>
                  <Box display="flex" alignItems="center" color="primary.main" fontWeight={600}>
                    進入後台
                    <ArrowForwardIcon sx={{ ml: 1 }} />
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>

          {/* LIFF Portal Card */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card
              elevation={8}
              sx={{
                height: '100%',
                transition: 'all 0.3s',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: 16,
                },
              }}
            >
              <CardActionArea component={Link} to="/liff" sx={{ height: '100%' }}>
                <CardContent sx={{ p: 4 }}>
                  <Avatar
                    sx={{
                      width: 64,
                      height: 64,
                      bgcolor: 'success.main',
                      mb: 3,
                    }}
                  >
                    <GroupsIcon sx={{ fontSize: 32 }} />
                  </Avatar>
                  <Typography variant="h4" fontWeight={600} gutterBottom>
                    客戶端 LIFF
                  </Typography>
                  <Typography variant="body1" color="text.secondary" paragraph>
                    里長專用 LINE LIFF 介面，即時查看社區長者狀態與警報。
                  </Typography>
                  <Box display="flex" alignItems="center" color="success.main" fontWeight={600}>
                    進入 LIFF
                    <ArrowForwardIcon sx={{ ml: 1 }} />
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        </Grid>

        {/* Tech Stack Info */}
        <Card sx={{ mt: 6, bgcolor: 'rgba(255,255,255,0.95)' }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              🛠️ Tech Stack
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {['React', 'TypeScript', 'Vite', 'Firebase', 'Material UI', 'Zustand', 'React Router', 'LINE LIFF'].map((tech) => (
                <Chip key={tech} label={tech} />
              ))}
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default App;
