// project/src/hooks/useError.ts
/**
 * Error Handling Hook
 * Provides consistent error management across components
 * 
 * Academic Note: Custom hook pattern for reusable logic
 * Ensures all errors shown to users consistently
 */

import { useState, useCallback } from 'react';

interface ErrorState {
  message: string | null;
  code?: string;
  timestamp: number;
}

interface UseErrorReturn {
  error: string | null;
  errorCode?: string;
  isError: boolean;
  setError: (message: string, code?: string) => void;
  clearError: () => void;
  withErrorHandling: <T, A extends unknown[]>(
    fn: (...args: A) => Promise<T>
  ) => (...args: A) => Promise<T | undefined>;
}

/**
 * Hook for managing error state
 * @returns Error state and handlers
 */
export function useError(): UseErrorReturn {
  const [errorState, setErrorState] = useState<ErrorState | null>(null);

  const setError = useCallback(
    (message: string, code?: string) => {
      setErrorState({
        message,
        code,
        timestamp: Date.now(),
      });
    },
    []
  );

  const clearError = useCallback(() => {
    setErrorState(null);
  }, []);

  /**
   * Wrapper function for async operations
   * Automatically catches and displays errors
   * 
   * Usage:
   * ```tsx
   * const handleDelete = withErrorHandling(async (id) => {
   *   await deleteProject(id);
   *   // error will be caught and displayed automatically
   * });
   * ```
   */
  const withErrorHandling = useCallback(
    <T, A extends unknown[]>(
      fn: (...args: A) => Promise<T>
    ) => {
      return async (...args: A): Promise<T | undefined> => {
        try {
          clearError();
          return await fn(...args);
        } catch (error) {
          const message = extractErrorMessage(error);
          const code = extractErrorCode(error);
          setError(message, code);
          return undefined;
        }
      };
    },
    [clearError, setError]
  );

  return {
    error: errorState?.message ?? null,
    errorCode: errorState?.code,
    isError: errorState !== null,
    setError,
    clearError,
    withErrorHandling,
  };
}

/**
 * Extract user-friendly error message from error object
 */
function extractErrorMessage(error: unknown): string {
  if (!error) return 'An unexpected error occurred';

  if (error instanceof Error) {
    // Handle specific error types
    if (error.message.includes('JWT')) {
      return 'Session expired. Please log in again.';
    }
    if (error.message.includes('permission')) {
      return 'You do not have permission to perform this action.';
    }
    if (error.message.includes('not found')) {
      return 'The requested resource was not found.';
    }
    if (error.message.includes('network')) {
      return 'Network error. Please check your connection.';
    }
    if (error.message.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }

    // Generic error message
    return error.message || 'An error occurred';
  }

  if (typeof error === 'string') {
    return error;
  }

  if (typeof error === 'object' && error !== null) {
    if ('message' in error && typeof error.message === 'string') {
      return error.message;
    }
    if ('error' in error && typeof error.error === 'string') {
      return error.error;
    }
  }

  return 'An unexpected error occurred';
}

/**
 * Extract error code for debugging and analytics
 */
function extractErrorCode(error: unknown): string | undefined {
  if (!error) return undefined;

  if (error instanceof Error) {
    // Check for Supabase error code
    if ('code' in error) {
      return String(error.code);
    }
    return undefined;
  }

  if (typeof error === 'object' && error !== null) {
    if ('code' in error && typeof error.code === 'string') {
      return error.code;
    }
    if ('status' in error) {
      return String(error.status);
    }
  }

  return undefined;
}

/**
 * Error boundary logger
 * Log errors to analytics/monitoring service
 */
export function logError(
  error: string | Error,
  context: Record<string, unknown> = {}
): void {
  const errorMessage = error instanceof Error ? error.message : error;
  const timestamp = new Date().toISOString();
  // Log to console in development
  if (import.meta.env.DEV) {
    console.error(`[${timestamp}] Error:`, errorMessage, context);
  }

  // In production, send to monitoring service
  // Example: Sentry, LogRocket, etc.
  if (import.meta.env.PROD) {
    // await fetch('/api/logs/error', {
    //   method: 'POST',
    //   body: JSON.stringify({ error: errorMessage, context, timestamp })
    // })
  }
}

/**
 * Hook for async operation with loading state
 * Combines loading + error handling
 */
interface UseAsyncReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (fn: () => Promise<T>) => Promise<void>;
}

export function useAsync<T>(
  initialData: T | null = null
): UseAsyncReturn<T> {
  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(false);
  const { error, setError, clearError } = useError();

  const execute = useCallback(
    async (fn: () => Promise<T>) => {
      try {
        setLoading(true);
        clearError();
        const result = await fn();
        setData(result);
      } catch (err) {
        const message = extractErrorMessage(err);
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [clearError, setError]
  );

  return { data, loading, error, execute };
}
