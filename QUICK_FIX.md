# 快速修復指南

## 🚨 立即修復 Firebase Analytics 錯誤

### 問題
您的 `.env` 文件中 `VITE_FIREBASE_MEASUREMENT_ID` 包含了中文字，導致錯誤。

### 解決步驟

#### 1. 取得正確的 Measurement ID

前往 Firebase Console 取得：
https://console.firebase.google.com/project/safe-net-test/settings/general/

找到「您的應用程式」→ Web 應用程式 → 複製 `measurementId`

格式應該是：`G-XXXXXXXXXX`（G- 開頭加上字母數字）

#### 2. 創建或編輯 .env 文件

在專案根目錄（與 package.json 同層）創建 `.env` 文件：

```bash
cd /Users/danielkai/Desktop/community-guardian-saas

# 創建 .env 文件
cat > .env << 'EOF'
VITE_FIREBASE_API_KEY=AIzaSyC...
VITE_FIREBASE_AUTH_DOMAIN=safe-net-test.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=safe-net-test
VITE_FIREBASE_STORAGE_BUCKET=safe-net-test.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_LIFF_ID=your_liff_id
VITE_API_ENDPOINT=https://us-central1-safe-net-test.cloudfunctions.net/receiveSignal
EOF
```

**替換為您的實際值！**

#### 3. 重新啟動開發伺服器

```bash
# 停止當前伺服器（按 Ctrl+C）

# 重新啟動
npm run dev
```

### ✅ 驗證修復

重新整理瀏覽器，錯誤應該消失。

---

## 📋 aria-hidden 警告

這個警告已經修復（添加了 `disableEnforceFocus`），重新整理頁面即可。

---

## 🔍 如果還有問題

查看完整排查指南：`TROUBLESHOOTING.md`
