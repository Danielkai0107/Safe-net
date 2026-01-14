import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { CreateElderRequest, UpdateElderRequest, Elder } from '../types';
import { isValidMacAddress } from '../utils/validation';
import { logInfo, logError } from '../utils/logger';

const db = admin.firestore();

/**
 * Create a new elder
 */
export const createElder = functions.https.onRequest(async (req, res) => {
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
    const request: CreateElderRequest = req.body;

    // Validation
    if (!request.tenantId || !request.name || !request.macAddress) {
      res.status(400).json({
        success: false,
        error: 'MISSING_FIELDS',
        message: 'tenantId, name, and macAddress are required',
      });
      return;
    }

    // Validate MAC Address
    if (!isValidMacAddress(request.macAddress)) {
      res.status(400).json({
        success: false,
        error: 'INVALID_MAC_ADDRESS',
        message: 'Invalid MAC Address format',
      });
      return;
    }

    // Check if MAC Address already exists
    const existingElder = await db
      .collection('elders')
      .where('macAddress', '==', request.macAddress)
      .limit(1)
      .get();

    if (!existingElder.empty) {
      res.status(409).json({
        success: false,
        error: 'MAC_ADDRESS_EXISTS',
        message: 'This MAC Address is already registered',
      });
      return;
    }

    // Create elder
    const now = new Date().toISOString();
    const elderData: Omit<Elder, 'id'> = {
      tenantId: request.tenantId,
      name: request.name,
      age: request.age,
      gender: request.gender,
      address: request.address || '',
      contactPhone: request.contactPhone || '',
      emergencyContact: request.emergencyContact || '',
      emergencyPhone: request.emergencyPhone || '',
      macAddress: request.macAddress,
      status: 'inactive',
      lastSeen: now,
      notes: request.notes || '',
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await db.collection('elders').add(elderData);
    logInfo('Elder created', { elderId: docRef.id });

    res.status(201).json({
      success: true,
      data: { id: docRef.id, ...elderData },
    });
  } catch (error: any) {
    logError('Error creating elder', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

/**
 * Update an elder
 */
export const updateElder = functions.https.onRequest(async (req, res) => {
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
    const elderId = req.query.id as string;
    const request: UpdateElderRequest = req.body;

    if (!elderId) {
      res.status(400).json({ success: false, error: 'MISSING_ELDER_ID' });
      return;
    }

    // If updating MAC Address, check for duplicates
    if (request.macAddress) {
      if (!isValidMacAddress(request.macAddress)) {
        res.status(400).json({
          success: false,
          error: 'INVALID_MAC_ADDRESS',
          message: 'Invalid MAC Address format',
        });
        return;
      }

      const existingElder = await db
        .collection('elders')
        .where('macAddress', '==', request.macAddress)
        .limit(1)
        .get();

      if (!existingElder.empty && existingElder.docs[0].id !== elderId) {
        res.status(409).json({
          success: false,
          error: 'MAC_ADDRESS_EXISTS',
          message: 'This MAC Address is already registered',
        });
        return;
      }
    }

    const updateData: any = {
      ...request,
      updatedAt: new Date().toISOString(),
    };

    await db.collection('elders').doc(elderId).update(updateData);
    logInfo('Elder updated', { elderId });

    res.status(200).json({ success: true });
  } catch (error: any) {
    logError('Error updating elder', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

/**
 * Get an elder by ID
 */
export const getElder = functions.https.onRequest(async (req, res) => {
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
    const elderId = req.query.id as string;

    if (!elderId) {
      res.status(400).json({ success: false, error: 'MISSING_ELDER_ID' });
      return;
    }

    const doc = await db.collection('elders').doc(elderId).get();

    if (!doc.exists) {
      res.status(404).json({ success: false, error: 'ELDER_NOT_FOUND' });
      return;
    }

    res.status(200).json({
      success: true,
      data: { id: doc.id, ...doc.data() },
    });
  } catch (error: any) {
    logError('Error getting elder', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

/**
 * List elders (optionally filtered by tenantId)
 */
export const listElders = functions.https.onRequest(async (req, res) => {
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

    let query: admin.firestore.Query = db.collection('elders');

    if (tenantId) {
      query = query.where('tenantId', '==', tenantId);
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get();
    const elders = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    res.status(200).json({
      success: true,
      data: elders,
    });
  } catch (error: any) {
    logError('Error listing elders', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

/**
 * Delete (soft delete) an elder
 */
export const deleteElder = functions.https.onRequest(async (req, res) => {
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
    const elderId = req.query.id as string;

    if (!elderId) {
      res.status(400).json({ success: false, error: 'MISSING_ELDER_ID' });
      return;
    }

    await db.collection('elders').doc(elderId).update({
      status: 'inactive',
      updatedAt: new Date().toISOString(),
    });

    logInfo('Elder deleted (soft)', { elderId });

    res.status(200).json({ success: true });
  } catch (error: any) {
    logError('Error deleting elder', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});
