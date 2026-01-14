# LIFF 開發模式指南

## 🎨 當前狀態：開發模式已啟用

目前 LIFF 頁面已設定為**開發模式**，可以在不登入 LINE 的情況下進行樣式切版。

## 📍 修改位置

### 1. LiffApp.tsx - 主應用程式
檔案：`src/liff/pages/LiffApp.tsx`

```typescript
// 🎨 開發模式：設為 true 以跳過 LIFF 登入，方便樣式切版
const DEV_MODE_SKIP_AUTH = true;  // ← 這裡控制開發模式
```

### 2. ElderDetail.tsx - 長者詳情頁面
檔案：`src/liff/pages/ElderDetail.tsx`

```typescript
// 🎨 開發模式：設為 true 以使用模擬資料
const DEV_MODE = true;  // ← 這裡控制開發模式
```

## 🔄 如何切換模式

### 切換到開發模式（當前）
**LiffApp.tsx:**
```typescript
const DEV_MODE_SKIP_AUTH = true;
```

**ElderDetail.tsx:**
```typescript
const DEV_MODE = true;
```

功能：
- ✅ 不需要 LINE 登入
- ✅ 使用模擬資料
- ✅ 自動設為管理員權限
- ✅ 顯示所有功能
- ✅ 長者詳情頁面可正常顯示

### 切換回正式模式
**LiffApp.tsx:**
```typescript
const DEV_MODE_SKIP_AUTH = false;
```

**ElderDetail.tsx:**
```typescript
const DEV_MODE = false;
```

功能：
- ✅ 需要 LINE LIFF 登入
- ✅ 從 Firebase 讀取真實資料
- ✅ 根據實際權限顯示功能

## 📊 開發模式提供的模擬資料

### 社區資料
- 名稱：測試社區
- 管理員：測試管理員
- 訂閱狀態：active

### 長者資料（4位）
1. **王大明** (75歲, 男) - 線上 🟢
   - 電量：85%
   - 最後上線：現在

2. **李美華** (82歲, 女) - 離線 ⚫
   - 電量：45%
   - 最後上線：2小時前

3. **陳志強** (78歲, 男) - 警報 🔴
   - 電量：20%（低電量警報）
   - 最後上線：10分鐘前

4. **張秀英** (85歲, 女) - 線上 🟢
   - 電量：95%
   - 最後上線：現在

### 警報資料（4筆）
1. **待處理 - 緊急** 🔴 - 陳志強：緊急求救信號（5分鐘前）
2. **待處理 - 中度** 🟡 - 陳志強：裝置電量過低（20%）（30分鐘前）
3. **已確認 - 高度** 🟠 - 李美華：超過2小時未活動（2小時前）
4. **已解決 - 低度** ⚫ - 王大明：裝置暫時離線（1天前）

### 活動記錄（自動生成）
每位長者的詳情頁面會自動生成模擬的 24 小時活動記錄：
- **線上長者**（王大明、張秀英）：10筆記錄
- **警報長者**（陳志強）：5筆記錄（包含緊急信號）
- **離線長者**（李美華）：2筆記錄
- 記錄類型：正常、健康、緊急
- 信號強度：-50 到 -80 dBm

## 🚀 如何使用

1. **啟動開發伺服器**
   ```bash
   npm run dev
   ```

2. **訪問 LIFF 頁面**（所有頁面都可以正常測試）
   - 長者列表：http://localhost:5173/liff
   - 警報列表：http://localhost:5173/liff/alerts
   - 長者詳情範例：
     - 王大明（線上）：http://localhost:5173/liff/elder/elder-1
     - 李美華（離線）：http://localhost:5173/liff/elder/elder-2
     - 陳志強（警報）：http://localhost:5173/liff/elder/elder-3
     - 張秀英（線上）：http://localhost:5173/liff/elder/elder-4

3. **進行樣式調整**
   - 所有 LIFF 相關樣式在：`src/styles/liff/`
   - 頁面樣式：`src/styles/liff/pages/`
   - 元件樣式：`src/styles/liff/components/`

4. **測試不同狀態**
   - 線上長者：elder-1, elder-4
   - 離線長者：elder-2
   - 警報狀態：elder-3
   - 管理員功能：所有功能都可見

## ⚠️ 注意事項

1. 開發模式下所有資料都是**模擬資料**，不會連接到 Firebase
2. 樣式切版完成後，記得將 `DEV_MODE_SKIP_AUTH` 改回 `false`
3. 提交代碼前請確認已恢復正式模式
4. 模擬資料的 ID 是固定的，可以用來測試特定功能

## 📝 樣式切版檢查清單

- [ ] 長者列表頁面 (`ElderList.tsx`)
  - [ ] 頁面標題和統計
  - [ ] 長者卡片佈局
  - [ ] 新增長者按鈕（管理員）
  - [ ] 空狀態顯示
  
- [ ] 長者詳情頁面 (`ElderDetail.tsx`)
  - [ ] 個人資訊區塊
  - [ ] 裝置狀態顯示
  - [ ] 緊急聯絡資訊
  - [ ] 歷史記錄
  
- [ ] 警報列表頁面 (`AlertList.tsx`)
  - [ ] 警報卡片佈局
  - [ ] 不同嚴重程度的視覺區分
  - [ ] 狀態標籤
  - [ ] 時間顯示

- [ ] 響應式設計
  - [ ] 手機版面（375px）
  - [ ] 平板版面（768px）
  - [ ] 大螢幕版面（1024px+）

- [ ] 互動效果
  - [ ] 按鈕 hover/active 狀態
  - [ ] 卡片點擊效果
  - [ ] 頁面切換動畫
  - [ ] 載入狀態

## 🔧 常見問題

### Q: 修改後沒有看到變化？
A: 確認瀏覽器沒有快取，或使用無痕模式測試

### Q: 需要看到真實資料測試？
A: 將 `DEV_MODE_SKIP_AUTH` 改為 `false`，並確保 Firebase 配置正確

### Q: 如何測試不同權限？
A: 開發模式下預設是管理員，要測試非管理員需切回正式模式

---

**最後更新：** 2026-01-14
**修改者：** AI Assistant
**用途：** 方便 LIFF 頁面樣式切版
