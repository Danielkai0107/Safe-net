// ==================== Tenant Types ====================

export interface LineConfig {
  channelAccessToken: string;
  channelSecret: string;
  liffId: string;
}

export interface Subscription {
  plan: 'basic' | 'pro' | 'enterprise';
  startDate: string; // ISO 8601
  endDate: string;
  status: 'active' | 'suspended' | 'expired';
}

export interface TenantSettings {
  alertThresholdHours: number; // 預設 12
  enableEmergencyAlert: boolean;
  enableInactivityAlert: boolean;
}

export interface Tenant {
  id: string;
  name: string;
  address?: string;
  contactPerson?: string;
  contactPhone?: string;
  lineConfig: LineConfig;
  adminLineIds: string[]; // LINE User IDs
  subscription: Subscription;
  settings: TenantSettings;
  createdAt: string; // ISO 8601
  updatedAt: string;
}

// ==================== Elder Types ====================

export type ElderStatus = 'active' | 'inactive' | 'offline';
export type Gender = 'male' | 'female' | 'other';

export interface Elder {
  id: string;
  tenantId: string;
  name: string;
  age?: number;
  gender?: Gender;
  address?: string;
  contactPhone?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  macAddress: string; // Beacon MAC Address (唯一)
  deviceId?: string; // 關聯的裝置ID
  status: ElderStatus;
  lastSeen: string; // ISO 8601
  lastSignalRssi?: number;
  lastGatewayId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== Signal Log Types ====================

export type SignalType = 'normal' | 'emergency' | 'health' | 'other';

export interface SignalMetadata {
  batteryLevel?: number; // 0-100
  temperature?: number;
  humidity?: number;
}

export interface SignalLog {
  id: string;
  tenantId: string;
  elderId: string;
  macAddress: string;
  rssi: number; // 訊號強度 (dBm)
  gatewayId: string;
  signalType: SignalType;
  timestamp: string; // ISO 8601
  metadata?: SignalMetadata;
  createdAt: string;
}

// ==================== Alert Types ====================

export type AlertType = 'emergency' | 'inactivity' | 'low_battery' | 'device_offline';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'pending' | 'acknowledged' | 'resolved';

export interface Alert {
  id: string;
  tenantId: string;
  elderId: string;
  elderName: string; // 冗餘儲存
  alertType: AlertType;
  severity: AlertSeverity;
  message: string;
  status: AlertStatus;
  acknowledgedBy?: string; // LINE User ID
  acknowledgedAt?: string;
  resolvedAt?: string;
  notificationSent: boolean;
  notificationSentAt?: string;
  createdAt: string;
}

// ==================== API Request/Response Types ====================

// receiveSignal API
export interface ReceiveSignalRequest {
  macAddress: string;
  rssi: number;
  gatewayId: string;
  signalType?: SignalType;
  timestamp?: string;
  metadata?: SignalMetadata;
}

export interface ReceiveSignalResponse {
  success: boolean;
  message: string;
  data?: {
    logId: string;
    elderName: string;
    alertTriggered: boolean;
  };
  error?: string;
}

// Tenant CRUD
export interface CreateTenantRequest {
  name: string;
  address?: string;
  contactPerson?: string;
  contactPhone?: string;
  lineConfig: LineConfig;
  adminLineIds: string[];
}

export interface UpdateTenantRequest {
  name?: string;
  address?: string;
  contactPerson?: string;
  contactPhone?: string;
  lineConfig?: Partial<LineConfig>;
  adminLineIds?: string[];
  settings?: Partial<TenantSettings>;
}

// Elder CRUD
export interface CreateElderRequest {
  tenantId: string;
  name: string;
  age?: number;
  gender?: Gender;
  address?: string;
  contactPhone?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  macAddress: string;
  notes?: string;
}

export interface UpdateElderRequest {
  name?: string;
  age?: number;
  gender?: Gender;
  address?: string;
  contactPhone?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  macAddress?: string;
  status?: ElderStatus;
  notes?: string;
}

// Alert CRUD
export interface AcknowledgeAlertRequest {
  acknowledgedBy: string; // LINE User ID
}
