import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Login } from "./admin/pages/Login";
import { FirebaseTest } from "./admin/pages/FirebaseTest";
import { AdminDashboard } from "./admin/pages/AdminDashboard";
import { TenantManagement } from "./admin/pages/TenantManagement";
import { ElderManagement } from "./admin/pages/ElderManagement";
import { DeviceManagement } from "./admin/pages/DeviceManagement";
import { GatewayManagement } from "./admin/pages/GatewayManagement";
import { TestingTools } from "./admin/pages/TestingTools";
import { LiffApp } from "./liff/pages/LiffApp";
import "./index.css";

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

// Simple Home Page
const HomePage: React.FC = () => {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 4,
        p: 4,
      }}
    >
      <Box textAlign="center">
        <Typography
          variant="h2"
          component="h1"
          fontWeight={700}
          color="white"
          gutterBottom
        >
          🏘️ Community Guardian SaaS
        </Typography>
        <Typography variant="h5" color="white" sx={{ opacity: 0.9 }}>
          B2B2C 物聯網社區守護系統
        </Typography>
      </Box>

      <Button
        component={Link}
        to="/login"
        variant="contained"
        size="large"
        sx={{
          bgcolor: "white",
          color: "primary.main",
          px: 6,
          py: 2,
          fontSize: "1.1rem",
          fontWeight: 600,
          "&:hover": {
            bgcolor: "rgba(255, 255, 255, 0.9)",
            transform: "scale(1.05)",
          },
          transition: "all 0.3s",
        }}
      >
        管理員登入
      </Button>
    </Box>
  );
};

export default App;
