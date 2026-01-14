import * as functions from 'firebase-functions';
import { sendLineNotification } from '../notifications/lineNotification';
import { logInfo, logError } from '../utils/logger';
import type { AlertType } from '../types';

/**
 * Cloud Function: sendTestNotification
 * 測試 LINE 通知發送功能
 */
export const sendTestNotification = functions.https.onRequest(
  async (req, res) => {
    // Enable CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight request
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    // Only allow POST
    if (req.method !== 'POST') {
      res.status(405).json({
        success: false,
        error: 'METHOD_NOT_ALLOWED',
        message: 'Only POST method is allowed',
      });
      return;
    }

    try {
      const { tenantId, elderId, alertType } = req.body;

      // Validate request
      if (!tenantId || !elderId || !alertType) {
        res.status(400).json({
          success: false,
          error: 'MISSING_FIELDS',
          message: 'Missing required fields: tenantId, elderId, alertType',
        });
        return;
      }

      // Validate alert type
      const validAlertTypes: AlertType[] = [
        'emergency',
        'inactivity',
        'low_battery',
        'device_offline',
      ];
      if (!validAlertTypes.includes(alertType as AlertType)) {
        res.status(400).json({
          success: false,
          error: 'INVALID_ALERT_TYPE',
          message: `Invalid alert type. Must be one of: ${validAlertTypes.join(', ')}`,
        });
        return;
      }

      logInfo('Sending test notification', { tenantId, elderId, alertType });

      // Send LINE notification
      await sendLineNotification(tenantId, elderId, alertType as AlertType);

      logInfo('Test notification sent successfully', {
        tenantId,
        elderId,
        alertType,
      });

      res.status(200).json({
        success: true,
        message: 'Test notification sent successfully',
      });
    } catch (error: any) {
      logError('Error sending test notification', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to send test notification',
        details: error.message,
      });
    }
  }
);
