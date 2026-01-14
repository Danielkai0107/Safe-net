# 管理員登入系統設置指南

## 🎉 功能概述

已成功為後台管理系統添加完整的身份驗證功能：

### ✅ 已實現功能

1. **登入頁面** (`/login`)
   - 美觀的登入介面
   - 電子郵件和密碼驗證
   - 密碼可見性切換
   - 完整的錯誤處理和提示

2. **受保護的路由**
   - 所有 `/admin/*` 路徑現在需要登入
   - 未登入用戶會被自動重定向到登入頁面
   - 登入後會自動跳轉到原本想訪問的頁面

3. **身份驗證上下文**
   - 全域管理登入狀態
   - 持久化登入（刷新頁面後仍保持登入狀態）
   - 提供登入/登出功能

4. **登出功能**
   - 在管理後台右上角顯示當前用戶
   - 一鍵登出按鈕

## 📋 使用方式

### 第一步：創建管理員帳號

由於這是使用 Firebase Authentication，您需要先創建管理員帳號。有兩種方式：

#### 方式 1：使用 Firebase Console（推薦）

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 選擇您的專案
3. 在左側選單點擊 **Authentication**
4. 點擊 **Users** 標籤
5. 點擊 **Add user** 按鈕
6. 輸入管理員的電子郵件和密碼
7. 點擊 **Add user** 完成

#### 方式 2：使用 Firebase Admin SDK（進階）

如果您需要批量創建管理員帳號或通過代碼創建，可以創建一個臨時腳本：

```typescript
// scripts/createAdmin.ts
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// 初始化 Firebase Admin
const app = initializeApp({
  credential: cert('./serviceAccountKey.json'),
});

const auth = getAuth(app);

// 創建管理員
async function createAdmin(email: string, password: string) {
  try {
    const userRecord = await auth.createUser({
      email,
      password,
      emailVerified: true,
    });
    console.log('成功創建管理員:', userRecord.uid);
  } catch (error) {
    console.error('創建失敗:', error);
  }
}

// 使用範例
createAdmin('admin@example.com', 'YourSecurePassword123');
```

### 第二步：登入系統

1. 啟動開發伺服器：
   ```bash
   npm run dev
   ```

2. 訪問首頁：`http://localhost:5173/`

3. 點擊「超級後台」卡片

4. 您會被自動重定向到登入頁面：`/login`

5. 輸入您在 Firebase Console 創建的管理員帳號和密碼

6. 點擊「登入」按鈕

7. 登入成功後，您會被自動重定向到管理後台

### 第三步：使用管理後台

登入後，您可以：
- 查看儀表板統計數據
- 管理社區（Tenants）
- 管理長者（Elders）
- 管理裝置（Devices）
- 管理接收點（Gateways）
- 使用硬體模擬器

### 登出

在任何管理頁面的右上角，您會看到：
- 當前登入的管理員電子郵件（部分顯示）
- 登出按鈕（紅色）

點擊登出按鈕即可退出系統。

## 🔒 安全性功能

1. **持久化登入**
   - 使用 `browserLocalPersistence` 保持登入狀態
   - 刷新頁面後不需要重新登入

2. **自動重定向**
   - 未登入用戶無法訪問管理頁面
   - 登入後自動回到原本想訪問的頁面

3. **錯誤處理**
   - 詳細的錯誤提示訊息
   - 防止暴力破解的限制

4. **載入狀態**
   - 優雅的載入畫面
   - 防止閃爍

## 📁 新增檔案

以下是此次更新新增的檔案：

1. **`src/contexts/AuthContext.tsx`**
   - 身份驗證上下文
   - 管理登入狀態
   - 提供 `useAuth` Hook

2. **`src/components/ProtectedRoute.tsx`**
   - 受保護的路由組件
   - 驗證用戶身份
   - 處理重定向邏輯

3. **`src/admin/pages/Login.tsx`**
   - 登入頁面組件
   - 美觀的 UI
   - 完整的表單驗證

4. **已修改的檔案：**
   - `src/App.tsx` - 添加 AuthProvider 和受保護的路由
   - `src/admin/pages/AdminDashboard.tsx` - 添加登出功能和用戶顯示

## 🎨 UI 設計

登入頁面採用了與首頁一致的設計風格：
- 漸層背景（紫色系）
- Material-UI 組件
- 響應式設計
- 優雅的動畫效果

## 🔧 技術細節

### 使用的技術：
- **Firebase Authentication** - 身份驗證服務
- **React Context API** - 全域狀態管理
- **React Router** - 路由保護
- **Material-UI** - UI 組件庫

### 身份驗證流程：

```
用戶訪問 /admin
    ↓
檢查登入狀態
    ↓
├─ 未登入 → 重定向到 /login
│       ↓
│   輸入帳號密碼
│       ↓
│   Firebase 驗證
│       ↓
│   設置用戶狀態
│       ↓
└─ 已登入 → 允許訪問
```

## 🐛 常見問題

### Q: 忘記密碼怎麼辦？
A: 目前需要在 Firebase Console 中重設密碼，或者可以擴展登入頁面添加「忘記密碼」功能。

### Q: 如何添加更多管理員？
A: 在 Firebase Console 的 Authentication 頁面添加新用戶即可。

### Q: 可以使用 Google 登入嗎？
A: 可以！您可以在 Firebase Console 啟用 Google 登入提供者，然後修改 `AuthContext.tsx` 添加相應的登入方法。

### Q: 如何設置不同的管理員權限？
A: 可以使用 Firebase Custom Claims 或在 Firestore 中創建 `admins` 集合來管理不同的權限級別。

## 🚀 下一步建議

1. **添加忘記密碼功能**
   ```typescript
   import { sendPasswordResetEmail } from 'firebase/auth';
   ```

2. **添加管理員角色系統**
   - 超級管理員
   - 一般管理員
   - 只讀管理員

3. **添加操作日誌**
   - 記錄管理員的操作
   - 審計追蹤

4. **添加多因素驗證 (MFA)**
   - 提高安全性

5. **添加 Google 登入**
   - 更方便的登入方式

## 📝 測試建議

建議創建以下測試帳號：
```
管理員: admin@communityguardian.com / Admin123!
測試員: test@communityguardian.com / Test123!
```

---

**注意事項：**
- 請確保 Firebase 配置正確
- 請使用強密碼
- 定期檢查 Firebase Authentication 的使用量
- 考慮設置密碼強度要求
