import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  InputAdornment,
  IconButton,
  Avatar,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  LockOutlined,
  AdminPanelSettings,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import { checkFirebaseConfig } from "../../utils/firebaseCheck";

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 獲取用戶嘗試訪問的路徑，登入後重定向
  const from = (location.state as any)?.from?.pathname || "/admin";

  // 如果已經登入，重定向到目標頁面
  useEffect(() => {
    if (currentUser) {
      navigate(from, { replace: true });
    }
  }, [currentUser, navigate, from]);

  // 在開發模式下檢查 Firebase 配置
  useEffect(() => {
    if (import.meta.env.DEV) {
      checkFirebaseConfig();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError("請輸入電子郵件和密碼");
      return;
    }

    try {
      setError("");
      setLoading(true);
      await signIn(email, password);
      // 登入成功後會自動重定向（通過上面的 useEffect）
    } catch (error: any) {
      // console.error('登入錯誤:', error);

      // 根據錯誤代碼顯示不同的錯誤訊息
      switch (error.code) {
        case "auth/invalid-email":
          setError("無效的電子郵件格式");
          break;
        case "auth/user-disabled":
          setError("此帳號已被停用");
          break;
        case "auth/user-not-found":
          setError("找不到此帳號");
          break;
        case "auth/wrong-password":
          setError("密碼錯誤");
          break;
        case "auth/invalid-credential":
          setError("電子郵件或密碼錯誤");
          break;
        case "auth/too-many-requests":
          setError("登入嘗試次數過多，請稍後再試");
          break;
        case "auth/network-request-failed":
          setError(
            "網絡連接失敗。請檢查：1) 網絡連接 2) Firebase 配置是否正確 3) Firebase Authentication 是否已啟用"
          );
          break;
        default:
          setError(`登入失敗: ${error.message || error.code}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={24}
          sx={{
            p: 4,
            borderRadius: 2,
          }}
        >
          {/* Logo and Title */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Avatar
              sx={{
                width: 64,
                height: 64,
                bgcolor: "primary.main",
                mb: 2,
              }}
            >
              <AdminPanelSettings sx={{ fontSize: 36 }} />
            </Avatar>
            <Typography
              variant="h4"
              component="h1"
              fontWeight={700}
              gutterBottom
            >
              超級後台登入
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
            >
              Community Guardian SaaS 管理系統
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            <TextField
              label="電子郵件"
              type="email"
              fullWidth
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
              sx={{ mb: 2 }}
              disabled={loading}
            />

            <TextField
              label="密碼"
              type={showPassword ? "text" : "password"}
              fullWidth
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              sx={{ mb: 3 }}
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="切換密碼可見性"
                      onClick={handleTogglePasswordVisibility}
                      edge="end"
                      disabled={loading}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              startIcon={<LockOutlined />}
              sx={{
                py: 1.5,
                fontWeight: 600,
                fontSize: "1rem",
              }}
            >
              {loading ? "登入中..." : "登入"}
            </Button>
          </form>

          {/* Additional Info */}
          <Box sx={{ mt: 3, textAlign: "center" }}>
            <Typography variant="caption" color="text.secondary">
              請使用您的管理員帳號登入
            </Typography>
          </Box>
        </Paper>

        {/* Back to Home Link */}
        <Box sx={{ mt: 2, textAlign: "center" }}>
          <Button
            variant="text"
            onClick={() => navigate("/")}
            sx={{
              color: "white",
              "&:hover": {
                bgcolor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            返回首頁
          </Button>
        </Box>
      </Container>
    </Box>
  );
};
