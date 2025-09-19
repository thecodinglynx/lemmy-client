import { API_CONFIG } from '@constants';

/**
 * Rate limiter implementation for API requests
 */
export class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly timeWindow: number; // in milliseconds

  constructor(
    maxRequests: number = API_CONFIG.RATE_LIMIT.MAX_REQUESTS_PER_SECOND,
    timeWindow: number = 1000
  ) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
  }

  /**
   * Check if a request can be made within rate limits
   */
  canMakeRequest(): boolean {
    const now = Date.now();

    // Remove requests older than the time window
    this.requests = this.requests.filter(
      (requestTime) => now - requestTime < this.timeWindow
    );

    return this.requests.length < this.maxRequests;
  }

  /**
   * Record a request timestamp
   */
  recordRequest(): void {
    this.requests.push(Date.now());
  }

  /**
   * Wait until a request can be made
   */
  async waitForAvailability(): Promise<void> {
    while (!this.canMakeRequest()) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.timeWindow - (Date.now() - oldestRequest);

      if (waitTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  /**
   * Get time until next request can be made
   */
  getTimeUntilAvailable(): number {
    if (this.canMakeRequest()) {
      return 0;
    }

    const oldestRequest = Math.min(...this.requests);
    return this.timeWindow - (Date.now() - oldestRequest);
  }

  /**
   * Reset the rate limiter
   */
  reset(): void {
    this.requests = [];
  }
}
