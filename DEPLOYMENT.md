# Community Guardian SaaS - 部署指南

此文件提供完整的部署步驟，從 Firebase 專案建立到生產環境部署。

---

## 目錄

1. [前置需求](#前置需求)
2. [Firebase 專案設定](#firebase-專案設定)
3. [LINE 官方帳號設定](#line-官方帳號設定)
4. [本地開發環境設定](#本地開發環境設定)
5. [Cloud Functions 部署](#cloud-functions-部署)
6. [前端應用部署](#前端應用部署)
7. [測試與驗證](#測試與驗證)
8. [故障排除](#故障排除)

---

## 前置需求

### 必需工具

- Node.js 18+ 
- npm 或 yarn
- Firebase CLI: `npm install -g firebase-tools`
- Git

### 必需帳號

- Google Cloud Platform 帳號
- LINE Developers 帳號

---

## Firebase 專案設定

### 1. 建立 Firebase 專案

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 點擊「新增專案」
3. 輸入專案名稱（例如：community-guardian-prod）
4. 選擇是否啟用 Google Analytics（建議啟用）
5. 等待專案建立完成

### 2. 啟用必要服務

#### 2.1 Firestore Database

1. 在 Firebase Console 左側選單點擊「Firestore Database」
2. 點擊「建立資料庫」
3. 選擇「以生產模式啟動」
4. 選擇資料庫位置（建議選擇 `asia-east1`）
5. 點擊「啟用」

#### 2.2 Authentication

1. 點擊左側選單「Authentication」
2. 點擊「開始使用」
3. 不需要啟用任何登入方式（使用 LINE LIFF 驗證）

#### 2.3 Cloud Functions

1. 點擊左側選單「Functions」
2. 點擊「開始使用」
3. 依照指示升級至 Blaze（隨用隨付）方案

#### 2.4 Hosting

1. 點擊左側選單「Hosting」
2. 點擊「開始使用」

### 3. 取得 Firebase 設定

1. 在專案概覽頁面點擊「</> 網頁」圖示
2. 輸入應用程式名稱（例如：community-guardian-web）
3. 勾選「同時設定 Firebase Hosting」
4. 複製顯示的設定資訊（稍後會用到）

```javascript
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "...",
  measurementId: "..."
};
```

---

## LINE 官方帳號設定

### 1. 建立 LINE Developers Provider

1. 前往 [LINE Developers Console](https://developers.line.biz/)
2. 使用 LINE 帳號登入
3. 點擊「Create a new provider」
4. 輸入 Provider 名稱（例如：Community Guardian）

### 2. 建立 Messaging API Channel

1. 在 Provider 頁面點擊「Create a Messaging API channel」
2. 填寫以下資訊：
   - **Channel name**: Community Guardian Bot
   - **Channel description**: 社區守護系統
   - **Category**: Medical/Healthcare
   - **Subcategory**: Home care services
3. 點擊「Create」

### 3. 取得 LINE Channel 設定

#### Channel Access Token

1. 進入剛建立的 Channel
2. 前往「Messaging API」分頁
3. 在「Channel access token」區塊點擊「Issue」
4. 複製產生的 Token（稍後會用到）

#### Channel Secret

1. 前往「Basic settings」分頁
2. 在「Channel secret」區塊複製 Secret

### 4. 建立 LIFF App

1. 在 Channel 頁面點擊「LIFF」分頁
2. 點擊「Add」
3. 填寫以下資訊：
   - **LIFF app name**: Community Guardian LIFF
   - **Size**: Full
   - **Endpoint URL**: `https://YOUR_PROJECT_ID.web.app/liff`（稍後會替換）
   - **Scope**: profile, openid
   - **Bot link feature**: On (Aggressive)
4. 點擊「Add」
5. 複製產生的 LIFF ID（例如：1234567890-abcdefgh）

---

## 本地開發環境設定

### 1. Clone 專案

```bash
git clone https://github.com/your-repo/community-guardian-saas.git
cd community-guardian-saas
```

### 2. 安裝依賴

```bash
# 安裝前端依賴
npm install

# 安裝 Cloud Functions 依賴
cd functions
npm install
cd ..
```

### 3. 設定環境變數

1. 複製環境變數範本：

```bash
cp env.example.txt .env.local
```

2. 編輯 `.env.local`，填入您的設定：

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# LINE Configuration
VITE_LIFF_ID=your_liff_id

# API Configuration  
VITE_API_ENDPOINT=https://us-central1-your_project_id.cloudfunctions.net/receiveSignal
```

### 4. Firebase CLI 登入

```bash
firebase login
firebase init
```

選擇以下功能：
- Firestore
- Functions
- Hosting

選擇「Use an existing project」並選擇您剛建立的專案。

---

## Cloud Functions 部署

### 1. 部署 Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### 2. 部署 Firestore Indexes

```bash
firebase deploy --only firestore:indexes
```

### 3. 編譯 Functions

```bash
cd functions
npm run build
cd ..
```

### 4. 部署 Functions

```bash
firebase deploy --only functions
```

等待部署完成，記下部署的 Functions URLs：

```
✔  functions[receiveSignal]: Successful create operation.
Function URL (receiveSignal): https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/receiveSignal
...
```

### 5. 設定 Cloud Scheduler

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 選擇您的專案
3. 導航至「Cloud Scheduler」
4. 系統會自動建立 `checkInactivityAlerts` 排程（每小時執行一次）

---

## 前端應用部署

### 1. 更新 API Endpoint

確認 `.env.local` 中的 `VITE_API_ENDPOINT` 設定為正確的 Cloud Function URL。

### 2. 建置前端

```bash
npm run build
```

### 3. 部署至 Firebase Hosting

```bash
firebase deploy --only hosting
```

部署完成後會顯示 Hosting URL：

```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/YOUR_PROJECT_ID/overview
Hosting URL: https://YOUR_PROJECT_ID.web.app
```

### 4. 更新 LIFF Endpoint URL

1. 回到 LINE Developers Console
2. 進入您的 LIFF App 設定
3. 將 Endpoint URL 更新為：`https://YOUR_PROJECT_ID.web.app/liff`
4. 點擊「Update」

---

## 測試與驗證

### 1. 建立第一個 Tenant

1. 前往 `https://YOUR_PROJECT_ID.web.app/admin/tenants`
2. 點擊「+ 新增社區」
3. 填寫社區資訊與 LINE 設定（使用前面取得的 Channel Access Token、Channel Secret、LIFF ID）
4. 點擊「建立」

### 2. 建立第一個 Elder

1. 前往 `https://YOUR_PROJECT_ID.web.app/admin/elders`
2. 點擊「+ 新增長者」
3. 填寫長者資訊與 MAC Address（格式：AA:BB:CC:DD:EE:FF）
4. 點擊「建立」

### 3. 測試硬體模擬器

1. 前往 `https://YOUR_PROJECT_ID.web.app/admin`
2. 在硬體訊號模擬器中：
   - 選擇社區
   - 選擇長者
   - 選擇「緊急求救」
   - 填寫 RSSI、Gateway ID、電池電量
3. 點擊「發送訊號」
4. 確認：
   - 訊號發送成功
   - Firestore `logs` collection 新增了紀錄
   - Firestore `elders` collection 的 `lastSeen` 更新了
   - Firestore `alerts` collection 新增了警報

### 4. 測試 LINE 通知

1. 使用手機掃描 LINE Bot 的 QR Code 加入官方帳號
2. 取得您的 LINE User ID（可使用 [LINE User ID Finder](https://liff.line.me/))
3. 將您的 LINE User ID 加入 Tenant 的 `adminLineIds`
4. 再次使用硬體模擬器發送「緊急求救」訊號
5. 確認您收到 LINE 推播通知

### 5. 測試 LIFF App

1. 在手機上開啟 LINE
2. 進入您的官方帳號聊天室
3. 發送任意訊息（或點擊選單）進入 LIFF
4. 確認可以看到：
   - 長者列表
   - 長者詳細資料
   - 警報記錄

---

## 故障排除

### 問題 1：LIFF 無法開啟

**可能原因：**
- LIFF Endpoint URL 設定錯誤
- LIFF ID 設定錯誤

**解決方法：**
1. 檢查 `.env.local` 中的 `VITE_LIFF_ID`
2. 檢查 LINE Developers Console 中的 LIFF Endpoint URL
3. 確認 URL 結尾沒有多餘的斜線

### 問題 2：LINE 推播無法發送

**可能原因：**
- Channel Access Token 錯誤或過期
- adminLineIds 格式錯誤

**解決方法：**
1. 重新 Issue Channel Access Token
2. 更新 Tenant 的 lineConfig
3. 確認 adminLineIds 格式正確（以 U 開頭的 33 字符）

### 問題 3：Cloud Functions 逾時

**可能原因：**
- Firestore 索引未建立
- 查詢效能問題

**解決方法：**
1. 檢查 Firebase Console 的 Firestore Indexes
2. 確認所有必要的索引都已建立
3. 查看 Cloud Functions 日誌：`firebase functions:log`

### 問題 4：權限不足

**可能原因：**
- Firestore Security Rules 過於嚴格

**解決方法：**
1. 檢查 `firestore.rules`
2. 暫時設定為：
```javascript
match /{document=**} {
  allow read, write: if true;
}
```
3. 測試完成後恢復正常的 Security Rules

---

## 生產環境檢查清單

部署到生產環境前，請確認以下項目：

- [ ] Firebase 專案已升級至 Blaze 方案
- [ ] 所有環境變數正確設定
- [ ] Firestore Security Rules 已正確配置
- [ ] Firestore Indexes 已全部建立
- [ ] Cloud Functions 部署成功
- [ ] Frontend 部署成功
- [ ] LIFF Endpoint URL 已更新
- [ ] LINE Bot 通知功能測試通過
- [ ] LIFF App 測試通過
- [ ] 硬體模擬器測試通過
- [ ] 設定監控與警報
- [ ] 準備備份策略

---

## 監控與維護

### 日誌查看

```bash
# 查看 Cloud Functions 日誌
firebase functions:log

# 查看特定 Function 日誌
firebase functions:log --only receiveSignal
```

### 效能監控

1. 前往 Firebase Console > Performance
2. 查看應用程式效能指標
3. 設定效能警報

### 成本監控

1. 前往 Firebase Console > Usage and billing
2. 設定預算警報
3. 定期檢視使用量

---

## 支援

如有問題，請聯絡：
- Email: support@example.com
- 技術文件：https://docs.example.com

---

**最後更新：** 2026-01-14
