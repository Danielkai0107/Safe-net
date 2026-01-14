# LINE 通知問題排查指南

## 問題描述

LINE 沒有收到通知訊息。

## 已修復的問題

### ✅ 1. Firestore 索引缺失

**問題：** 查詢 alerts collection 時缺少複合索引
**解決：** 已添加並部署索引到 `firestore.indexes.json`

```json
{
  "collectionGroup": "alerts",
  "fields": [
    { "fieldPath": "elderId", "order": "ASCENDING" },
    { "fieldPath": "alertType", "order": "ASCENDING" },
    { "fieldPath": "notificationSent", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

## 需要檢查的項目

### 🔍 1. LINE Channel Access Token 是否正確

**檢查位置：** Firestore > tenants collection > lineConfig.channelAccessToken

**驗證方法：**
```bash
# 測試 Token 是否有效
curl -v -X POST https://api.line.me/v2/bot/message/broadcast \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer YOUR_CHANNEL_ACCESS_TOKEN' \
-d '{
  "messages": [
    {
      "type": "text",
      "text": "測試訊息"
    }
  ]
}'
```

**常見錯誤：**
- Token 過期
- Token 來自錯誤的 Channel（應使用 Messaging API Channel）
- Token 沒有正確的權限

### 🔍 2. LINE OA 是否有用戶加入

**重要：** LINE broadcast API 只會發送給「已加入 OA 的用戶」

**檢查步驟：**
1. 用手機掃描 LINE OA 的 QR Code
2. 加入該 LINE OA 成為好友
3. 確認在 LINE OA Manager 中看到至少 1 位好友

**驗證：**
- 進入 [LINE Official Account Manager](https://manager.line.biz/)
- 查看「好友數」是否 > 0

### 🔍 3. LINE Channel 設定

#### Messaging API Channel 設定

1. **Webhook URL**（選填）：
   - 如果要接收用戶訊息，需設定 webhook
   - 格式：`https://YOUR_REGION-YOUR_PROJECT_ID.cloudfunctions.net/lineWebhook`

2. **Allow bot to join group chats**：
   - 如果要在群組中使用，需開啟此選項

3. **Use webhooks**：
   - 如果設定了 webhook URL，需開啟

#### 檢查 Channel Access Token

進入 LINE Developers Console：
1. 選擇您的 Provider
2. 選擇 Messaging API Channel
3. 到「Messaging API」分頁
4. 確認「Channel access token (long-lived)」已發行
5. 如果 Token 過期，點擊「Issue」重新發行

### 🔍 4. Firebase Functions 日誌檢查

**查看日誌：**
```bash
cd functions
npm run logs
```

**查找關鍵字：**
- `LINE broadcast notification sent` - 成功發送
- `Failed to send LINE broadcast notification` - 發送失敗
- 錯誤代碼和訊息

**常見錯誤：**

#### 錯誤 1: 401 Unauthorized
```
error: { message: 'Invalid access token' }
```
**解決：** Channel Access Token 無效或過期，需重新發行

#### 錯誤 2: 400 Bad Request
```
error: { message: 'Invalid request body' }
```
**解決：** 訊息格式錯誤，檢查 lineNotification.ts 中的訊息結構

#### 錯誤 3: 403 Forbidden
```
error: { message: 'The request is not authorized' }
```
**解決：** Channel 沒有 broadcast 權限，或 Token 來自錯誤的 Channel

### 🔍 5. 測試發送流程

#### 步驟 1: 使用硬體模擬器發送緊急訊號

1. 訪問 `http://localhost:5176/admin`
2. 在「硬體訊號模擬器」中：
   - 選擇社區
   - 選擇長者
   - 訊號類型選擇「emergency」（緊急求救）
   - 點擊「發送訊號」

#### 步驟 2: 檢查 Firestore

1. 進入 Firebase Console > Firestore Database
2. 檢查 `alerts` collection：
   - 應該有新的警報記錄
   - `notificationSent` 應該為 `true`
   - `notificationSentAt` 應該有時間戳

#### 步驟 3: 檢查 LINE OA

1. 打開手機 LINE
2. 進入該社區的 LINE OA 聊天室
3. 應該收到警報通知訊息

### 🔍 6. 手動測試 LINE API

使用以下 curl 命令直接測試 LINE API：

```bash
curl -X POST https://api.line.me/v2/bot/message/broadcast \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer YOUR_CHANNEL_ACCESS_TOKEN' \
-d '{
  "messages": [
    {
      "type": "text",
      "text": "⚠️ 測試通知\n\n這是一則測試訊息，如果您收到此訊息，表示 LINE 通知功能正常運作。"
    }
  ]
}'
```

**預期結果：**
- HTTP 200 OK
- 所有加入 OA 的用戶都會收到訊息

## 完整檢查清單

- [ ] Firestore 索引已部署（✅ 已完成）
- [ ] LINE Channel Access Token 正確且未過期
- [ ] 至少有 1 位用戶加入 LINE OA
- [ ] Token 來自 Messaging API Channel（不是 LINE Login Channel）
- [ ] Firebase Functions 已部署最新版本
- [ ] 使用硬體模擬器測試發送緊急訊號
- [ ] 檢查 Firebase Functions 日誌無錯誤
- [ ] 檢查 Firestore alerts collection 有記錄
- [ ] 手動測試 LINE API 可以成功發送

## 常見解決方案

### 方案 1: 重新發行 Channel Access Token

1. 進入 [LINE Developers Console](https://developers.line.biz/console/)
2. 選擇您的 Messaging API Channel
3. 到「Messaging API」分頁
4. 點擊「Channel access token」的「Issue」按鈕
5. 複製新的 Token
6. 更新 Firestore > tenants > lineConfig.channelAccessToken

### 方案 2: 確保有用戶加入 OA

1. 在 LINE Developers Console 找到您的 OA QR Code
2. 用手機掃描並加入
3. 確認在 LINE OA Manager 看到好友數增加

### 方案 3: 重新部署 Functions

```bash
cd functions
npm run build
firebase deploy --only functions
```

### 方案 4: 檢查 LINE Channel 類型

**重要：** 通知功能需要使用 **Messaging API Channel**，不是 LINE Login Channel

- Messaging API Channel：用於發送通知
- LINE Login Channel：用於 LIFF 登入

確保在 Firestore 中儲存的是 Messaging API Channel 的 Token。

## 測試成功的標準

當以下條件都滿足時，LINE 通知功能正常：

1. ✅ 使用硬體模擬器發送緊急訊號
2. ✅ Firestore alerts collection 有新記錄
3. ✅ `notificationSent` 為 `true`
4. ✅ Firebase Functions 日誌顯示 "LINE broadcast notification sent"
5. ✅ 手機 LINE 收到通知訊息

## 進階除錯

### 查看詳細的 LINE API 錯誤

修改 `functions/src/notifications/lineNotification.ts`：

```typescript
} catch (error: any) {
  console.error('LINE API Error Details:', {
    status: error.response?.status,
    statusText: error.response?.statusText,
    data: error.response?.data,
    headers: error.response?.headers,
  });
  logError('Failed to send LINE broadcast notification', {
    tenantId,
    elderId,
    error: error.response?.data || error.message,
  });
}
```

重新部署後再次測試，查看更詳細的錯誤訊息。

## 聯絡支援

如果以上步驟都無法解決問題，請提供以下資訊：

1. Firebase Functions 日誌（最近 10 筆）
2. LINE Channel 類型（Messaging API / LINE Login）
3. LINE OA 好友數
4. Firestore alerts collection 的截圖
5. 手動測試 LINE API 的回應

## 參考文件

- [LINE Messaging API 文件](https://developers.line.biz/en/docs/messaging-api/)
- [LINE Broadcast Messages](https://developers.line.biz/en/reference/messaging-api/#send-broadcast-message)
- [Firebase Functions 日誌](https://firebase.google.com/docs/functions/writing-and-viewing-logs)
