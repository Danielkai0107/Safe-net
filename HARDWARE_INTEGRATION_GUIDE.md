# 實體硬體整合指南

## 硬體設備

您準備使用的設備：
1. **MWC02 Ultra-thin Location Card** - 超薄定位卡片（Beacon）
2. **MG6 4G Bluetooth® Stellar Gateway** - 4G 藍牙閘道器

## 能否直接使用？

### ✅ 好消息
系統已經為這類硬體做好準備，但需要進行以下設定。

### ⚠️ 需要的準備工作

## 整合步驟

### 步驟 1: 準備 MWC02 定位卡片（Beacon）

#### 1.1 取得 MAC Address
```
每張 MWC02 卡片都有唯一的 MAC Address (藍牙地址)
格式：AA:BB:CC:DD:EE:FF
```

**如何取得：**
- 查看卡片背面或包裝上的標籤
- 使用手機藍牙掃描 APP（例如：nRF Connect）
- 查看製造商提供的文檔

#### 1.2 在系統中註冊裝置

**方法 A: 在裝置管理中新增**
1. 訪問 `http://localhost:5176/admin/devices`
2. 點擊「新增裝置」
3. 輸入：
   - 所屬社區：選擇社區
   - MAC Address：輸入卡片的 MAC Address
4. 點擊「建立」

**方法 B: 在新增長輩時直接輸入**
1. 訪問 `http://localhost:5176/admin/elders`
2. 點擊「新增長者」
3. 選擇裝置或手動輸入 MAC Address
4. 系統會自動綁定

#### 1.3 配發給長輩
- 將卡片交給長輩隨身攜帶
- 建議放在錢包、口袋或掛在胸前

### 步驟 2: 設定 MG6 閘道器（Gateway）

#### 2.1 硬體安裝

**位置選擇：**
- 社區出入口（大門、後門）
- 活動中心
- 餐廳
- 重要通道

**安裝注意事項：**
- 供電穩定（插電或備用電池）
- 4G 訊號良好的位置
- 高度建議：1.5-2 公尺
- 避免金屬遮蔽

#### 2.2 取得閘道器資訊

每個 MG6 閘道器都有：
```
1. 序號（Serial Number）：例如 MG6-001、MG6-002
2. IMEI（如果使用 4G）
3. IP 地址或 API endpoint
```

#### 2.3 在系統中註冊接收點

1. 訪問 `http://localhost:5176/admin/gateways`
2. 點擊「新增接收點」
3. 輸入：
   - 所屬社區：選擇社區
   - 接收裝置序號：輸入 MG6 的序號
   - 地點名稱：例如「社區大門」
   - 詳細地址：（選填）
   - 是否為邊界點：如果是出入口建議勾選
4. 點擊「建立」
5. 記下系統生成的「接收點編號」

### 步驟 3: 設定 MG6 閘道器連接到您的系統

#### 3.1 取得 Cloud Function API Endpoint

您的系統 API 地址：
```
https://us-central1-safe-net-test.cloudfunctions.net/receiveSignal
```

#### 3.2 設定 MG6 閘道器

MG6 閘道器通常支援以下設定方式：

**方法 A: Web 管理介面**
1. 連接 MG6 的 WiFi 或透過網路訪問其管理介面
2. 找到「數據上報」或「Data Upload」設定
3. 設定參數：
   ```
   API URL: https://us-central1-safe-net-test.cloudfunctions.net/receiveSignal
   Method: POST
   Content-Type: application/json
   ```

**方法 B: AT 指令（如果支援）**
```
AT+HTTPURL=https://us-central1-safe-net-test.cloudfunctions.net/receiveSignal
AT+HTTPMETHOD=POST
AT+HTTPHEADER=Content-Type: application/json
```

**方法 C: 製造商提供的設定工具**
- 使用製造商提供的 APP 或軟體
- 輸入 API endpoint

#### 3.3 設定數據格式

MG6 需要發送以下格式的數據：

```json
{
  "macAddress": "AA:BB:CC:DD:EE:FF",
  "rssi": -70,
  "gatewayId": "MG6-001",
  "signalType": "normal",
  "timestamp": "2026-01-14T10:30:00.000Z",
  "metadata": {
    "batteryLevel": 85
  }
}
```

**欄位說明：**
- `macAddress`: 偵測到的 Beacon MAC Address（必填）
- `rssi`: 訊號強度，範圍 -100 到 0（必填）
- `gatewayId`: 閘道器序號，需與系統中註冊的一致（必填）
- `signalType`: "normal", "emergency", "health", "other"（選填）
- `timestamp`: ISO 8601 格式時間戳（選填，系統會自動補）
- `metadata.batteryLevel`: 電池電量 0-100（選填）

### 步驟 4: 測試連接

#### 4.1 使用硬體模擬器測試（開發階段）

在實際硬體到位前，可以使用模擬器：
1. 訪問 `http://localhost:5176/admin`
2. 使用「硬體訊號模擬器」
3. 模擬 MG6 發送數據到系統

#### 4.2 實際硬體測試

**測試步驟：**
1. 確保 MG6 已開機並連接到網路
2. 將 MWC02 卡片放在 MG6 附近（10 公尺內）
3. 觀察系統反應：

**檢查點：**
- [ ] Firebase Console > Firestore > `logs` - 應該有新的訊號記錄
- [ ] Firebase Console > Firestore > `locationLogs` - 應該有行蹤記錄
- [ ] Firebase Console > Firestore > `elders` - 長輩的 `lastSeen` 應該更新
- [ ] 如果是邊界點 → 檢查 LINE 是否收到通知

#### 4.3 查看 Cloud Function 日誌

```bash
cd /Users/danielkai/Desktop/community-guardian-saas/functions
npm run logs
```

查找：
- `[INFO] Received signal` - 確認收到訊號
- `[INFO] Found elder` - 確認找到長輩
- `[INFO] Found gateway` - 確認找到接收點
- `[INFO] Location log created` - 確認記錄行蹤

### 步驟 5: 可能需要的調整

#### 5.1 如果 MG6 的數據格式不同

MG6 可能使用不同的欄位名稱，需要調整 Cloud Function：

**範例：MG6 可能發送的格式**
```json
{
  "mac": "AA:BB:CC:DD:EE:FF",
  "signal": -70,
  "gateway": "MG6-001"
}
```

**修改 `functions/src/receiveSignal.ts`：**
```typescript
// 在驗證請求的部分，添加格式轉換
const macAddress = request.macAddress || request.mac;
const rssi = request.rssi || request.signal;
const gatewayId = request.gatewayId || request.gateway;
```

#### 5.2 如果需要認證

如果 MG6 需要 API Key 或 Token：

**方法 A: 在 URL 中加入參數**
```
https://us-central1-safe-net-test.cloudfunctions.net/receiveSignal?apiKey=YOUR_API_KEY
```

**方法 B: 在 Header 中加入**
```
Authorization: Bearer YOUR_API_KEY
```

需要修改 Cloud Function 來驗證這些參數。

#### 5.3 調整訊號接收範圍

MG6 的藍牙接收範圍通常是：
- 室內：10-30 公尺
- 室外：50-100 公尺

可以在 MG6 設定中調整：
- 訊號強度閾值（RSSI threshold）
- 掃描間隔
- 數據上報頻率

## 部署到生產環境

### 1. 準備生產環境 API

當前使用的是測試環境，生產環境需要：

```bash
# 部署到生產環境
firebase use production
firebase deploy --only functions
```

取得生產環境 API：
```
https://us-central1-YOUR_PRODUCTION_PROJECT.cloudfunctions.net/receiveSignal
```

### 2. 設定 HTTPS 和安全性

**建議：**
- 使用 Firebase API Key 驗證
- 設定 IP 白名單（僅允許 MG6 的 IP）
- 使用 HTTPS（已內建）
- 記錄所有請求（已實作）

### 3. 監控和告警

**設定監控：**
- Firebase Console > Functions > 監控
- 設定告警規則（例如：錯誤率 > 5%）
- 設定效能監控

## 常見問題

### Q1: MG6 無法連接到 API

**檢查：**
1. MG6 是否有網路連接（4G 或 WiFi）
2. API URL 是否正確
3. 防火牆是否阻擋
4. 查看 Cloud Function 日誌是否有請求記錄

**解決方法：**
```bash
# 測試 API 是否可訪問
curl -X POST https://us-central1-safe-net-test.cloudfunctions.net/receiveSignal \
  -H "Content-Type: application/json" \
  -d '{"macAddress":"AA:BB:CC:DD:EE:FF","rssi":-70,"gatewayId":"TEST"}'
```

### Q2: 系統收到訊號但找不到長輩

**原因：**
- MWC02 的 MAC Address 未在系統中註冊
- MAC Address 格式不正確

**解決：**
1. 確認 MWC02 的實際 MAC Address
2. 在系統中新增該 MAC Address
3. 確保格式為：`AA:BB:CC:DD:EE:FF`（大寫，用冒號分隔）

### Q3: 邊界點不會發送通知

**檢查：**
1. 接收點是否設為「邊界點」
2. LINE Channel Access Token 是否正確
3. 是否有用戶加入 LINE OA
4. 查看 Cloud Function 日誌

### Q4: 訊號太弱或不穩定

**調整：**
1. MWC02 電池是否充足
2. MG6 位置是否合適
3. 是否有金屬或厚牆阻隔
4. 調整 MG6 的訊號強度閾值

### Q5: 電池續航問題

**MWC02 電池優化：**
- 調整廣播間隔（預設通常是 1 秒）
- 降低發射功率（但會影響範圍）
- 使用低功耗模式

**預期續航：**
- 標準模式：3-6 個月
- 省電模式：6-12 個月

## 硬體規格參考

### MWC02 Ultra-thin Location Card

**典型規格：**
- 尺寸：85.6mm × 54mm × 0.8mm（信用卡大小）
- 重量：約 5-10g
- 電池：CR2032 或類似
- 藍牙：BLE 4.0/5.0
- 訊號範圍：10-50 公尺
- 防水等級：IP65 或以上
- 工作溫度：-20°C ~ 60°C

**功能：**
- 持續廣播藍牙訊號
- 部分型號支援按鈕（緊急求救）
- 部分型號支援溫度/濕度感測器

### MG6 4G Bluetooth® Stellar Gateway

**典型規格：**
- 4G LTE 連接
- 藍牙 4.0/5.0
- 掃描範圍：10-100 公尺
- 供電：DC 5V 或 PoE
- 工作溫度：-20°C ~ 60°C
- 網路：4G/WiFi/Ethernet

**功能：**
- 同時掃描多個 Beacon
- 數據上報到雲端
- 支援遠端管理
- 支援韌體更新

## 技術支援

### 製造商文檔

建議查閱：
1. MWC02 用戶手冊
2. MG6 技術文檔
3. API 整合指南

### 需要協助？

如果遇到問題，請提供：
1. MG6 的日誌
2. Cloud Function 日誌
3. 實際測試的 MAC Address
4. MG6 發送的原始數據格式

## 總結

### 能否直接使用？

**答案：可以，但需要完成以下設定：**

1. ✅ 系統已準備好（API、資料庫結構）
2. ⚠️ 需要註冊 MWC02 的 MAC Address
3. ⚠️ 需要在系統中新增 MG6 接收點
4. ⚠️ 需要設定 MG6 連接到您的 API
5. ⚠️ 可能需要根據實際數據格式微調

### 建議流程

1. 先在系統中新增測試資料（裝置、接收點、長輩）
2. 使用硬體模擬器測試流程
3. 拿到實體硬體後，逐步整合
4. 先單點測試（1個 MWC02 + 1個 MG6）
5. 確認穩定後再擴展到多點

### 預計時間

- 系統準備：✅ 已完成
- 硬體註冊：30 分鐘
- MG6 設定：1-2 小時
- 測試調整：2-4 小時
- **總計：約半天到一天可以完成整合**

準備好後隨時可以開始整合！如果需要協助，請隨時告訴我。
