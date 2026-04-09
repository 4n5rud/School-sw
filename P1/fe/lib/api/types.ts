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

export interface UserInfo {
  id: number;
  email: string;
  nickname: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  createdAt: string;
}

/**
 * 회원가입 응답
 * data: 사용자 정보 (직접 포함)
 */
export interface SignUpResponse extends UserInfo {}

/**
 * 로그인 응답
 * data: { accessToken, refreshToken, member }
 */
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  member: UserInfo;
}

/**
 * 토큰 갱신 응답
 * data: { accessToken, refreshToken, member }
 */
export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  member: UserInfo;
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
  first: boolean;
  last: boolean;
  size: number;
  number: number;
  numberOfElements: number;
  empty: boolean;
}

export interface PaginatedResponse<T> {
  content: T[];
  pageable: PaginationMeta;
  totalPages: number;       // ✅ 추가: BE 응답의 최상위 필드
  totalElements: number;    // ✅ 추가: BE 응답의 최상위 필드
  first: boolean;
  last: boolean;
  size: number;
  number: number;
  numberOfElements: number;
  empty: boolean;
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
  courseTitle: string;  // ✅ API에서 반환하는 필드명
  enrolledAt: string;
  isCompleted: boolean;
}

// ================================================
// 학습 진행 API 타입
// ================================================

/**
 * 강의(Lecture) 응답
 * 동영상 스트리밍 정보 포함
 */
export interface Lecture {
  id: number;
  title: string;
  videoUrl: string;
  playTime: number; // 영상 길이 (초)
  sortOrder: number;
}

/**
 * 섹션(Section) 응답
 * 섹션별 강의 목록 포함
 */
export interface Section {
  id: number;
  title: string;
  sortOrder: number;
  lectures: Lecture[];
}

export interface LectureProgressCreateRequest {
  lectureId: number;
  lastPosition: number;
}

export interface LectureProgress {
  id: number;
  memberId: number;
  lectureId: number;
  lectureName: string;
  playTime?: number; // 전체 강의 길이 (초)
  lastPosition: number;
  watchPercentage?: number; // 시청 비율 (%)
  updatedAt: string;
}

// ================================================
// API 응답 래퍼
// ================================================
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  timestamp?: string;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
  hasToken?: boolean;
  tokenLength?: number;
}
