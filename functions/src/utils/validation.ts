/**
 * Validation utilities
 */

/**
 * Validate MAC Address format
 * @param macAddress MAC Address string
 * @returns true if valid
 */
export function isValidMacAddress(macAddress: string): boolean {
  const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
  return macRegex.test(macAddress);
}

/**
 * Validate RSSI value
 * @param rssi RSSI value
 * @returns true if valid
 */
export function isValidRssi(rssi: number): boolean {
  return rssi >= -100 && rssi <= 0;
}

/**
 * Validate battery level
 * @param batteryLevel Battery level (0-100)
 * @returns true if valid
 */
export function isValidBatteryLevel(batteryLevel: number): boolean {
  return batteryLevel >= 0 && batteryLevel <= 100;
}

/**
 * Validate LINE User ID format
 * @param userId LINE User ID
 * @returns true if valid
 */
export function isValidLineUserId(userId: string): boolean {
  // LINE User ID 通常以 U 開頭，後接 32 個字符
  const lineIdRegex = /^U[0-9a-f]{32}$/i;
  return lineIdRegex.test(userId);
}
