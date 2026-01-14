# LINE 通知快速測試指南

## 問題總結

根據日誌分析，發現以下問題：

### ✅ 已修復
1. **Firestore 索引缺失** - 已添加並部署

### ⚠️ 需要檢查

## 立即測試步驟

### 步驟 1: 檢查 LINE Channel Access Token

1. 進入 Firebase Console: https://console.firebase.google.com/project/safe-net-test/firestore
2. 打開 `tenants` collection
3. 找到「大愛社區」的文件
4. 檢查 `lineConfig.channelAccessToken` 是否存在且正確

**如何取得正確的 Token：**
1. 進入 [LINE Developers Console](https://developers.line.biz/console/)
2. 選擇您的 Provider
3. 選擇 **Messaging API Channel**（不是 LINE Login Channel）
4. 點擊「Messaging API」分頁
5. 找到「Channel access token (long-lived)」
6. 如果沒有，點擊「Issue」發行新 Token
7. 複製 Token 並更新到 Firestore

### 步驟 2: 確認有用戶加入 LINE OA

**這是最常見的問題！**

LINE broadcast API 只會發送給「已加入 OA 的用戶」。如果沒有用戶加入，就不會收到通知。

**檢查方法：**
1. 進入 [LINE Official Account Manager](https://manager.line.biz/)
2. 選擇您的 OA
3. 查看「好友」數量
4. 如果是 0，表示沒有人加入

**如何加入：**
1. 在 LINE Developers Console 找到您的 OA QR Code
2. 用手機掃描 QR Code
3. 點擊「加入好友」
4. 確認在 LINE OA Manager 看到好友數變成 1

### 步驟 3: 使用硬體模擬器測試

1. 訪問 http://localhost:5176/admin
2. 在「硬體訊號模擬器」中：
   - **社區**: 選擇「大愛社區」
   - **長者**: 選擇「王宗愷 (90歲)」
   - **訊號類型**: 選擇「emergency」（緊急求救）⚠️ 重要！
   - **RSSI**: -70
   - **Gateway ID**: SIM-001
   - **電池電量**: 85
3. 點擊「📡 發送訊號」

### 步驟 4: 檢查結果

#### A. 檢查瀏覽器控制台
應該看到：
```
✅ 訊號已成功發送！
```

#### B. 檢查 Firebase Functions 日誌
```bash
cd functions
npm run logs | tail -30
```

應該看到：
```
[INFO] Emergency alert triggered
[INFO] LINE broadcast notification sent
```

#### C. 檢查 Firestore
1. 進入 Firebase Console > Firestore
2. 查看 `alerts` collection
3. 應該有新的警報記錄：
   - `alertType`: "emergency"
   - `notificationSent`: true
   - `notificationSentAt`: (時間戳)

#### D. 檢查手機 LINE
打開 LINE，進入該社區的 OA 聊天室，應該收到：
```
⚠️ 警報通知

姓名：王宗愷
類型：緊急求救
時間：2026/1/14 下午4:38:57

請立即確認長者狀況！

[查看詳細資訊] (按鈕)
```

## 常見問題排查

### 問題 1: 沒有收到 LINE 通知

**可能原因 A: 沒有用戶加入 OA**
- 解決：用手機掃描 QR Code 加入 OA

**可能原因 B: Channel Access Token 錯誤**
- 解決：重新發行 Token 並更新到 Firestore

**可能原因 C: 使用了 LINE Login Channel 的 Token**
- 解決：確認使用 Messaging API Channel 的 Token

**可能原因 D: 訊號類型不是 emergency**
- 解決：在硬體模擬器中選擇「emergency」

### 問題 2: Functions 日誌顯示錯誤

**錯誤: "Invalid access token"**
```
[ERROR] Failed to send LINE broadcast notification
error: { message: 'Invalid access token' }
```
- 解決：Token 無效或過期，需重新發行

**錯誤: "The query requires an index"**
```
[ERROR] Error sending LINE notification
code: 9, details: "The query requires an index..."
```
- 解決：已修復，索引已部署

### 問題 3: 硬體模擬器顯示成功但沒有觸發警報

檢查是否選擇了正確的訊號類型：
- ✅ **emergency** - 會觸發警報並發送 LINE 通知
- ❌ **normal** - 不會觸發警報
- ❌ **health** - 不會觸發警報
- ❌ **other** - 不會觸發警報

## 手動測試 LINE API

如果以上步驟都確認無誤但還是收不到通知，可以手動測試 LINE API：

```bash
# 替換 YOUR_CHANNEL_ACCESS_TOKEN 為您的實際 Token
curl -X POST https://api.line.me/v2/bot/message/broadcast \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer YOUR_CHANNEL_ACCESS_TOKEN' \
-d '{
  "messages": [
    {
      "type": "text",
      "text": "測試訊息：如果您收到此訊息，表示 LINE API 運作正常"
    }
  ]
}'
```

**預期回應：**
```json
{
  "sentMessages": [
    {
      "id": "..."
    }
  ]
}
```

如果收到錯誤，根據錯誤代碼處理：
- `401`: Token 無效
- `400`: 請求格式錯誤
- `403`: 沒有權限

## 完整檢查清單

請依序檢查以下項目：

- [ ] ✅ Firestore 索引已部署（已完成）
- [ ] Firestore tenants collection 有正確的 channelAccessToken
- [ ] Token 來自 Messaging API Channel（不是 LINE Login）
- [ ] 至少有 1 位用戶加入 LINE OA（檢查 LINE OA Manager）
- [ ] 硬體模擬器選擇「emergency」訊號類型
- [ ] Firebase Functions 已部署最新版本
- [ ] 手動測試 LINE API 可以成功發送

## 下一步

1. **立即檢查**: LINE OA 是否有好友（最常見問題）
2. **驗證 Token**: 使用上面的 curl 命令測試
3. **重新測試**: 使用硬體模擬器發送 emergency 訊號
4. **查看日誌**: 確認是否有錯誤訊息

如果完成以上所有步驟仍無法收到通知，請提供：
1. Firebase Functions 最新日誌
2. LINE OA Manager 的好友數截圖
3. Firestore tenants collection 的 lineConfig 截圖（遮蔽敏感資訊）
