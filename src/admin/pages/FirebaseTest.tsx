import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  TextField,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
} from '@mui/material';
import { checkFirebaseConfig } from '../../utils/firebaseCheck';
import { auth } from '../../lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

export const FirebaseTest: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [testResult, setTestResult] = useState<string>('');
  const [testStatus, setTestStatus] = useState<'success' | 'error' | 'info'>('info');

  const config = checkFirebaseConfig();

  const testConnection = async () => {
    setTestResult('正在測試連接到 Firebase...');
    setTestStatus('info');

    try {
      // 測試 1: 檢查 Auth 物件
      if (!auth) {
        setTestResult('❌ Firebase Auth 物件未初始化');
        setTestStatus('error');
        return;
      }

      // 測試 2: 檢查配置
      const authSettings = auth.config;
      console.log('Auth Settings:', authSettings);

      // 測試 3: 嘗試連接到 Firebase Auth API
      const testUrl = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${config.apiKey}`;
      const response = await fetch(testUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (response.ok || response.status === 400) {
        // 400 是預期的，因為我們沒有提供有效的請求體
        setTestResult(`✅ 成功連接到 Firebase Auth API\n\nAuth Domain: ${config.authDomain}\nProject ID: ${config.projectId}\n\n現在請在下方輸入您在 Firebase Console 創建的帳號來測試登入。`);
        setTestStatus('success');
      } else {
        setTestResult(`⚠️ 連接到 Firebase Auth API 失敗\n狀態碼: ${response.status}\n請檢查網絡連接和 API Key`);
        setTestStatus('error');
      }
    } catch (error: any) {
      setTestResult(`❌ 測試失敗: ${error.message}\n\n可能原因：\n1. 網絡連接問題\n2. Firebase API Key 不正確\n3. 防火牆或代理阻止連接`);
      setTestStatus('error');
    }
  };

  const testLogin = async () => {
    if (!email || !password) {
      setTestResult('請輸入電子郵件和密碼');
      setTestStatus('error');
      return;
    }

    setTestResult('正在測試登入...');
    setTestStatus('info');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setTestResult(`✅ 登入成功！\n\n用戶 ID: ${userCredential.user.uid}\n電子郵件: ${userCredential.user.email}\n\n登入功能正常！您可以前往 /login 頁面使用了。`);
      setTestStatus('success');
    } catch (error: any) {
      let errorMessage = `❌ 登入失敗\n\n錯誤代碼: ${error.code}\n錯誤訊息: ${error.message}\n\n`;

      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage += '原因：找不到此用戶\n解決方法：請在 Firebase Console → Authentication → Users 創建此帳號';
          break;
        case 'auth/wrong-password':
          errorMessage += '原因：密碼錯誤\n解決方法：請檢查密碼或在 Firebase Console 重設密碼';
          break;
        case 'auth/invalid-credential':
          errorMessage += '原因：無效的憑證（帳號或密碼錯誤）\n解決方法：\n1. 確認帳號已在 Firebase Console 創建\n2. 確認密碼正確';
          break;
        case 'auth/network-request-failed':
          errorMessage += '原因：網絡請求失敗\n解決方法：\n1. 檢查 Firebase Console → Authentication → Sign-in method 是否已啟用 Email/Password\n2. 檢查網絡連接\n3. 檢查 authDomain 配置是否正確';
          break;
        case 'auth/operation-not-allowed':
          errorMessage += '⚠️⚠️⚠️ 重要！\n原因：Email/Password 登入方式未啟用\n解決方法：\n1. 前往 Firebase Console\n2. 點擊 Authentication\n3. 點擊 Sign-in method 標籤\n4. 點擊 Email/Password\n5. 啟用第一個開關（Email/Password）\n6. 點擊 Save';
          break;
        default:
          errorMessage += '請查看上面的錯誤代碼並參考 FIREBASE_AUTH_TROUBLESHOOTING.md';
      }

      setTestResult(errorMessage);
      setTestStatus('error');
      console.error('登入錯誤詳情:', error);
    }
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="md">
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom fontWeight={600}>
            🔧 Firebase Authentication 診斷工具
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            此頁面可以幫助您診斷 Firebase Authentication 的配置問題
          </Typography>

          <Divider sx={{ my: 3 }} />

          {/* 配置檢查 */}
          <Box mb={4}>
            <Typography variant="h6" gutterBottom>
              1️⃣ 環境變數配置
            </Typography>
            <List dense>
              {Object.entries(config).map(([key, value]) => (
                <ListItem key={key}>
                  <ListItemText
                    primary={key}
                    secondary={value || '未設置'}
                    secondaryTypographyProps={{
                      sx: { fontFamily: 'monospace', fontSize: '0.85rem' },
                    }}
                  />
                  <Chip
                    label={value && !value.includes('your_') ? '✅' : '❌'}
                    size="small"
                    color={value && !value.includes('your_') ? 'success' : 'error'}
                  />
                </ListItem>
              ))}
            </List>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* 連接測試 */}
          <Box mb={4}>
            <Typography variant="h6" gutterBottom>
              2️⃣ 測試 Firebase 連接
            </Typography>
            <Button variant="contained" onClick={testConnection} fullWidth>
              測試連接到 Firebase
            </Button>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* 登入測試 */}
          <Box mb={4}>
            <Typography variant="h6" gutterBottom>
              3️⃣ 測試登入功能
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              輸入您在 Firebase Console 創建的管理員帳號
            </Typography>
            <TextField
              label="電子郵件"
              type="email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 2 }}
              placeholder="admin@test.com"
            />
            <TextField
              label="密碼"
              type="password"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 2 }}
              placeholder="Test123456!"
            />
            <Button variant="contained" onClick={testLogin} fullWidth>
              測試登入
            </Button>
          </Box>

          {/* 測試結果 */}
          {testResult && (
            <Alert
              severity={testStatus}
              sx={{
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                fontSize: '0.9rem',
              }}
            >
              {testResult}
            </Alert>
          )}

          <Divider sx={{ my: 3 }} />

          {/* 快速檢查清單 */}
          <Box>
            <Typography variant="h6" gutterBottom>
              ✅ 檢查清單
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText
                  primary="1. Firebase Console → Authentication → Get Started（如果是第一次）"
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="2. Firebase Console → Authentication → Sign-in method → 啟用 Email/Password"
                  primaryTypographyProps={{ variant: 'body2', fontWeight: 600, color: 'error.main' }}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="3. Firebase Console → Authentication → Users → Add user（創建測試帳號）"
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="4. Firebase Console → Authentication → Settings → Authorized domains → 確認 localhost 已添加"
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
            </List>
          </Box>

          <Box mt={3}>
            <Button variant="outlined" href="/login" fullWidth>
              前往登入頁面
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};
