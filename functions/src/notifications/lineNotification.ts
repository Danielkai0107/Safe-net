import * as admin from 'firebase-admin';
import axios from 'axios';
import { Tenant, Elder, AlertType } from '../types';
import { logInfo, logError } from '../utils/logger';

const db = admin.firestore();

/**
 * Send LINE notification to all users who joined the LINE OA
 */
export async function sendLineNotification(
  tenantId: string,
  elderId: string,
  alertType: AlertType
): Promise<void> {
  try {
    // Step 1: Get Tenant and Elder data
    const tenantDoc = await db.collection('tenants').doc(tenantId).get();
    const elderDoc = await db.collection('elders').doc(elderId).get();

    if (!tenantDoc.exists || !elderDoc.exists) {
      logError('Tenant or Elder not found', { tenantId, elderId });
      return;
    }

    const tenant = tenantDoc.data() as Tenant;
    const elder = elderDoc.data() as Elder;

    // Step 2: Build alert message
    const message = buildAlertMessage(elder, alertType);

    // Step 3: Send to all users who joined the LINE OA using broadcast API
    try {
      await axios.post(
        'https://api.line.me/v2/bot/message/broadcast',
        {
          messages: [
            {
              type: 'text',
              text: message,
            },
            {
              type: 'template',
              altText: '查看詳細資訊',
              template: {
                type: 'buttons',
                text: '點擊下方按鈕查看更多',
                actions: [
                  {
                    type: 'uri',
                    label: '查看詳細資訊',
                    uri: `https://liff.line.me/${tenant.lineConfig.liffId}?liff.state=%2Felder%2F${elderId}`,
                  },
                ],
              },
            },
          ],
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tenant.lineConfig.channelAccessToken}`,
          },
        }
      );

      logInfo('LINE broadcast notification sent', { tenantId, elderId, alertType });
    } catch (error: any) {
      logError('Failed to send LINE broadcast notification', {
        tenantId,
        elderId,
        error: error.response?.data || error.message,
      });
    }

    // Update alert notification status
    const alertSnapshot = await db
      .collection('alerts')
      .where('elderId', '==', elderId)
      .where('alertType', '==', alertType)
      .where('notificationSent', '==', false)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (!alertSnapshot.empty) {
      await alertSnapshot.docs[0].ref.update({
        notificationSent: true,
        notificationSentAt: new Date().toISOString(),
      });
    }
  } catch (error: any) {
    logError('Error sending LINE notification', error);
  }
}

/**
 * Send first signal of the day notification
 */
export async function sendFirstSignalNotification(
  tenantId: string,
  elderId: string,
  location?: string
): Promise<void> {
  try {
    // Step 1: Get Tenant and Elder data
    const tenantDoc = await db.collection('tenants').doc(tenantId).get();
    const elderDoc = await db.collection('elders').doc(elderId).get();

    if (!tenantDoc.exists || !elderDoc.exists) {
      logError('Tenant or Elder not found', { tenantId, elderId });
      return;
    }

    const tenant = tenantDoc.data() as Tenant;
    const elder = elderDoc.data() as Elder;

    // Step 2: Build message
    const timestamp = new Date().toLocaleString('zh-TW', { 
      timeZone: 'Asia/Taipei',
      hour: '2-digit',
      minute: '2-digit',
    });
    
    const message = 
      `✅ 活動通知\n\n` +
      `姓名：${elder.name}\n` +
      `時間：${timestamp}\n` +
      (location ? `地點：${location}\n` : '') +
      `\n${elder.name} 今日首次活動訊號已收到！`;

    // Step 3: Send to all users who joined the LINE OA using broadcast API
    try {
      await axios.post(
        'https://api.line.me/v2/bot/message/broadcast',
        {
          messages: [
            {
              type: 'text',
              text: message,
            },
            {
              type: 'template',
              altText: '查看詳細資訊',
              template: {
                type: 'buttons',
                text: '點擊查看長者詳細資訊',
                actions: [
                  {
                    type: 'uri',
                    label: '查看詳細資訊',
                    uri: `https://liff.line.me/${tenant.lineConfig.liffId}?liff.state=%2Felder%2F${elderId}`,
                  },
                ],
              },
            },
          ],
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tenant.lineConfig.channelAccessToken}`,
          },
        }
      );

      logInfo('LINE first signal notification sent', { tenantId, elderId });
    } catch (error: any) {
      logError('Failed to send LINE first signal notification', {
        tenantId,
        elderId,
        error: error.response?.data || error.message,
      });
    }
  } catch (error: any) {
    logError('Error sending first signal notification', error);
  }
}

/**
 * Build alert message based on alert type
 */
function buildAlertMessage(elder: Elder, alertType: AlertType): string {
  const baseMessage = `⚠️ 警報通知\n\n姓名：${elder.name}\n`;
  const timestamp = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });

  switch (alertType) {
    case 'emergency':
      return (
        baseMessage +
        `類型：緊急求救\n時間：${timestamp}\n\n請立即確認長者狀況！`
      );
    case 'inactivity':
      const lastSeenTime = new Date(elder.lastSeen).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
      return (
        baseMessage +
        `類型：長時間未活動\n最後出現：${lastSeenTime}\n\n請確認長者是否安全。`
      );
    case 'low_battery':
      return (
        baseMessage +
        `類型：裝置電量不足\n時間：${timestamp}\n\n請提醒長者充電。`
      );
    case 'device_offline':
      return (
        baseMessage +
        `類型：裝置離線\n時間：${timestamp}\n\n裝置已超過 24 小時無訊號。`
      );
    default:
      return baseMessage + `類型：其他異常\n請查看詳細資訊。`;
  }
}
