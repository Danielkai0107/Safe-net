// ==================== Tenant Types ====================

export interface LineConfig {
  // Messaging API Channel (for sending notifications)
  channelAccessToken: string;
  channelSecret: string;

  // LINE Login Channel LIFF App (for user login and management)
  liffId: string;
}

export interface Subscription {
  plan: "basic" | "pro" | "enterprise";
  startDate: string; // ISO 8601
  endDate: string;
  status: "active" | "suspended" | "expired";
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

// ==================== LINE User Types ====================

export interface LineUser {
  id: string; // LINE User ID
  tenantId: string; // 所屬社區
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
  firstSeenAt: string; // 首次使用 LIFF 的時間
  lastSeenAt: string; // 最後使用 LIFF 的時間
  createdAt: string;
  updatedAt: string;
}

// ==================== Device Types ====================

export type DeviceStatus = "available" | "assigned" | "maintenance" | "retired";

export interface Device {
  id: string;
  tenantId: string; // 所屬社區
  macAddress: string; // Beacon MAC Address (唯一)
  deviceNumber: string; // 自動產生：社區代碼+001
  status: DeviceStatus;
  assignedElderId?: string; // 配發給哪位長者
  assignedElderName?: string; // 冗餘儲存
  lastBatteryLevel?: number; // 最新電量 (0-100)
  lastBatteryUpdate?: string; // 最後電量更新時間
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== Gateway (接收點) Types ====================

export type GatewayStatus = "active" | "inactive" | "maintenance";

export interface Gateway {
  id: string;
  tenantId: string; // 所屬社區
  gatewayNumber: string; // 自動產生：社區代碼+001
  serialNumber: string; // 接收裝置序號
  location: string; // 地點名稱
  address?: string; // 詳細地址
  isBoundary: boolean; // 是否為邊界點
  status: GatewayStatus;
  lastSeen?: string; // 最後上線時間
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== Location Log Types ====================

export interface LocationLog {
  id: string;
  tenantId: string;
  elderId: string;
  elderName: string; // 冗餘儲存
  macAddress: string;
  gatewayId: string;
  gatewayNumber: string; // 冗餘儲存
  location: string; // 冗餘儲存地點名稱
  isBoundary: boolean; // 冗餘儲存是否為邊界點
  rssi: number;
  timestamp: string;
  createdAt: string;
}

// ==================== Elder Types ====================

export type ElderStatus = "active" | "inactive" | "offline";
export type Gender = "male" | "female" | "other";

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

export type SignalType = "normal" | "emergency" | "health" | "other";

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

export type AlertType =
  | "emergency"
  | "inactivity"
  | "low_battery"
  | "device_offline";
export type AlertSeverity = "low" | "medium" | "high" | "critical";
export type AlertStatus = "pending" | "acknowledged" | "resolved";

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
  deviceId?: string; // 關聯的裝置ID
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
  deviceId?: string; // 關聯的裝置ID
  status?: ElderStatus;
  notes?: string;
}

// Device CRUD
export interface CreateDeviceRequest {
  tenantId: string;
  macAddress: string;
  notes?: string;
}

export interface UpdateDeviceRequest {
  macAddress?: string;
  status?: DeviceStatus;
  assignedElderId?: string;
  notes?: string;
}

// Gateway CRUD
export interface CreateGatewayRequest {
  tenantId: string;
  serialNumber: string;
  location: string;
  address?: string;
  isBoundary: boolean;
  notes?: string;
}

export interface UpdateGatewayRequest {
  serialNumber?: string;
  location?: string;
  address?: string;
  isBoundary?: boolean;
  status?: GatewayStatus;
  notes?: string;
}

// Alert CRUD
export interface AcknowledgeAlertRequest {
  acknowledgedBy: string; // LINE User ID
}

// ==================== Legacy Types (for compatibility) ====================

export interface HardwareSignal {
  tenantId: string;
  elderId: string;
  signalType: SignalType;
  timestamp: Date;
  data?: Record<string, any>;
}

export interface SendSignalRequest {
  tenantId: string;
  elderId: string;
  signalType: SignalType;
  data?: Record<string, any>;
}

export interface SendSignalResponse {
  success: boolean;
  message: string;
  signalId?: string;
}
