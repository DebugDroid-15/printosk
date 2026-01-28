/**
 * Utility functions for the frontend
 */

/**
 * Format file size to human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format currency
 */
export function formatCurrency(
  amount: number,
  currency: string = 'INR'
): string {
  const symbols: { [key: string]: string } = {
    INR: '₹',
    USD: '$',
    EUR: '€',
  };
  return (symbols[currency] || currency) + (amount / 100).toFixed(2);
}

/**
 * Validate email
 */
export function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Validate phone number (basic validation for Indian numbers)
 */
export function isValidPhoneNumber(phone: string): boolean {
  const re = /^[6-9]\d{9}$/;
  return re.test(phone.replace(/\D/g, ''));
}

/**
 * Validate file type
 */
export function isValidFileType(file: File): boolean {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];
  return allowedTypes.includes(file.type);
}

/**
 * Validate file size (max 50MB)
 */
export function isValidFileSize(file: File, maxMB: number = 50): boolean {
  return file.size <= maxMB * 1024 * 1024;
}

/**
 * Validate file (type and size)
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!isValidFileType(file)) {
    return {
      valid: false,
      error: `File type not supported. Allowed: PDF, DOC, DOCX, JPG, PNG`,
    };
  }
  if (!isValidFileSize(file, 50)) {
    return {
      valid: false,
      error: `File size exceeds 50MB limit`,
    };
  }
  return { valid: true };
}

/**
 * Validate email alias
 */
export function validateEmail(email: string): boolean {
  return isValidEmail(email);
}

/**
 * Generate random Print ID for display (actual one is from server)
 */
export function generateTempPrintId(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Wait for ms milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}
