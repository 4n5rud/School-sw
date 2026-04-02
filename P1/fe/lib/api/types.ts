// API 타입 정의
export interface SignUpRequest {
  email: string;
  password: string;
  nickname: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserInfo;
}

export interface UserInfo {
  id: number;
  email: string;
  nickname: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  createdAt: string;
}

export interface CheckEmailResponse {
  available: boolean;
  email: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
}
