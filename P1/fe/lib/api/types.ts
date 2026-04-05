// ================================================
// 인증 API 타입
// ================================================
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
  refreshToken: string;
  user: UserInfo;
}

// ================================================
// 강의 API 타입
// ================================================
export interface Instructor {
  id: number;
  email: string;
  nickname: string;
  role: 'TEACHER' | 'ADMIN';
  createdAt: string;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  category: 'DOMESTIC_STOCK' | 'OVERSEAS_STOCK' | 'CRYPTO' | 'NFT' | 'ETF' | 'FUTURES';
  price: number;
  thumbnailUrl?: string;
  instructor: Instructor;
  studentCount: number;
  createdAt: string;
}

export interface CourseCreateRequest {
  title: string;
  description: string;
  category: 'DOMESTIC_STOCK' | 'OVERSEAS_STOCK' | 'CRYPTO' | 'NFT' | 'ETF' | 'FUTURES';
  price: number;
  thumbnailUrl?: string;
}

export interface CourseUpdateRequest extends CourseCreateRequest {}

export interface PaginationMeta {
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  content: T[];
  pageable: PaginationMeta;
}

// ================================================
// 수강 API 타입
// ================================================
export interface EnrollmentCreateRequest {
  courseId: number;
}

export interface Enrollment {
  id: number;
  memberId: number;
  courseId: number;
  courseName: string;
  enrolledAt: string;
  isCompleted: boolean;
}

// ================================================
// 학습 진행 API 타입
// ================================================
export interface LectureProgressCreateRequest {
  lectureId: number;
  lastPosition: number;
}

export interface LectureProgress {
  id: number;
  memberId: number;
  lectureId: number;
  lectureName: string;
  lastPosition: number;
  updatedAt: string;
}

// ================================================
// API 응답 래퍼
// ================================================
export interface ApiResponse<T> {
  data: T;
  message: string;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
}
