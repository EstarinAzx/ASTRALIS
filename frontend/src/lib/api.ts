// ============================================================================
// API Client - Axios-like fetch wrapper
// ============================================================================

const API_BASE = '/api';

interface ApiResponse<T = unknown> {
    status: 'success' | 'error';
    data: T;
    message?: string;
}

interface RequestOptions {
    headers?: Record<string, string>;
}

class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    private getHeaders(): Record<string, string> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        const token = localStorage.getItem('token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return headers;
    }

    async request<T>(
        method: string,
        endpoint: string,
        body?: unknown,
        options?: RequestOptions
    ): Promise<ApiResponse<T>> {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = { ...this.getHeaders(), ...options?.headers };

        const response = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Request failed');
        }

        return data as ApiResponse<T>;
    }

    get<T>(endpoint: string, options?: RequestOptions) {
        return this.request<T>('GET', endpoint, undefined, options);
    }

    post<T>(endpoint: string, body?: unknown, options?: RequestOptions) {
        return this.request<T>('POST', endpoint, body, options);
    }

    put<T>(endpoint: string, body?: unknown, options?: RequestOptions) {
        return this.request<T>('PUT', endpoint, body, options);
    }

    delete<T>(endpoint: string, options?: RequestOptions) {
        return this.request<T>('DELETE', endpoint, undefined, options);
    }
}

export const api = new ApiClient(API_BASE);
