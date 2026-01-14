import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { AcknowledgeAlertRequest } from '../types';
import { logInfo, logError } from '../utils/logger';

const db = admin.firestore();

/**
 * List alerts (filtered by tenantId)
 */
export const listAlerts = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ success: false, error: 'METHOD_NOT_ALLOWED' });
    return;
  }

  try {
    const tenantId = req.query.tenantId as string;
    const status = req.query.status as string;

    if (!tenantId) {
      res.status(400).json({
        success: false,
        error: 'MISSING_TENANT_ID',
        message: 'tenantId is required',
      });
      return;
    }

    let query: admin.firestore.Query = db
      .collection('alerts')
      .where('tenantId', '==', tenantId);

    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.orderBy('createdAt', 'desc').limit(100).get();
    const alerts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    res.status(200).json({
      success: true,
      data: alerts,
    });
  } catch (error: any) {
    logError('Error listing alerts', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

/**
 * Acknowledge an alert
 */
export const acknowledgeAlert = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'PUT') {
    res.status(405).json({ success: false, error: 'METHOD_NOT_ALLOWED' });
    return;
  }

  try {
    const alertId = req.query.id as string;
    const request: AcknowledgeAlertRequest = req.body;

    if (!alertId) {
      res.status(400).json({ success: false, error: 'MISSING_ALERT_ID' });
      return;
    }

    if (!request.acknowledgedBy) {
      res.status(400).json({
        success: false,
        error: 'MISSING_ACKNOWLEDGED_BY',
        message: 'acknowledgedBy (LINE User ID) is required',
      });
      return;
    }

    await db
      .collection('alerts')
      .doc(alertId)
      .update({
        status: 'acknowledged',
        acknowledgedBy: request.acknowledgedBy,
        acknowledgedAt: new Date().toISOString(),
      });

    logInfo('Alert acknowledged', { alertId, acknowledgedBy: request.acknowledgedBy });

    res.status(200).json({ success: true });
  } catch (error: any) {
    logError('Error acknowledging alert', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

/**
 * Resolve an alert
 */
export const resolveAlert = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'PUT') {
    res.status(405).json({ success: false, error: 'METHOD_NOT_ALLOWED' });
    return;
  }

  try {
    const alertId = req.query.id as string;

    if (!alertId) {
      res.status(400).json({ success: false, error: 'MISSING_ALERT_ID' });
      return;
    }

    await db
      .collection('alerts')
      .doc(alertId)
      .update({
        status: 'resolved',
        resolvedAt: new Date().toISOString(),
      });

    logInfo('Alert resolved', { alertId });

    res.status(200).json({ success: true });
  } catch (error: any) {
    logError('Error resolving alert', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});
