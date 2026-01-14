import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Tenant, Elder } from '../types';
import { logInfo, logError } from '../utils/logger';
import { sendLineNotification } from '../notifications/lineNotification';

const db = admin.firestore();

/**
 * Scheduled function: checkInactivityAlerts
 * Runs every hour to check for inactive elders
 */
export const checkInactivityAlerts = functions.pubsub
  .schedule('every 1 hours')
  .timeZone('Asia/Taipei')
  .onRun(async (context) => {
    logInfo('Starting inactivity check');

    try {
      // Get all active tenants
      const tenantsSnapshot = await db
        .collection('tenants')
        .where('subscription.status', '==', 'active')
        .get();

      logInfo('Found active tenants', { count: tenantsSnapshot.size });

      for (const tenantDoc of tenantsSnapshot.docs) {
        const tenant = tenantDoc.data() as Tenant;
        const tenantId = tenantDoc.id;

        // Check if inactivity alerts are enabled
        if (!tenant.settings.enableInactivityAlert) {
          logInfo('Inactivity alerts disabled for tenant', { tenantId });
          continue;
        }

        const thresholdHours = tenant.settings.alertThresholdHours || 12;
        const thresholdTime = new Date(Date.now() - thresholdHours * 60 * 60 * 1000);

        logInfo('Checking elders for tenant', {
          tenantId,
          tenantName: tenant.name,
          thresholdHours,
        });

        // Get all active elders for this tenant
        const eldersSnapshot = await db
          .collection('elders')
          .where('tenantId', '==', tenantId)
          .where('status', '==', 'active')
          .get();

        logInfo('Found active elders', { count: eldersSnapshot.size });

        for (const elderDoc of eldersSnapshot.docs) {
          const elder = elderDoc.data() as Elder;
          const elderId = elderDoc.id;
          const lastSeen = new Date(elder.lastSeen);

          logInfo('Checking elder', {
            elderId,
            elderName: elder.name,
            lastSeen: elder.lastSeen,
            thresholdTime: thresholdTime.toISOString(),
          });

          // Check if elder has been inactive for too long
          if (lastSeen < thresholdTime) {
            logInfo('Elder inactive for too long', {
              elderId,
              elderName: elder.name,
              lastSeen: elder.lastSeen,
            });

            // Check if there's already a pending/acknowledged inactivity alert
            const existingAlertSnapshot = await db
              .collection('alerts')
              .where('elderId', '==', elderId)
              .where('alertType', '==', 'inactivity')
              .where('status', 'in', ['pending', 'acknowledged'])
              .limit(1)
              .get();

            if (existingAlertSnapshot.empty) {
              // Create new inactivity alert
              const hoursSinceLastSeen = Math.floor(
                (Date.now() - lastSeen.getTime()) / (1000 * 60 * 60)
              );

              await db.collection('alerts').add({
                tenantId,
                elderId,
                elderName: elder.name,
                alertType: 'inactivity',
                severity: 'high',
                message: `${elder.name} 已超過 ${hoursSinceLastSeen} 小時未偵測到活動訊號`,
                status: 'pending',
                notificationSent: false,
                createdAt: new Date().toISOString(),
              });

              logInfo('Inactivity alert created', { elderId });

              // Send LINE notification
              await sendLineNotification(tenantId, elderId, 'inactivity');

              // Update elder status to offline
              await db.collection('elders').doc(elderId).update({
                status: 'offline',
                updatedAt: new Date().toISOString(),
              });
            } else {
              logInfo('Inactivity alert already exists', { elderId });
            }
          }
        }
      }

      logInfo('Inactivity check completed');
    } catch (error: any) {
      logError('Error in inactivity check', error);
    }
  });
