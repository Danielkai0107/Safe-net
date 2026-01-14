import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { CreateTenantRequest, UpdateTenantRequest, Tenant } from '../types';
import { logInfo, logError } from '../utils/logger';

const db = admin.firestore();

/**
 * Create a new tenant
 */
export const createTenant = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'METHOD_NOT_ALLOWED' });
    return;
  }

  try {
    const request: CreateTenantRequest = req.body;

    // Validation
    if (!request.name || !request.lineConfig) {
      res.status(400).json({
        success: false,
        error: 'MISSING_FIELDS',
        message: 'name and lineConfig are required',
      });
      return;
    }

    // Create tenant
    const now = new Date().toISOString();
    const tenantData: Omit<Tenant, 'id'> = {
      name: request.name,
      address: request.address || '',
      contactPerson: request.contactPerson || '',
      contactPhone: request.contactPhone || '',
      lineConfig: request.lineConfig,
      adminLineIds: request.adminLineIds || [],
      subscription: {
        plan: 'basic',
        startDate: now,
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
      },
      settings: {
        alertThresholdHours: 12,
        enableEmergencyAlert: true,
        enableInactivityAlert: true,
      },
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await db.collection('tenants').add(tenantData);
    logInfo('Tenant created', { tenantId: docRef.id });

    res.status(201).json({
      success: true,
      data: { id: docRef.id, ...tenantData },
    });
  } catch (error: any) {
    logError('Error creating tenant', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

/**
 * Update a tenant
 */
export const updateTenant = functions.https.onRequest(async (req, res) => {
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
    const tenantId = req.query.id as string;
    const request: UpdateTenantRequest = req.body;

    if (!tenantId) {
      res.status(400).json({ success: false, error: 'MISSING_TENANT_ID' });
      return;
    }

    const updateData: any = {
      ...request,
      updatedAt: new Date().toISOString(),
    };

    await db.collection('tenants').doc(tenantId).update(updateData);
    logInfo('Tenant updated', { tenantId });

    res.status(200).json({ success: true });
  } catch (error: any) {
    logError('Error updating tenant', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

/**
 * Get a tenant by ID
 */
export const getTenant = functions.https.onRequest(async (req, res) => {
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
    const tenantId = req.query.id as string;

    if (!tenantId) {
      res.status(400).json({ success: false, error: 'MISSING_TENANT_ID' });
      return;
    }

    const doc = await db.collection('tenants').doc(tenantId).get();

    if (!doc.exists) {
      res.status(404).json({ success: false, error: 'TENANT_NOT_FOUND' });
      return;
    }

    res.status(200).json({
      success: true,
      data: { id: doc.id, ...doc.data() },
    });
  } catch (error: any) {
    logError('Error getting tenant', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

/**
 * List all tenants
 */
export const listTenants = functions.https.onRequest(async (req, res) => {
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
    const snapshot = await db.collection('tenants').orderBy('createdAt', 'desc').get();
    const tenants = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    res.status(200).json({
      success: true,
      data: tenants,
    });
  } catch (error: any) {
    logError('Error listing tenants', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

/**
 * Delete (soft delete) a tenant
 */
export const deleteTenant = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'DELETE') {
    res.status(405).json({ success: false, error: 'METHOD_NOT_ALLOWED' });
    return;
  }

  try {
    const tenantId = req.query.id as string;

    if (!tenantId) {
      res.status(400).json({ success: false, error: 'MISSING_TENANT_ID' });
      return;
    }

    await db.collection('tenants').doc(tenantId).update({
      'subscription.status': 'expired',
      updatedAt: new Date().toISOString(),
    });

    logInfo('Tenant deleted (soft)', { tenantId });

    res.status(200).json({ success: true });
  } catch (error: any) {
    logError('Error deleting tenant', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});
