import { APIError } from '@types';
import { API_CONFIG, ERROR_MESSAGES } from '@constants';

/**
 * Error handler for API and application errors
 */
export class ErrorHandler {
  /**
   * Handle fetch response errors
   */
  static async handleResponse(
    response: Response,
    endpoint: string
  ): Promise<Response> {
    if (!response.ok) {
      let errorMessage: string = ERROR_MESSAGES.API_ERROR;
      let responseData: unknown;

      try {
        responseData = await response.json();
      } catch {
        // If response is not JSON, use status text
        responseData = response.statusText;
      }

      // Map HTTP status codes to user-friendly messages
      switch (response.status) {
        case 400:
          errorMessage = 'Invalid request parameters.';
          break;
        case 401:
          errorMessage = ERROR_MESSAGES.UNAUTHORIZED;
          break;
        case 403:
          errorMessage = ERROR_MESSAGES.FORBIDDEN;
          break;
        case 404:
          errorMessage = ERROR_MESSAGES.NOT_FOUND;
          break;
        case 429:
          errorMessage = ERROR_MESSAGES.RATE_LIMITED;
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          errorMessage = ERROR_MESSAGES.SERVER_ERROR;
          break;
        default:
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }

      throw new APIError(errorMessage, response.status, endpoint, responseData);
    }

    return response;
  }

  /**
   * Handle network errors
   */
  static handleNetworkError(error: unknown, endpoint: string): never {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new APIError(ERROR_MESSAGES.NETWORK_ERROR, 0, endpoint);
    }

    if (error instanceof Error) {
      throw new APIError(error.message, 0, endpoint);
    }

    throw new APIError('Unknown error occurred', 0, endpoint, error);
  }

  /**
   * Implement exponential backoff retry logic
   */
  static async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = API_CONFIG.RATE_LIMIT.RETRY_ATTEMPTS,
    baseDelay: number = API_CONFIG.RATE_LIMIT.BACKOFF_BASE
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        // Don't retry on certain error types
        if (error instanceof APIError) {
          // Don't retry on client errors (4xx) except rate limiting
          if (
            error.status >= 400 &&
            error.status < 500 &&
            error.status !== 429
          ) {
            throw error;
          }
        }

        // If this was the last attempt, throw the error
        if (attempt === maxRetries) {
          break;
        }

        // Calculate delay with exponential backoff and jitter
        const delay = baseDelay * Math.pow(2, attempt);
        const jitter = Math.random() * 0.1 * delay;
        const totalDelay = delay + jitter;

        await new Promise((resolve) => setTimeout(resolve, totalDelay));
      }
    }

    throw lastError;
  }

  /**
   * Handle timeout errors
   */
  static withTimeout<T>(
    promise: Promise<T>,
    timeout: number = API_CONFIG.RATE_LIMIT.TIMEOUT
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), timeout)
      ),
    ]);
  }

  /**
   * Log error for debugging purposes
   */
  static logError(error: unknown, context?: string): void {
    if (process.env.NODE_ENV === 'development') {
      console.error(`Error${context ? ` in ${context}` : ''}:`, error);
    }
  }

  /**
   * Convert unknown error to APIError
   */
  static normalizeError(
    error: unknown,
    endpoint: string = 'unknown'
  ): APIError {
    if (error instanceof APIError) {
      return error;
    }

    if (error instanceof Error) {
      return new APIError(error.message, 0, endpoint);
    }

    return new APIError('Unknown error occurred', 0, endpoint, error);
  }

  /**
   * Check if error is retryable
   */
  static isRetryableError(error: unknown): boolean {
    if (error instanceof APIError) {
      // Retry on server errors and rate limiting
      return error.status >= 500 || error.status === 429 || error.status === 0;
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return true; // Network errors are retryable
    }

    return false;
  }
}
