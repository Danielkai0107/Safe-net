# 訊號裝置管理功能說明

## 功能概述

新增了訊號裝置管理系統，讓管理員可以統一管理社區配發的訊號裝置（Beacon），並在新增長輩時從裝置清單中選擇配發。

## 主要功能

### 1. 裝置管理頁面 (`/admin/devices`)

**欄位說明：**
- **裝置編號**：自動產生，格式為「社區名稱前3字 + 流水號」
  - 例如：「大安社區」的第一個裝置編號為「大安社001」
- **所屬社區**：該裝置配發到哪個社區
- **MAC Address**：Beacon 的 MAC 地址
- **狀態**：
  - `可用`：尚未配發給任何長輩
  - `已配發`：已配發給長輩使用
  - `維護中`：裝置維護中
  - `已退役`：裝置已停用
- **配發對象**：顯示配發給哪位長輩（如有）

**操作功能：**
- ✅ 新增裝置：選擇社區、輸入 MAC Address
- ✅ 編輯裝置：修改 MAC Address 和備註
- ✅ 刪除裝置：只能刪除未配發的裝置
- ✅ 社區篩選：可按社區篩選裝置列表

### 2. 長輩管理整合

在新增/編輯長輩時，新增了裝置選擇功能：

**使用方式：**
1. 先選擇「所屬社區」
2. 系統會自動載入該社區的可用裝置列表
3. 可以選擇：
   - **從裝置清單選擇**（推薦）：選擇社區配發的裝置
   - **手動輸入 MAC Address**：如果裝置尚未登記

**自動處理：**
- 選擇裝置後，MAC Address 會自動填入
- 配發裝置後，裝置狀態自動更新為「已配發」
- 取消配發時，裝置狀態自動恢復為「可用」

## 資料庫結構

### devices Collection

```typescript
{
  id: string;                    // Firestore 自動生成
  tenantId: string;              // 所屬社區 ID
  macAddress: string;            // MAC Address
  deviceNumber: string;          // 裝置編號（自動生成）
  status: 'available' | 'assigned' | 'maintenance' | 'retired';
  assignedElderId?: string;      // 配發給哪位長輩
  assignedElderName?: string;    // 長輩姓名（冗餘儲存）
  notes?: string;                // 備註
  createdAt: string;             // 建立時間
  updatedAt: string;             // 更新時間
}
```

### elders Collection（新增欄位）

```typescript
{
  // ... 原有欄位 ...
  deviceId?: string;             // 關聯的裝置 ID
  // ... 其他欄位 ...
}
```

## 檔案變更清單

### 新增檔案
- `src/admin/pages/DeviceManagement.tsx` - 裝置管理頁面

### 修改檔案
- `src/types/index.ts` - 新增 Device 相關類型定義
- `src/admin/pages/ElderManagement.tsx` - 整合裝置選擇功能
- `src/admin/pages/AdminDashboard.tsx` - 新增裝置管理按鈕
- `src/App.tsx` - 新增裝置管理路由

## 使用流程

### 標準流程（推薦）

1. **管理員先在「裝置管理」新增裝置**
   - 選擇社區
   - 輸入 MAC Address
   - 系統自動生成裝置編號（例如：大安社001）

2. **新增長輩時從裝置清單選擇**
   - 選擇所屬社區
   - 從下拉選單選擇該社區的可用裝置
   - 系統自動填入 MAC Address
   - 裝置狀態自動更新為「已配發」

### 彈性流程

如果裝置尚未登記，管理員也可以：
- 直接在新增長輩時手動輸入 MAC Address
- 之後再到裝置管理補登記裝置資訊

## 注意事項

1. **裝置編號自動生成**
   - 格式：社區名稱前3字 + 3位數流水號
   - 例如：大安社001、大安社002...

2. **裝置狀態管理**
   - 已配發的裝置無法刪除
   - 需要先解除配發才能刪除裝置

3. **MAC Address 格式**
   - 標準格式：AA:BB:CC:DD:EE:FF
   - 系統會自動轉換為大寫

4. **社區篩選**
   - 裝置管理和長輩管理都支援按社區篩選
   - 方便管理多個社區的裝置

## 未來擴展建議

- [ ] 裝置批次匯入功能
- [ ] 裝置維護記錄
- [ ] 裝置使用統計報表
- [ ] 裝置電池狀態監控
- [ ] 裝置更換歷史記錄
