import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Button } from "./components/Button";
import { Login } from "./admin/pages/Login";
import { FirebaseTest } from "./admin/pages/FirebaseTest";
import { AdminDashboard } from "./admin/pages/AdminDashboard";
import { TenantManagement } from "./admin/pages/TenantManagement";
import { ElderManagement } from "./admin/pages/ElderManagement";
import { DeviceManagement } from "./admin/pages/DeviceManagement";
import { GatewayManagement } from "./admin/pages/GatewayManagement";
import { TestingTools } from "./admin/pages/TestingTools";
import { LiffApp } from "./liff/pages/LiffApp";

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
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate("/login");
  };

  return (
    <div className="home-page">
      <div className="home-page__content">
        <h1 className="home-page__title">Community Guardian SaaS</h1>
        <h2 className="home-page__subtitle">B2B2C 物聯網社區守護系統</h2>
      </div>

      <Button variant="primary" size="lg" onClick={handleLogin}>
        管理員登入
      </Button>
    </div>
  );
};

export default App;
