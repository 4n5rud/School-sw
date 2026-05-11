import { apiClient } from './client';
import { SignUpRequest, LoginRequest, SignUpResponse, LoginResponse, UserInfo } from './types';

class AuthService {
  private readonly ACCESS_TOKEN_KEY = 'accessToken';
  private readonly REFRESH_TOKEN_KEY = 'refreshToken';
  private readonly USER_KEY = 'user';

  /**
   * 회원가입
   * 응답: data에 사용자 정보 직접 포함
   */
  async signup(data: SignUpRequest): Promise<void> {
    const response = await apiClient.signup(data);
    // 회원가입은 user 정보를 직접 반환
    this.saveUserData(response.data);
  }

  /**
   * 로그인
   * 응답: data에 accessToken, refreshToken, member 포함
   */
  async login(data: LoginRequest): Promise<void> {
    const response = await apiClient.login(data);
    // 로그인은 토큰과 member 정보를 반환
    this.saveAuthData(response.data);
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
   * 응답: data는 boolean (true = 사용 불가, false = 사용 가능)
   */
  async checkEmailAvailability(email: string): Promise<boolean> {
    const response = await apiClient.checkEmail(email);
    // data가 false이면 사용 가능, true이면 사용 불가
    return !response.data;
  }

  /**
   * 액세스 토큰 재발급
   */
  async refreshAccessToken(): Promise<string> {
    const response = await apiClient.refreshToken();
    if (typeof window === 'undefined') return '';
    this.saveAuthData(response.data);
    return response.data.accessToken;
  }

  /**
   * 저장된 사용자 정보 조회
   */
  getUser(): UserInfo | null {
    if (typeof window === 'undefined') return null;
    try {
      const userStr = localStorage.getItem(this.USER_KEY);
      if (!userStr || userStr === 'undefined') {
        return null;
      }
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
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
   * 사용자 정보 저장 (회원가입 응답용)
   */
  private saveUserData(userData: SignUpResponse): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.USER_KEY, JSON.stringify(userData));
  }

  /**
   * 인증 데이터 저장 (로그인/토큰갱신 응답용)
   */
  private saveAuthData(data: LoginResponse): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.ACCESS_TOKEN_KEY, data.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, data.refreshToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(data.member));
  }
}

export const authService = new AuthService();
