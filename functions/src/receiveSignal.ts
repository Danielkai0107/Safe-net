import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { ReceiveSignalRequest, ReceiveSignalResponse, Elder } from './types';
import { isValidMacAddress, isValidRssi } from './utils/validation';
import { logInfo, logError } from './utils/logger';
import { sendLineNotification, sendFirstSignalNotification } from './notifications/lineNotification';

const db = admin.firestore();

/**
 * Cloud Function: receiveSignal
 * 接收 Gateway 發送的 BLE 訊號
 */
export const receiveSignal = functions.https.onRequest(async (req, res) => {
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
    const request: ReceiveSignalRequest = req.body;

    // Step 1: Validate request
    if (!request.macAddress || !request.rssi || !request.gatewayId) {
      res.status(400).json({
        success: false,
        error: 'MISSING_FIELDS',
        message: 'Missing required fields: macAddress, rssi, gatewayId',
      });
      return;
    }

    // Validate MAC Address format
    if (!isValidMacAddress(request.macAddress)) {
      res.status(400).json({
        success: false,
        error: 'INVALID_MAC_ADDRESS',
        message: 'Invalid MAC Address format',
      });
      return;
    }

    // Validate RSSI
    if (!isValidRssi(request.rssi)) {
      res.status(400).json({
        success: false,
        error: 'INVALID_RSSI',
        message: 'RSSI must be between -100 and 0',
      });
      return;
    }

    logInfo('Received signal', request);

    // Step 2: Query elder by MAC Address
    const elderSnapshot = await db
      .collection('elders')
      .where('macAddress', '==', request.macAddress)
      .limit(1)
      .get();

    if (elderSnapshot.empty) {
      logError('Elder not found', { macAddress: request.macAddress });
      res.status(404).json({
        success: false,
        error: 'ELDER_NOT_FOUND',
        message: `No elder found with MAC address: ${request.macAddress}`,
      });
      return;
    }

    const elderDoc = elderSnapshot.docs[0];
    const elder = elderDoc.data() as Elder;
    const elderId = elderDoc.id;

    logInfo('Found elder', { elderId, name: elder.name });

    // Step 3: Query gateway information
    const gatewaySnapshot = await db
      .collection('gateways')
      .where('serialNumber', '==', request.gatewayId)
      .where('tenantId', '==', elder.tenantId)
      .limit(1)
      .get();

    let gateway = null;
    let isBoundary = false;
    let gatewayNumber = '';
    let location = '';

    if (!gatewaySnapshot.empty) {
      gateway = gatewaySnapshot.docs[0].data();
      isBoundary = gateway.isBoundary || false;
      gatewayNumber = gateway.gatewayNumber || '';
      location = gateway.location || '';
      
      // Update gateway last seen
      await gatewaySnapshot.docs[0].ref.update({
        lastSeen: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      logInfo('Found gateway', { 
        gatewayId: gatewaySnapshot.docs[0].id, 
        location, 
        isBoundary 
      });
    } else {
      logInfo('Gateway not found in database', { gatewayId: request.gatewayId });
    }

    // Step 4: Add signal log
    const timestamp = request.timestamp || new Date().toISOString();
    const signalType = request.signalType || 'normal';

    const logRef = await db.collection('logs').add({
      tenantId: elder.tenantId,
      elderId: elderId,
      macAddress: request.macAddress,
      rssi: request.rssi,
      gatewayId: request.gatewayId,
      signalType: signalType,
      timestamp: timestamp,
      metadata: request.metadata || {},
      createdAt: new Date().toISOString(),
    });

    logInfo('Signal log created', { logId: logRef.id });

    // Step 5: Add location log (長輩行蹤記錄)
    if (gateway) {
      await db.collection('locationLogs').add({
        tenantId: elder.tenantId,
        elderId: elderId,
        elderName: elder.name,
        macAddress: request.macAddress,
        gatewayId: gatewaySnapshot.docs[0].id,
        gatewayNumber: gatewayNumber,
        location: location,
        isBoundary: isBoundary,
        rssi: request.rssi,
        timestamp: timestamp,
        createdAt: new Date().toISOString(),
      });
      
      logInfo('Location log created', { elderId, location, isBoundary });
    }

    // Step 6: Update elder's last seen
    await db
      .collection('elders')
      .doc(elderId)
      .update({
        lastSeen: timestamp,
        lastSignalRssi: request.rssi,
        lastGatewayId: request.gatewayId,
        status: 'active',
        updatedAt: new Date().toISOString(),
      });

    logInfo('Elder updated', { elderId });

    // Step 6.5: Update device battery level if exists
    if (elder.deviceId && request.metadata?.batteryLevel !== undefined) {
      try {
        await db
          .collection('devices')
          .doc(elder.deviceId)
          .update({
            lastBatteryLevel: request.metadata.batteryLevel,
            lastBatteryUpdate: timestamp,
            updatedAt: new Date().toISOString(),
          });
        logInfo('Device battery updated', { 
          deviceId: elder.deviceId, 
          batteryLevel: request.metadata.batteryLevel 
        });
      } catch (error: any) {
        logError('Failed to update device battery', { 
          deviceId: elder.deviceId, 
          error: error.message 
        });
      }
    }

    // Step 6.8: Check if this is the first signal of the day
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayStartISO = todayStart.toISOString();

    const todaySignalsSnapshot = await db
      .collection('logs')
      .where('elderId', '==', elderId)
      .where('timestamp', '>=', todayStartISO)
      .limit(1)
      .get();

    const isFirstSignalToday = todaySignalsSnapshot.empty;

    if (isFirstSignalToday) {
      logInfo('First signal of the day detected', { 
        elderId, 
        elderName: elder.name,
        time: new Date(timestamp).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })
      });
      
      // 發送當日第一筆訊號通知（僅發送通知，不創建 alert）
      try {
        await sendFirstSignalNotification(elder.tenantId, elderId, location);
        logInfo('First signal notification sent', { elderId, location });
      } catch (error: any) {
        logError('Failed to send first signal notification', { elderId, error: error.message });
      }
    }

    // Step 7: Check if alert should be triggered
    let alertTriggered = false;

    // 7.0 Boundary alert (邊界點警報)
    if (isBoundary && gateway) {
      await createAlert(
        elder.tenantId,
        elderId,
        elder.name,
        'inactivity', // 使用 inactivity 類型，訊息中會說明是邊界點警報
        'medium',
        `${elder.name} 經過邊界點「${location}」`
      );
      await sendLineNotification(elder.tenantId, elderId, 'inactivity');
      alertTriggered = true;
      logInfo('Boundary alert triggered', { elderId, location });
    }

    // 7.1 Emergency alert
    if (signalType === 'emergency') {
      await createAlert(
        elder.tenantId,
        elderId,
        elder.name,
        'emergency',
        'critical',
        `${elder.name} 觸發緊急求救按鈕！${location ? ` 位置：${location}` : ''}`
      );
      await sendLineNotification(elder.tenantId, elderId, 'emergency');
      alertTriggered = true;
      logInfo('Emergency alert triggered', { elderId, location });
    }

    // 7.2 Low battery alert
    if (request.metadata?.batteryLevel !== undefined && signalType !== 'emergency') {
      if (request.metadata.batteryLevel < 5) {
        await createAlert(
          elder.tenantId,
          elderId,
          elder.name,
          'low_battery',
          'high',
          `${elder.name} 的裝置電量不足 5%，即將耗盡！`
        );
        await sendLineNotification(elder.tenantId, elderId, 'low_battery');
        alertTriggered = true;
        logInfo('Critical low battery alert triggered', { elderId, batteryLevel: request.metadata.batteryLevel });
      } else if (request.metadata.batteryLevel < 20) {
        await createAlert(
          elder.tenantId,
          elderId,
          elder.name,
          'low_battery',
          'medium',
          `${elder.name} 的裝置電量不足 20%`
        );
        await sendLineNotification(elder.tenantId, elderId, 'low_battery');
        alertTriggered = true;
        logInfo('Low battery alert triggered', { elderId, batteryLevel: request.metadata.batteryLevel });
      }
    }

    // Step 8: Return response
    const response: ReceiveSignalResponse = {
      success: true,
      message: 'Signal processed successfully',
      data: {
        logId: logRef.id,
        elderName: elder.name,
        alertTriggered,
      },
    };

    res.status(200).json(response);
  } catch (error: any) {
    logError('Error processing signal', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to process signal',
    });
  }
});

/**
 * Helper function to create alert
 */
async function createAlert(
  tenantId: string,
  elderId: string,
  elderName: string,
  alertType: 'emergency' | 'inactivity' | 'low_battery' | 'device_offline',
  severity: 'low' | 'medium' | 'high' | 'critical',
  message: string
): Promise<string> {
  const alertRef = await db.collection('alerts').add({
    tenantId,
    elderId,
    elderName,
    alertType,
    severity,
    message,
    status: 'pending',
    notificationSent: false,
    createdAt: new Date().toISOString(),
  });

  logInfo('Alert created', { alertId: alertRef.id, alertType });
  return alertRef.id;
}
