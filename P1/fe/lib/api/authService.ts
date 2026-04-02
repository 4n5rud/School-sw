import { apiClient } from './client';
import {
  SignUpRequest,
  LoginRequest,
  AuthResponse,
  UserInfo,
} from './types';

class AuthService {
  private readonly ACCESS_TOKEN_KEY = 'accessToken';
  private readonly REFRESH_TOKEN_KEY = 'refreshToken';
  private readonly USER_KEY = 'user';

  /**
   * 회원가입
   */
  async signup(data: SignUpRequest): Promise<void> {
    const response = await apiClient.signup(data);
    this.saveAuthData(response);
  }

  /**
   * 로그인
   */
  async login(data: LoginRequest): Promise<void> {
    const response = await apiClient.login(data);
    this.saveAuthData(response);
  }

  /**
   * 로그아웃
   */
  logout(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  /**
   * 이메일 중복 확인
   */
  async checkEmailAvailability(email: string): Promise<boolean> {
    const response = await apiClient.checkEmail(email);
    return response.available;
  }

  /**
   * 액세스 토큰 재발급
   */
  async refreshAccessToken(): Promise<string> {
    const response = await apiClient.refreshToken();
    if (typeof window === 'undefined') return '';
    localStorage.setItem(this.ACCESS_TOKEN_KEY, response.accessToken);
    return response.accessToken;
  }

  /**
   * 저장된 사용자 정보 조회
   */
  getUser(): UserInfo | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * 액세스 토큰 조회
   */
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  /**
   * 리프레시 토큰 조회
   */
  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * 로그인 여부 확인
   */
  isLoggedIn(): boolean {
    return this.getAccessToken() !== null;
  }

  /**
   * 인증 데이터 저장
   */
  private saveAuthData(response: AuthResponse): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.ACCESS_TOKEN_KEY, response.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
  }
}

export const authService = new AuthService();
