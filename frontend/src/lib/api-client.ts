/**
 * API Client with error handling and retry logic
 */

interface RetryOptions {
  maxRetries?: number;
  delayMs?: number;
  backoffMultiplier?: number;
}

class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message?: string,
  ) {
    super(message || `API Error: ${status} ${statusText}`);
    this.name = "ApiError";
  }
}

/**
 * Fetch with automatic retry logic
 * Retries on network errors and 5xx status codes
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {},
): Promise<Response> {
  const {
    maxRetries = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
  } = retryOptions;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      // Don't retry on client errors (4xx)
      if (!response.ok && response.status >= 400 && response.status < 500) {
        throw new ApiError(
          response.status,
          response.statusText,
          `HTTP ${response.status}: ${response.statusText}`,
        );
      }

      // Retry on server errors (5xx) and network issues
      if (!response.ok && response.status >= 500 && attempt < maxRetries) {
        const delay = delayMs * Math.pow(backoffMultiplier, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      if (!response.ok) {
        throw new ApiError(
          response.status,
          response.statusText,
          `HTTP ${response.status}: ${response.statusText}`,
        );
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Network error - retry if attempts left
      if (attempt < maxRetries) {
        const delay = delayMs * Math.pow(backoffMultiplier, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
    }
  }

  throw (
    lastError || new Error(`Failed to fetch ${url} after ${maxRetries} retries`)
  );
}

/**
 * Typed JSON fetch with error handling
 */
export async function fetchJson<T = unknown>(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {},
): Promise<T> {
  const response = await fetchWithRetry(url, options, retryOptions);
  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    throw new Error(`Expected JSON response but got ${contentType || "empty"}`);
  }

  const data: unknown = await response.json();
  return data as T;
}

export { ApiError, type RetryOptions };
