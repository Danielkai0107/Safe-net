import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// Export all Cloud Functions
export { receiveSignal } from './receiveSignal';
export { createTenant, updateTenant, getTenant, listTenants, deleteTenant } from './api/tenants';
export { createElder, updateElder, getElder, listElders, deleteElder } from './api/elders';
export { listAlerts, acknowledgeAlert, resolveAlert } from './api/alerts';
export { sendTestNotification } from './api/testNotification';
export { checkInactivityAlerts } from './scheduled/inactivityCheck';
