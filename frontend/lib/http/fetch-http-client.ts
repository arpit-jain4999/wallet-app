import { API_CONFIG } from '@/config/constants';
import { ApiError, NetworkError, ValidationError, NotFoundError, ServerError } from '../errors';
import { retryIfRetryable } from '../retry';
import { IHttpClient, RequestOptions } from './http-client.interface';

/**
 * Fetch-based HTTP Client Implementation
 * Uses native fetch API for HTTP requests
 */
export class FetchHttpClient implements IHttpClient {
  /**
   * Parse error response from API
   */
  private async parseErrorResponse(response: Response): Promise<ApiError> {
    try {
      const data = await response.json();
      const message = data.message || data.error || 'An error occurred';
      
      switch (response.status) {
        case 400:
          return new ValidationError(message, data.fields);
        case 404:
          return new NotFoundError(message);
        case 500:
        case 502:
        case 503:
        case 504:
          return new ServerError(message);
        default:
          return new ApiError(message, response.status);
      }
    } catch {
      return new ApiError(`HTTP ${response.status}: ${response.statusText}`, response.status);
    }
  }

  /**
   * Make an HTTP request
   */
  private async request<T>(
    url: string,
    method: string,
    data?: any,
    options: RequestOptions = {},
  ): Promise<T> {
    const { signal, retryable = true, headers = {} } = options;

    const makeRequest = async (): Promise<T> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      try {
        const requestOptions: RequestInit = {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          signal: signal || controller.signal,
        };

        if (data !== undefined) {
          requestOptions.body = JSON.stringify(data);
        }

        const response = await fetch(`${API_CONFIG.BASE_URL}${url}`, requestOptions);

        clearTimeout(timeoutId);

        if (!response.ok) {
          const error = await this.parseErrorResponse(response);
          throw error;
        }

        // Handle empty responses (204 No Content)
        if (response.status === 204) {
          return undefined as T;
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return await response.json();
        }

        // Return response text for non-JSON responses
        return (await response.text()) as unknown as T;
      } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof ApiError) {
          throw error;
        }

        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            throw new NetworkError('Request timeout');
          }
          throw new NetworkError(error.message);
        }

        throw new NetworkError('Unknown error occurred');
      }
    };

    // Retry logic for retryable requests
    if (retryable) {
      return retryIfRetryable(makeRequest);
    }

    return makeRequest();
  }

  async get<T>(url: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(url, 'GET', undefined, options);
  }

  async post<T>(url: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(url, 'POST', data, options);
  }

  async put<T>(url: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(url, 'PUT', data, options);
  }

  async delete<T>(url: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(url, 'DELETE', undefined, options);
  }

  async patch<T>(url: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(url, 'PATCH', data, options);
  }
}
