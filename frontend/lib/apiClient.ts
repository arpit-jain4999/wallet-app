import { IHttpClient } from './http/http-client.interface';
import { FetchHttpClient } from './http/fetch-http-client';
import { API_CONFIG } from '@/config/constants';

/**
 * API Client
 * 
 * Uses HTTP Client interface for flexibility.
 * Can swap implementations (Fetch, Axios, etc.) without changing consuming code.
 */

// Create HTTP client instance (can be easily swapped with different implementation)
const httpClient: IHttpClient = new FetchHttpClient();

/**
 * GET request
 */
export async function apiGet<T>(url: string, options?: { signal?: AbortSignal }): Promise<T> {
  return httpClient.get<T>(url, options);
}

/**
 * GET request for blob data (e.g., CSV files)
 */
export async function apiGetBlob(url: string, options?: { signal?: AbortSignal }): Promise<Blob> {
  const response = await fetch(`${API_CONFIG.BASE_URL}${url}`, {
    signal: options?.signal,
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch blob: ${response.statusText}`);
  }
  
  return response.blob();
}

/**
 * POST request
 */
export async function apiPost<T>(url: string, data?: unknown): Promise<T> {
  return httpClient.post<T>(url, data);
}

/**
 * PUT request
 */
export async function apiPut<T>(url: string, data?: unknown): Promise<T> {
  return httpClient.put<T>(url, data);
}

/**
 * DELETE request
 */
export async function apiDelete<T>(url: string): Promise<T> {
  return httpClient.delete<T>(url);
}

/**
 * PATCH request
 */
export async function apiPatch<T>(url: string, data?: unknown): Promise<T> {
  return httpClient.patch<T>(url, data);
}

/**
 * Export types for convenience
 */
export type { IHttpClient } from './http/http-client.interface';
export { FetchHttpClient } from './http/fetch-http-client';

// Re-export errors for convenience
export * from './errors';
