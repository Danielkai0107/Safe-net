/**
 * Logging utilities
 */

export function logInfo(message: string, data?: any): void {
  console.log(`[INFO] ${message}`, data ? JSON.stringify(data, null, 2) : '');
}

export function logError(message: string, error?: any): void {
  console.error(`[ERROR] ${message}`, error ? JSON.stringify(error, null, 2) : '');
}

export function logWarning(message: string, data?: any): void {
  console.warn(`[WARNING] ${message}`, data ? JSON.stringify(data, null, 2) : '');
}

export function logDebug(message: string, data?: any): void {
  if (process.env.DEBUG === 'true') {
    console.debug(`[DEBUG] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
}
