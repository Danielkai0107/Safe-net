# Firebase Authentication 故障排除指南

## 🔴 問題：auth/network-request-failed

當您看到 `Firebase: Error (auth/network-request-failed)` 錯誤時，通常是以下原因之一：

---

## 📋 檢查清單

### ✅ 步驟 1：檢查 Firebase Authentication 是否已啟用

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 選擇您的專案
3. 在左側選單點擊 **Authentication**
4. 點擊 **Get Started**（如果還沒設置）
5. 在 **Sign-in method** 標籤中，確保 **Email/Password** 已啟用：
   - 點擊 **Email/Password**
   - 將 **Enable** 切換為開啟
   - 點擊 **Save**

**這是最常見的原因！如果您沒有啟用 Email/Password 登入方式，就會出現此錯誤。**

---

### ✅ 步驟 2：驗證環境變數設置

檢查您的 `.env` 或 `.env.local` 文件是否正確設置：

```bash
# 檢查這些環境變數
VITE_FIREBASE_API_KEY=AIza...（應該以 AIza 開頭）
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc...
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

#### 如何找到這些值：

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 選擇您的專案
3. 點擊左上角的齒輪圖標 ⚙️ → **Project settings**
4. 滾動到 **Your apps** 部分
5. 如果沒有 Web App，點擊 **Add app** → 選擇 Web（`</>`）圖標
6. 註冊您的 App（例如：community-guardian-web）
7. 複製 `firebaseConfig` 中的所有值到您的 `.env` 文件

#### 重要提示：

- 確保 `VITE_FIREBASE_AUTH_DOMAIN` 的格式是：`your-project-id.firebaseapp.com`
- **不要**包含 `https://`
- **不要**在最後加上 `/`

---

### ✅ 步驟 3：檢查授權網域

Firebase 需要您將開發網域添加到授權清單：

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 選擇您的專案
3. 在左側選單點擊 **Authentication**
4. 點擊 **Settings** 標籤
5. 滾動到 **Authorized domains** 部分
6. 確保以下網域已添加：
   - `localhost`（開發環境）
   - 您的部署網域（生產環境，例如：your-app.web.app）

如果 `localhost` 不在清單中，點擊 **Add domain** 添加它。

---

### ✅ 步驟 4：重新啟動開發伺服器

修改環境變數後，必須重新啟動開發伺服器：

```bash
# 停止當前的伺服器（Ctrl+C）
# 然後重新啟動
npm run dev
```

---

### ✅ 步驟 5：清除瀏覽器緩存

有時瀏覽器會緩存舊的配置：

1. 打開開發者工具（F12）
2. 右鍵點擊重新整理按鈕
3. 選擇「清除緩存並強制重新整理」
4. 或者使用無痕模式測試

---

### ✅ 步驟 6：使用診斷工具

我已經在登入頁面添加了診斷工具。打開瀏覽器的 Console（F12），您應該會看到：

```
=== Firebase 配置檢查 ===
✅ apiKey: AIzaSyC...
✅ authDomain: your-project.firebaseapp.com
✅ projectId: your-project
...
=========================
```

檢查是否有任何 ❌ 或 ⚠️  標記。

---

## 🛠️ 快速修復步驟

如果您還沒有正確設置，請按照以下步驟操作：

### 1. 複製環境變數範本

```bash
cp env.example.txt .env.local
```

### 2. 從 Firebase Console 獲取配置

前往 Firebase Console → Project Settings → Your apps → SDK setup and configuration

### 3. 更新 .env.local

將所有 `your_*` 替換為實際值：

```bash
VITE_FIREBASE_API_KEY=AIzaSyC...（您的實際 API Key）
VITE_FIREBASE_AUTH_DOMAIN=community-guardian-123.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=community-guardian-123
VITE_FIREBASE_STORAGE_BUCKET=community-guardian-123.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abc123def456
VITE_FIREBASE_MEASUREMENT_ID=G-ABC123DEF4
```

### 4. 在 Firebase Console 啟用 Email/Password Authentication

**這一步非常重要！**

1. Firebase Console → Authentication → Get Started
2. Sign-in method 標籤 → Email/Password → Enable → Save

### 5. 重新啟動開發伺服器

```bash
npm run dev
```

### 6. 創建測試管理員帳號

在 Firebase Console → Authentication → Users → Add user

```
Email: admin@test.com
Password: Test123456!
```

### 7. 測試登入

訪問 `http://localhost:5173/login` 並使用上面創建的帳號登入。

---

## 📞 還是不行？

如果按照以上步驟操作後仍然失敗，請檢查：

### 檢查 Firebase 專案狀態

1. 確認您的 Firebase 專案處於活躍狀態
2. 確認您的 Google Cloud 帳單已設置（即使使用免費方案）
3. 檢查 Firebase Console 是否顯示任何警告或錯誤

### 檢查網絡連接

在瀏覽器 Console 中運行：

```javascript
fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=YOUR_API_KEY')
  .then(res => console.log('Firebase Auth API 可訪問'))
  .catch(err => console.error('無法連接到 Firebase Auth API:', err));
```

### 檢查防火牆/代理

某些公司網絡或 VPN 可能會阻止對 Firebase 的訪問。嘗試：
- 關閉 VPN
- 使用手機熱點測試
- 檢查防火牆設置

---

## 🎯 測試環境配置範例

以下是一個完整的測試環境配置範例：

```bash
# .env.local
VITE_FIREBASE_API_KEY=AIzaSyBdVl-coCViP-lIy8i4X6F0EZxVzYh-G2Q
VITE_FIREBASE_AUTH_DOMAIN=community-guardian-dev.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=community-guardian-dev
VITE_FIREBASE_STORAGE_BUCKET=community-guardian-dev.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abc123def456ghi789
VITE_FIREBASE_MEASUREMENT_ID=G-ABC123DEF4

# LINE Configuration (目前不影響登入)
VITE_LIFF_ID=your_liff_id

# API Configuration
VITE_API_ENDPOINT=https://us-central1-community-guardian-dev.cloudfunctions.net/receiveSignal
```

---

## ✅ 成功檢查點

當一切正常時，您應該能夠：

1. ✅ 訪問 `/login` 頁面
2. ✅ 在 Console 看到所有 Firebase 配置項都是 ✅
3. ✅ 輸入帳號密碼後能夠成功登入
4. ✅ 登入後被重定向到 `/admin` 頁面
5. ✅ 在右上角看到您的用戶名和登出按鈕

---

## 📚 相關資源

- [Firebase Authentication 文檔](https://firebase.google.com/docs/auth)
- [Firebase Console](https://console.firebase.google.com/)
- [Vite 環境變數文檔](https://vitejs.dev/guide/env-and-mode.html)

---

**最後提醒：記得在修改 `.env` 文件後重新啟動開發伺服器！** 🚀
