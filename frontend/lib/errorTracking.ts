/**
 * Error Tracking Service
 * Centralized error tracking and reporting
 */

export interface ErrorContext {
  userId?: string;
  walletId?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export interface ErrorReport {
  message: string;
  stack?: string;
  timestamp: Date;
  context?: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class ErrorTracker {
  private errors: ErrorReport[] = [];
  private maxErrors = 100;
  private enabled = true;

  /**
   * Initialize error tracking
   */
  initialize(options?: { enabled?: boolean; maxErrors?: number }) {
    this.enabled = options?.enabled ?? true;
    this.maxErrors = options?.maxErrors ?? 100;

    // Set up global error handlers
    if (typeof window !== 'undefined' && this.enabled) {
      this.setupGlobalHandlers();
    }
  }

  /**
   * Set up global error handlers
   */
  private setupGlobalHandlers() {
    // Handle unhandled errors
    window.addEventListener('error', (event) => {
      this.captureError(event.error, {
        component: 'GlobalErrorHandler',
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(event.reason, {
        component: 'UnhandledPromiseRejection',
      });
    });
  }

  /**
   * Capture an error with context
   */
  captureError(
    error: Error | string,
    context?: ErrorContext,
    severity: ErrorReport['severity'] = 'medium'
  ): void {
    if (!this.enabled) return;

    const errorReport: ErrorReport = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date(),
      context,
      severity,
    };

    this.errors.push(errorReport);

    // Keep only the last N errors
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorTracker]', errorReport);
    }

    // In production, send to error tracking service (e.g., Sentry)
    if (process.env.NODE_ENV === 'production') {
      this.sendToService(errorReport);
    }
  }

  /**
   * Send error to external tracking service
   */
  private async sendToService(error: ErrorReport): Promise<void> {
    try {
      // Placeholder for external service integration
      // Example: Sentry, LogRocket, DataDog, etc.
      
      // For now, just log to localStorage for debugging
      const storedErrors = this.getStoredErrors();
      storedErrors.push(error);
      
      // Keep only last 50 errors in storage
      const recentErrors = storedErrors.slice(-50);
      
      // Use storage service
      const { storage, StorageKey } = await import('./storage');
      storage.setItem(StorageKey.ERROR_LOGS, recentErrors, { silent: true });
    } catch (err) {
      // Fail silently to avoid infinite error loops
      console.error('Failed to store error:', err);
    }
  }

  /**
   * Get stored errors from localStorage
   */
  private getStoredErrors(): ErrorReport[] {
    try {
      // Use storage service
      const { storage, StorageKey } = require('./storage');
      return storage.getItem(StorageKey.ERROR_LOGS, { fallback: [] }) || [];
    } catch {
      return [];
    }
  }

  /**
   * Get recent errors
   */
  getErrors(limit?: number): ErrorReport[] {
    return limit ? this.errors.slice(-limit) : [...this.errors];
  }

  /**
   * Clear all errors
   */
  clearErrors(): void {
    this.errors = [];
    if (typeof window !== 'undefined') {
      const { storage, StorageKey } = require('./storage');
      storage.removeItem(StorageKey.ERROR_LOGS, { silent: true });
    }
  }

  /**
   * Set user context for error tracking
   */
  setUserContext(context: Pick<ErrorContext, 'userId' | 'walletId'>): void {
    if (typeof window !== 'undefined') {
      (window as any).__ERROR_USER_CONTEXT__ = context;
    }
  }

  /**
   * Get user context
   */
  private getUserContext(): Pick<ErrorContext, 'userId' | 'walletId'> | undefined {
    if (typeof window !== 'undefined') {
      return (window as any).__ERROR_USER_CONTEXT__;
    }
    return undefined;
  }

  /**
   * Capture a breadcrumb (user action) for debugging
   */
  addBreadcrumb(message: string, data?: Record<string, any>): void {
    if (!this.enabled) return;

    const breadcrumb = {
      message,
      data,
      timestamp: new Date().toISOString(),
    };

    // Store breadcrumbs for context
    const breadcrumbs = this.getBreadcrumbs();
    breadcrumbs.push(breadcrumb);

    // Keep only last 20 breadcrumbs
    const recentBreadcrumbs = breadcrumbs.slice(-20);
    
    if (typeof window !== 'undefined') {
      (window as any).__ERROR_BREADCRUMBS__ = recentBreadcrumbs;
    }
  }

  /**
   * Get breadcrumbs
   */
  private getBreadcrumbs(): any[] {
    if (typeof window !== 'undefined') {
      return (window as any).__ERROR_BREADCRUMBS__ || [];
    }
    return [];
  }
}

// Singleton instance
export const errorTracker = new ErrorTracker();

/**
 * Hook-friendly error tracking function
 */
export function trackError(
  error: Error | string,
  context?: ErrorContext,
  severity?: ErrorReport['severity']
): void {
  errorTracker.captureError(error, context, severity);
}

/**
 * Track user action for debugging
 */
export function trackAction(action: string, metadata?: Record<string, any>): void {
  errorTracker.addBreadcrumb(action, metadata);
}

/**
 * Initialize error tracking (call in app initialization)
 */
export function initializeErrorTracking(options?: { enabled?: boolean }): void {
  errorTracker.initialize(options);
}

/**
 * Set user context for error reports
 */
export function setErrorUserContext(walletId?: string): void {
  errorTracker.setUserContext({ walletId });
}
