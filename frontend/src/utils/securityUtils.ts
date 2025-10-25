/**
 * Security utilities for input validation and sanitization
 */

/**
 * Sanitize string input to prevent XSS attacks
 */
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove script tags and content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove javascript: protocol
    .replace(/javascript:/gi, '')
    // Remove on* event handlers
    .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
    // Remove data: protocol
    .replace(/data:/gi, '')
    // Limit length to prevent buffer overflow
    .substring(0, 1000);
};

/**
 * Validate username format
 */
export const validateUsername = (username: string): { isValid: boolean; error?: string } => {
  const sanitized = sanitizeInput(username);
  
  if (!sanitized) {
    return { isValid: false, error: '用户名不能为空' };
  }
  
  if (sanitized.length < 1) {
    return { isValid: false, error: '用户名长度至少为1个字符' };
  }
  
  if (sanitized.length > 50) {
    return { isValid: false, error: '用户名长度不能超过50个字符' };
  }
  
  // Check for valid characters (alphanumeric, underscore, hyphen, dot)
  const validPattern = /^[a-zA-Z0-9._-]+$/;
  if (!validPattern.test(sanitized)) {
    return { isValid: false, error: '用户名只能包含字母、数字、下划线、连字符和点' };
  }
  
  return { isValid: true };
};

/**
 * Validate password format
 */
export const validatePassword = (password: string): { isValid: boolean; error?: string } => {
  if (typeof password !== 'string') {
    return { isValid: false, error: '密码格式无效' };
  }
  
  if (!password) {
    return { isValid: false, error: '密码不能为空' };
  }
  
  if (password.length < 1) {
    return { isValid: false, error: '密码长度至少为1个字符' };
  }
  
  if (password.length > 200) {
    return { isValid: false, error: '密码长度不能超过200个字符' };
  }
  
  // Check for null bytes and other control characters
  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(password)) {
    return { isValid: false, error: '密码包含无效字符' };
  }
  
  return { isValid: true };
};

/**
 * Rate limiting utility for client-side
 */
export class ClientRateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts: number = 5, windowMs: number = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  /**
   * Check if action is allowed for the given key
   */
  isAllowed(key: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside the window
    const validAttempts = attempts.filter(timestamp => now - timestamp < this.windowMs);
    
    // Update the attempts list
    this.attempts.set(key, validAttempts);
    
    return validAttempts.length < this.maxAttempts;
  }

  /**
   * Record an attempt for the given key
   */
  recordAttempt(key: string): void {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    attempts.push(now);
    this.attempts.set(key, attempts);
  }

  /**
   * Get remaining attempts for the given key
   */
  getRemainingAttempts(key: string): number {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    const validAttempts = attempts.filter(timestamp => now - timestamp < this.windowMs);
    return Math.max(0, this.maxAttempts - validAttempts.length);
  }

  /**
   * Get time until next attempt is allowed (in milliseconds)
   */
  getTimeUntilReset(key: string): number {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    if (attempts.length === 0) {
      return 0;
    }
    
    const oldestAttempt = Math.min(...attempts);
    const timeUntilReset = this.windowMs - (now - oldestAttempt);
    
    return Math.max(0, timeUntilReset);
  }

  /**
   * Clear attempts for the given key
   */
  clearAttempts(key: string): void {
    this.attempts.delete(key);
  }

  /**
   * Clear all attempts
   */
  clearAll(): void {
    this.attempts.clear();
  }
}

/**
 * Global rate limiter instance for authentication attempts
 */
export const authRateLimiter = new ClientRateLimiter(5, 60000); // 5 attempts per minute

/**
 * Secure error logging utility
 */
export const secureLog = {
  /**
   * Log authentication attempt (without sensitive data)
   */
  authAttempt: (username: string, success: boolean, error?: string) => {
    const sanitizedUsername = sanitizeInput(username);
    const logData = {
      timestamp: new Date().toISOString(),
      username: sanitizedUsername,
      success,
      error: error ? sanitizeInput(error) : undefined,
      userAgent: navigator.userAgent,
      ip: 'client-side' // Client-side logging doesn't have access to real IP
    };
    
    console.log('[AUTH]', logData);
    
    // In production, you might want to send this to a logging service
    if (import.meta.env.PROD) {
      // Example: send to logging service
      // logService.send('auth_attempt', logData);
    }
  },

  /**
   * Log security event
   */
  securityEvent: (event: string, details: Record<string, unknown>) => {
    const sanitizedDetails = Object.keys(details).reduce((acc, key) => {
      const value = details[key];
      acc[key] = typeof value === 'string' ? sanitizeInput(value) : value;
      return acc;
    }, {} as Record<string, unknown>);

    const logData = {
      timestamp: new Date().toISOString(),
      event,
      details: sanitizedDetails,
      userAgent: navigator.userAgent
    };
    
    console.warn('[SECURITY]', logData);
    
    // In production, send to security monitoring service
    if (import.meta.env.PROD) {
      // Example: send to security service
      // securityService.send('security_event', logData);
    }
  }
};