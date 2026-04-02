import {
  SignUpRequest,
  LoginRequest,
  AuthResponse,
  CheckEmailResponse,
  RefreshTokenResponse,
  ApiError,
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(includeAuth: boolean = false): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = this.getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }

  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refreshToken');
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: response.statusText,
      }));
      throw {
        message: error.message || 'API 요청 실패',
        status: response.status,
        code: error.code,
      } as ApiError;
    }
    return response.json();
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: this.getHeaders(options.headers ? false : false),
    });
    return this.handleResponse<T>(response);
  }

  // Auth API
  async signup(data: SignUpRequest): Promise<AuthResponse> {
    return this.makeRequest<AuthResponse>('/auth/signup', {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify(data),
    });
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    return this.makeRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify(data),
    });
  }

  async checkEmail(email: string): Promise<CheckEmailResponse> {
    return this.makeRequest<CheckEmailResponse>(
      `/auth/check-email?email=${encodeURIComponent(email)}`,
      {
        method: 'GET',
        headers: this.getHeaders(false),
      }
    );
  }

  async refreshToken(): Promise<RefreshTokenResponse> {
    const token = this.getRefreshToken();
    if (!token) {
      throw { message: 'Refresh Token이 없습니다', status: 401 } as ApiError;
    }

    return this.makeRequest<RefreshTokenResponse>('/auth/refresh', {
      method: 'POST',
      headers: {
        ...this.getHeaders(false),
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Public API
  async healthCheck(): Promise<{ status: string }> {
    return this.makeRequest('/health', {
      method: 'GET',
      headers: this.getHeaders(false),
    });
  }

  // Protected API (예시)
  async getProtectedResource(): Promise<any> {
    return this.makeRequest('/protected', {
      method: 'GET',
      headers: this.getHeaders(true),
    });
  }
}

export const apiClient = new ApiClient();
