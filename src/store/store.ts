import { create } from 'zustand';
import { collection, query, where, onSnapshot, doc, getDoc, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Tenant, Elder, Alert } from '../types';

interface AppState {
  // Current selected tenant (community)
  selectedTenant: Tenant | null;
  setSelectedTenant: (tenant: Tenant | null) => void;

  // Current selected elder (user)
  selectedElder: Elder | null;
  setSelectedElder: (elder: Elder | null) => void;

  // Tenant list for dropdown
  tenants: Tenant[];
  setTenants: (tenants: Tenant[]) => void;

  // Elders list for dropdown
  elders: Elder[];
  setElders: (elders: Elder[]) => void;

  // Alerts list
  alerts: Alert[];
  setAlerts: (alerts: Alert[]) => void;

  // Loading states
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;

  // Error state
  error: string | null;
  setError: (error: string | null) => void;

  // Actions - Tenants
  fetchTenants: () => Promise<void>;
  fetchTenantById: (id: string) => Promise<Tenant | null>;

  // Actions - Elders
  fetchElders: (tenantId?: string) => Promise<void>;
  fetchElderById: (id: string) => Promise<Elder | null>;
  subscribeToElders: (tenantId: string) => () => void;

  // Actions - Alerts
  fetchAlerts: (tenantId: string) => Promise<void>;
  subscribeToAlerts: (tenantId: string) => () => void;

  // LINE User ID (for LIFF)
  lineUserId: string | null;
  setLineUserId: (userId: string | null) => void;

  // Current tenant ID (for Tenant Admin in LIFF)
  currentTenantId: string | null;
  setCurrentTenantId: (tenantId: string | null) => void;

  // Current tenant info (for LIFF)
  currentTenant: Tenant | null;
  setCurrentTenant: (tenant: Tenant | null) => void;

  // Check if current LINE user is admin
  isAdmin: boolean;
  setIsAdmin: (isAdmin: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial states
  selectedTenant: null,
  selectedElder: null,
  tenants: [],
  elders: [],
  alerts: [],
  isLoading: false,
  error: null,
  lineUserId: null,
  currentTenantId: null,
  currentTenant: null,
  isAdmin: false,

  // Basic setters
  setSelectedTenant: (tenant) => set({ selectedTenant: tenant }),
  setSelectedElder: (elder) => set({ selectedElder: elder }),
  setTenants: (tenants) => set({ tenants }),
  setElders: (elders) => set({ elders }),
  setAlerts: (alerts) => set({ alerts }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setLineUserId: (userId) => set({ lineUserId: userId }),
  setCurrentTenantId: (tenantId) => set({ currentTenantId: tenantId }),
  setCurrentTenant: (tenant) => set({ currentTenant: tenant }),
  setIsAdmin: (isAdmin) => set({ isAdmin }),

  // Fetch all tenants (exclude expired/deleted ones)
  fetchTenants: async () => {
    set({ isLoading: true, error: null });
    try {
      const tenantsRef = collection(db, 'tenants');
      const q = query(
        tenantsRef,
        where('subscription.status', '!=', 'expired'),
        orderBy('subscription.status'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const tenants: Tenant[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Tenant));
      set({ tenants, isLoading: false });
    } catch (error: any) {
      console.error('Error fetching tenants:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  // Fetch tenant by ID
  fetchTenantById: async (id: string) => {
    try {
      const docRef = doc(db, 'tenants', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Tenant;
      }
      return null;
    } catch (error: any) {
      console.error('Error fetching tenant:', error);
      return null;
    }
  },

  // Fetch elders (optionally filtered by tenantId)
  fetchElders: async (tenantId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const eldersRef = collection(db, 'elders');
      let q;
      if (tenantId) {
        q = query(eldersRef, where('tenantId', '==', tenantId), orderBy('createdAt', 'desc'));
      } else {
        q = query(eldersRef, orderBy('createdAt', 'desc'));
      }
      const snapshot = await getDocs(q);
      const elders: Elder[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Elder));
      set({ elders, isLoading: false });
    } catch (error: any) {
      console.error('Error fetching elders:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  // Fetch elder by ID
  fetchElderById: async (id: string) => {
    try {
      const docRef = doc(db, 'elders', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Elder;
      }
      return null;
    } catch (error: any) {
      console.error('Error fetching elder:', error);
      return null;
    }
  },

  // Subscribe to real-time elders updates
  subscribeToElders: (tenantId: string) => {
    const eldersRef = collection(db, 'elders');
    const q = query(eldersRef, where('tenantId', '==', tenantId), orderBy('lastSeen', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const elders: Elder[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as Elder));
        set({ elders });
      },
      (error) => {
        console.error('Error subscribing to elders:', error);
        set({ error: error.message });
      }
    );

    return unsubscribe;
  },

  // Fetch alerts for a tenant
  fetchAlerts: async (tenantId: string) => {
    set({ isLoading: true, error: null });
    try {
      const alertsRef = collection(db, 'alerts');
      const q = query(
        alertsRef,
        where('tenantId', '==', tenantId),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
      const snapshot = await getDocs(q);
      const alerts: Alert[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Alert));
      set({ alerts, isLoading: false });
    } catch (error: any) {
      console.error('Error fetching alerts:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  // Subscribe to real-time alerts updates
  subscribeToAlerts: (tenantId: string) => {
    const alertsRef = collection(db, 'alerts');
    const q = query(
      alertsRef,
      where('tenantId', '==', tenantId),
      where('status', 'in', ['pending', 'acknowledged']),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const alerts: Alert[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as Alert));
        set({ alerts });
      },
      (error) => {
        console.error('Error subscribing to alerts:', error);
        set({ error: error.message });
      }
    );

    return unsubscribe;
  },
}));
