# Community Guardian SaaS - 實現說明

本文件說明已實現的功能與系統架構。

## 🎯 已完成功能

### ✅ 階段 1：資料庫結構與類型定義

- [x] 完整的 TypeScript 類型定義（Tenant、Elder、SignalLog、Alert）
- [x] Firebase Functions 專案結構與配置
- [x] Firestore Security Rules（Multi-tenancy 資料隔離）
- [x] Firestore Indexes 配置

### ✅ 階段 2：Cloud Functions 後端實現

- [x] **receiveSignal Cloud Function**
  - 接收 Gateway 發送的 BLE 訊號
  - MAC Address 驗證
  - 更新長者最後出現時間
  - 新增訊號紀錄至 logs collection
  - 觸發緊急警報與低電量警報

- [x] **sendLineNotification**
  - LINE Messaging API 整合
  - 推播通知給所有 adminLineIds
  - 包含 LIFF 快速連結按鈕

- [x] **checkInactivityAlerts 定時任務**
  - Cloud Scheduler 每小時執行
  - 檢查長者 lastSeen 時間
  - 自動建立與發送 inactivity 警報

- [x] **Tenant CRUD APIs**
  - createTenant, updateTenant, getTenant, listTenants, deleteTenant

- [x] **Elder CRUD APIs**
  - createElder, updateElder, getElder, listElders, deleteElder
  - MAC Address 格式驗證
  - 防止重複綁定

- [x] **Alerts APIs**
  - listAlerts, acknowledgeAlert, resolveAlert

### ✅ 階段 3：前端實現

#### Super Admin Dashboard

- [x] **硬體模擬器（完整版）**
  - 社區與長者選擇器
  - 訊號類型選擇（normal, emergency, health, other）
  - RSSI 輸入（-100 ~ 0 dBm）
  - Gateway ID 輸入
  - 電池電量輸入（0-100%）
  - 實際 Cloud Function API 調用
  - 歷史發送紀錄（最近 10 次）
  - 成功/失敗訊息顯示

- [x] **Tenant 管理頁面**
  - Tenant 列表（Table 元件）
  - 新增/編輯/刪除 Tenant
  - LINE Config 設定（Channel Access Token, Channel Secret, LIFF ID）
  - 管理員 LINE IDs 管理
  - 訂閱狀態顯示

- [x] **Elder 管理頁面**
  - Elder 列表（Table 元件）
  - 新增/編輯/刪除 Elder
  - MAC Address 格式驗證
  - 依社區過濾
  - 狀態燈號顯示（綠/黃/橙/紅）

#### LIFF App (Tenant Admin 介面)

- [x] **LIFF 授權驗證**
  - LINE User ID 取得
  - 自動查詢對應的 Tenant（比對 adminLineIds）
  - 權限不足提示頁面
  - 自動載入社區資料

- [x] **長者列表頁面**
  - 顯示所有長者的 ElderCard
  - 即時狀態燈號
  - 最後出現時間
  - 點擊進入詳細頁面

- [x] **長者詳細頁面**
  - 完整的長者資料顯示
  - 最近 24 小時活動時間軸
  - 訊號紀錄（RSSI、Gateway、電池電量）
  - 緊急聯絡人資訊

- [x] **警報記錄頁面**
  - 警報列表顯示
  - 依狀態篩選（all, pending, acknowledged, resolved）
  - 確認警報功能
  - 標記為已解決功能
  - 嚴重程度與狀態標示

#### 共用元件

- [x] **Button** - 多種變體（primary, secondary, danger, success）
- [x] **Modal** - 通用 Modal 元件
- [x] **Table** - 資料表格元件
- [x] **LoadingSpinner** - 載入動畫
- [x] **StatusBadge** - 狀態燈號（動態計算顏色）
- [x] **ElderCard** - 長者卡片元件

### ✅ 階段 4：整合與測試

- [x] 環境變數設定檔（env.example.txt）
- [x] 部署文件（DEPLOYMENT.md）
- [x] 路由配置更新
- [x] .gitignore 配置

---

## 📁 專案結構

```
community-guardian-saas/
├── functions/                      # Cloud Functions 後端
│   ├── src/
│   │   ├── index.ts               # Functions 入口
│   │   ├── types.ts               # 後端類型定義
│   │   ├── receiveSignal.ts       # 接收訊號 API
│   │   ├── api/
│   │   │   ├── tenants.ts         # Tenant CRUD APIs
│   │   │   ├── elders.ts          # Elder CRUD APIs
│   │   │   └── alerts.ts          # Alerts APIs
│   │   ├── notifications/
│   │   │   └── lineNotification.ts # LINE 推播
│   │   ├── scheduled/
│   │   │   └── inactivityCheck.ts  # 定時檢查
│   │   └── utils/
│   │       ├── validation.ts       # 驗證工具
│   │       └── logger.ts           # 日誌工具
│   ├── package.json
│   └── tsconfig.json
├── src/
│   ├── admin/                      # Super Admin 介面
│   │   ├── pages/
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── TenantManagement.tsx
│   │   │   └── ElderManagement.tsx
│   │   └── components/
│   │       └── HardwareSimulator.tsx
│   ├── liff/                       # LIFF App 介面
│   │   └── pages/
│   │       ├── LiffApp.tsx         # LIFF 主頁（含授權）
│   │       ├── ElderList.tsx       # 長者列表
│   │       ├── ElderDetail.tsx     # 長者詳細
│   │       └── AlertList.tsx       # 警報列表
│   ├── components/                 # 共用元件
│   │   ├── Button.tsx
│   │   ├── Modal.tsx
│   │   ├── Table.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── StatusBadge.tsx
│   │   └── ElderCard.tsx
│   ├── store/
│   │   └── store.ts                # Zustand 狀態管理
│   ├── types/
│   │   └── index.ts                # 前端類型定義
│   ├── lib/
│   │   └── firebase.ts             # Firebase 初始化
│   └── App.tsx                      # 主應用程式
├── firestore.rules                 # Firestore Security Rules
├── firestore.indexes.json          # Firestore Indexes
├── firebase.json                   # Firebase 配置
├── env.example.txt                 # 環境變數範本
├── DEPLOYMENT.md                   # 部署指南
└── README_IMPLEMENTATION.md        # 本文件
```

---

## 🔑 核心功能詳解

### 1. Multi-tenancy 架構

系統採用完整的 Multi-tenancy 設計：

- **資料隔離**：所有查詢都包含 `tenantId` 過濾
- **權限控制**：Firestore Security Rules 確保跨 Tenant 資料無法存取
- **授權管理**：使用 LINE User ID 進行身分識別與授權

### 2. 即時監控系統

- **BLE 訊號接收**：透過 Gateway POST 到 Cloud Function
- **狀態更新**：即時更新長者的 lastSeen 與 status
- **警報觸發**：
  - 緊急按鈕：立即觸發 critical 警報
  - 低電量：< 20% 觸發 medium，< 5% 觸發 high
  - 長時間未活動：定時任務每小時檢查

### 3. LINE 整合

- **LIFF 身分驗證**：無需額外登入，使用 LINE 帳號即可
- **推播通知**：支援文字訊息與按鈕模板
- **快速連結**：推播訊息包含直接跳轉 LIFF 的連結

### 4. 硬體模擬器

完整模擬真實 Gateway 行為：

- 選擇目標 Tenant 與 Elder
- 自訂訊號參數（RSSI, Gateway ID, Battery Level）
- 實際調用 Cloud Function API
- 顯示發送結果與歷史紀錄

---

## 🚀 使用流程

### Super Admin 工作流程

1. 登入 Admin Dashboard（/admin）
2. 新增 Tenant（填寫 LINE Config）
3. 新增 Elder（綁定 MAC Address）
4. 使用硬體模擬器測試訊號
5. 確認 Firestore 資料與 LINE 通知

### Tenant Admin (里長) 工作流程

1. 加入 LINE 官方帳號
2. 點擊 LIFF 連結（系統自動驗證身分）
3. 查看長者列表
4. 點擊查看長者詳細資料
5. 接收 LINE 警報通知
6. 在 LIFF 中確認/解決警報

### Gateway 工作流程

1. 偵測 BLE Beacon 訊號
2. POST 到 Cloud Function `/receiveSignal`
3. 系統自動處理並記錄
4. 必要時觸發警報與 LINE 通知

---

## 🛠 技術堆疊總覽

### 前端

- **框架**：React 19 + TypeScript 5
- **建置工具**：Vite 7
- **狀態管理**：Zustand 5
- **樣式**：Tailwind CSS 4
- **路由**：React Router DOM 7
- **LINE SDK**：@line/liff 2.27

### 後端

- **運算平台**：Firebase Cloud Functions (Node.js 18)
- **資料庫**：Firestore
- **排程任務**：Cloud Scheduler
- **HTTP 客戶端**：Axios 1.6

### 第三方服務

- **LINE Messaging API**：推播通知
- **LINE LIFF**：嵌入式 Web App

---

## 📊 資料流程圖

```
BLE Beacon
    ↓ 發送訊號
Gateway
    ↓ HTTP POST
Cloud Function (receiveSignal)
    ↓ 查詢 & 更新
Firestore (elders, logs, alerts)
    ↓ 即時同步
LIFF App (長者列表、詳細頁面)
    ↓ 觸發警報
LINE Messaging API
    ↓ 推播通知
Tenant Admin (里長)
```

---

## ⚠️ 注意事項

### 開發環境

1. 需要設定 `.env.local` 檔案（參考 env.example.txt）
2. 確保 Firebase CLI 已登入正確的專案
3. 第一次執行需要建立 Firestore Indexes

### 生產環境

1. 必須升級至 Firebase Blaze 方案（Cloud Functions 需要）
2. 設定正確的 CORS 來源
3. 定期檢查 Firestore 使用量與成本
4. 設定適當的 Security Rules

### LINE 設定

1. Channel Access Token 有效期限為永久，但可能因安全考量被撤銷
2. LIFF Endpoint URL 必須使用 HTTPS
3. 測試時建議使用 LINE 官方提供的測試工具

---

## 📝 待開發功能（Phase 2）

依照 PRD 第 10 章規劃：

- [ ] AI 異常偵測
- [ ] 健康數據整合
- [ ] 家屬 App
- [ ] 語音呼叫功能
- [ ] 跌倒偵測
- [ ] 社區服務整合

---

## 🐛 已知問題與限制

1. **Firestore Security Rules**：目前使用較寬鬆的設定，生產環境需加強
2. **Error Handling**：部分錯誤訊息需要更友善的中文化
3. **效能優化**：長者列表在數量較多時可考慮分頁載入
4. **離線支援**：LIFF App 目前不支援離線使用

---

## 📞 支援

如有技術問題，請參考：

- **PRD 文件**：[PRD.md](PRD.md)
- **部署指南**：[DEPLOYMENT.md](DEPLOYMENT.md)
- **本實現說明**：本文件

---

**實現完成日期：** 2026-01-14
**實現版本：** v1.0.0
