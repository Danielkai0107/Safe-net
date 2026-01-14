import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  TextField,
  Button,
  Alert,
  InputAdornment,
  IconButton,
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
    <div className="login-page">
      <div className="container container--sm">
        <div className="login-page__container">
          {/* Logo and Title */}
          <div className="login-page__header">
            <div className="login-page__icon">
              <AdminPanelSettings sx={{ fontSize: 36 }} />
            </div>
            <h1 className="login-page__title">超級後台登入</h1>
            <p className="login-page__subtitle">
              Community Guardian SaaS 管理系統
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="login-page__alert">
              <Alert severity="error" onClose={() => setError("")}>
                {error}
              </Alert>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="login-page__form">
            <TextField
              label="電子郵件"
              type="email"
              fullWidth
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
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

            <div className="login-page__submit">
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                startIcon={<LockOutlined />}
              >
                {loading ? "登入中..." : "登入"}
              </Button>
            </div>
          </form>

          {/* Additional Info */}
          <div className="text-center mt-6">
            <p className="text-caption">請使用您的管理員帳號登入</p>
          </div>
        </div>

        {/* Back to Home Link */}
        <div className="text-center mt-4">
          <Button
            variant="text"
            onClick={() => navigate("/")}
            sx={{
              color: "gray",
            }}
          >
            返回首頁
          </Button>
        </div>
      </div>
    </div>
  );
};
