/**
 * HTTP Client Interface
 * Defines contract for HTTP request operations
 * Allows swapping implementations (fetch, axios, etc.)
 */

export interface RequestOptions {
  signal?: AbortSignal;
  retryable?: boolean;
  headers?: Record<string, string>;
}

export interface IHttpClient {
  /**
   * Make a GET request
   */
  get<T>(url: string, options?: RequestOptions): Promise<T>;

  /**
   * Make a POST request
   */
  post<T>(url: string, data?: any, options?: RequestOptions): Promise<T>;

  /**
   * Make a PUT request
   */
  put<T>(url: string, data?: any, options?: RequestOptions): Promise<T>;

  /**
   * Make a DELETE request
   */
  delete<T>(url: string, options?: RequestOptions): Promise<T>;

  /**
   * Make a PATCH request
   */
  patch<T>(url: string, data?: any, options?: RequestOptions): Promise<T>;
}
