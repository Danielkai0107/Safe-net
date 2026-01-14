# 常見問題排查

## Firebase Analytics 錯誤

### 錯誤訊息
```
Failed to construct 'Headers': String contains non ISO-8859-1 code point.
Failed to fetch this Firebase app's measurement ID from the server.
```

### 原因
環境變數 `VITE_FIREBASE_MEASUREMENT_ID` 包含了中文字或無效字符。

### 解決方法

#### 步驟 1: 取得正確的 Measurement ID

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 選擇您的專案
3. 點擊左側「專案設定」（齒輪圖示）
4. 在「一般」分頁中找到「您的應用程式」
5. 找到 Web 應用程式
6. 複製 `measurementId`（格式：`G-XXXXXXXXXX`）

#### 步驟 2: 更新 .env 文件

在專案根目錄創建或編輯 `.env` 文件：

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyC...
VITE_FIREBASE_AUTH_DOMAIN=safe-net-test.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=safe-net-test
VITE_FIREBASE_STORAGE_BUCKET=safe-net-test.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX  # ← 替換為實際的 ID

# LINE Configuration
VITE_LIFF_ID=your_liff_id

# API Configuration
VITE_API_ENDPOINT=https://us-central1-safe-net-test.cloudfunctions.net/receiveSignal
```

**重要：**
- 不要包含中文字或註釋
- 確保格式為 `G-` 開頭加上字母數字

#### 步驟 3: 重新啟動開發伺服器

```bash
# 停止當前伺服器（Ctrl+C）
# 重新啟動
npm run dev
```

### 臨時解決方案（如果不使用 Analytics）

如果您暫時不需要 Google Analytics，可以停用它：

**修改 `src/lib/firebase.ts`：**

```typescript
// Initialize Analytics (optional, only works in browser)
export const analytics = 
  typeof window !== 'undefined' && 
  import.meta.env.VITE_FIREBASE_MEASUREMENT_ID && 
  import.meta.env.VITE_FIREBASE_MEASUREMENT_ID.startsWith('G-')
    ? getAnalytics(app) 
    : null;
```

## aria-hidden 可訪問性警告

### 錯誤訊息
```
Blocked aria-hidden on an element because its descendant retained focus.
```

### 原因
當 Modal 打開時，Material-UI 會將 `#root` 設為 `aria-hidden="true"`，但內部的按鈕仍保持焦點。

### 解決方法

這是一個常見的 Material-UI Modal 行為，通常不影響功能。

#### 方法 1: 更新 Modal 組件（推薦）

修改 `src/components/Modal.tsx`：

```typescript
import Modal from '@mui/material/Modal';
import Fade from '@mui/material/Fade';

// 添加 disableEnforceFocus 屬性
<Modal
  open={isOpen}
  onClose={onClose}
  closeAfterTransition
  disableEnforceFocus  // ← 添加這個
  sx={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }}
>
  {/* Modal content */}
</Modal>
```

#### 方法 2: 忽略警告（如果不影響使用）

這個警告主要影響螢幕閱讀器使用者，如果您的目標用戶不包含視障人士，可以暫時忽略。

### 驗證修復

重新整理頁面後，警告應該消失。

## 其他常見問題

### 問題：開發伺服器無法啟動

**檢查：**
```bash
# 檢查 node_modules 是否存在
ls node_modules

# 如果不存在，重新安裝
npm install
```

### 問題：Cloud Functions 部署失敗

**檢查：**
```bash
# 確認 Firebase CLI 已登入
firebase login

# 確認專案設定
firebase projects:list

# 重新部署
firebase deploy --only functions
```

### 問題：Firestore 權限錯誤

**檢查：**
- 確認 `firestore.rules` 在開發模式
- 確認索引已部署：`firebase deploy --only firestore:indexes`

### 問題：LINE 通知沒有收到

**檢查清單：**
1. [ ] Channel Access Token 是否正確
2. [ ] 是否有用戶加入 LINE OA
3. [ ] Firestore 索引是否已部署
4. [ ] 查看 Cloud Functions 日誌

詳見：`LINE_NOTIFICATION_TROUBLESHOOTING.md`
