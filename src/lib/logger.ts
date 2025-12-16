/**
 * Environment-aware logger
 * 
 * Logs debug messages only in development, always logs warnings/errors
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = import.meta.env.DEV;
  }

  debug(...args: unknown[]): void {
    if (this.isDevelopment) {
      console.log('[DEBUG]', ...args);
    }
  }

  info(...args: unknown[]): void {
    console.log('[INFO]', ...args);
  }

  warn(...args: unknown[]): void {
    console.warn('[WARN]', ...args);
  }

  error(...args: unknown[]): void {
    console.error('[ERROR]', ...args);
  }

  /**
   * Log with specific level
   */
  log(level: LogLevel, ...args: unknown[]): void {
    this[level](...args);
  }
}

export const logger = new Logger();