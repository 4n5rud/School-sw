// ================================================
// 공통 타입
// ================================================
export type CategoryType =
  | 'DOMESTIC_STOCK'
  | 'OVERSEAS_STOCK'
  | 'CRYPTO'
  | 'NFT'
  | 'ETF'
  | 'FUTURES';

export const CATEGORY_LABELS: Record<CategoryType, string> = {
  DOMESTIC_STOCK: '국내 주식',
  OVERSEAS_STOCK: '해외 주식',
  CRYPTO: '암호화폐',
  NFT: 'NFT',
  ETF: 'ETF',
  FUTURES: '선물투자',
};

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
  createdAt?: string;
}

export interface SignUpResponse extends UserInfo {}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  member: UserInfo;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  member: UserInfo;
}

// ================================================
// 강의 API 타입 (명세 기준)
// ================================================
export interface Course {
  id: number;
  title: string;
  description: string;
  category: CategoryType;
  price: number;
  thumbnailUrl?: string;
  isPublished: boolean;
  instructorId?: number;
  instructorNickname?: string;
  instructor?: { id: number; email: string; nickname: string; role: string };
  createdAt: string;
  enrollmentCount?: number;
  studentCount?: number;
}

export interface CourseCreateRequest {
  title: string;
  description: string;
  category: CategoryType;
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
  pageable?: PaginationMeta;
  totalPages: number;
  totalElements: number;
  first: boolean;
  last: boolean;
  size: number;
  number: number;
  numberOfElements: number;
  empty: boolean;
}

// ================================================
// 수강 API 타입 (명세 기준)
// ================================================
export interface EnrollmentCreateRequest {
  courseId: number;
}

export interface Enrollment {
  id: number;
  courseId: number;
  courseTitle: string;
  enrolledAt: string;
  isCompleted: boolean;
  thumbnailUrl?: string;
  courseThumbnailUrl?: string;
  course?: { id: number; title: string; thumbnailUrl?: string };
}

// ================================================
// 섹션/강의 API 타입 (명세 기준)
// ================================================
export type UploadStatus = 'PENDING' | 'CONFIRMED' | 'FAILED';

export interface Lecture {
  id: number;
  title: string;
  videoUrl?: string;
  playTime?: number;
  sortOrder: number;
  uploadStatus?: UploadStatus;
}

export interface Section {
  id: number;
  title: string;
  sortOrder: number;
  lectures: Lecture[];
}

// ================================================
// 학습 진행 API 타입 (명세 기준)
// ================================================
export interface LectureProgressCreateRequest {
  lectureId: number;
  lastPosition: number;
}

export interface LectureProgress {
  id: number;
  lectureId: number;
  lastPosition: number;
  isCompleted: boolean;
  updatedAt: string;
}

// ================================================
// 강사 전용 타입 (Teacher API)
// ================================================
export interface TeacherCourse {
  id: number;
  title: string;
  category: CategoryType;
  price: number;
  isPublished: boolean;
  enrollmentCount: number;
  createdAt: string;
  description?: string;
  thumbnailUrl?: string;
}

export interface TeacherDashboard {
  totalCourses: number;
  totalStudents: number;
  totalCompletions: number;
  courses: {
    id: number;
    title: string;
    enrollmentCount: number;
    completionCount: number;
  }[];
}

export interface TeacherStudent {
  memberId: number;
  nickname: string;
  enrolledAt: string;
  isCompleted: boolean;
  progressRate: number;
}

export interface TeacherStudentList {
  courseId: number;
  courseTitle: string;
  students: TeacherStudent[];
}

export interface LectureStat {
  lectureId: number;
  lectureTitle: string;
  viewCount: number;
  completionCount: number;
}

export interface TeacherCourseStats {
  courseId: number;
  courseTitle: string;
  totalEnrollments: number;
  completionRate: number;
  lectureStats: LectureStat[];
}

// 섹션 관리
export interface SectionCreateRequest {
  title: string;
}
export interface SectionUpdateRequest {
  title: string;
}
export interface SectionReorderItem {
  sectionId: number;
  sortOrder: number;
}
export interface SectionReorderRequest {
  sectionOrders: SectionReorderItem[];
}

// 강의 유닛 관리
export interface LectureCreateRequest {
  title: string;
  sortOrder: number;
}
export interface LectureUpdateRequest {
  title: string;
  sortOrder: number;
  videoUrl?: string;
}

// 파일 업로드
export interface VideoPresignedRequest {
  lectureId: number;
  filename: string;
  contentType: string;
  fileSize: number;
}
export interface VideoPresignedResponse {
  uploadUrl: string;
  objectKey: string;
  expiresAt: string;
  maxFileSize: number;
}
export interface VideoConfirmRequest {
  lectureId: number;
  objectKey: string;
  playTime?: number;
}
export interface VideoConfirmResponse {
  lectureId: number;
  videoUrl: string;
  uploadStatus: UploadStatus;
  confirmedAt: string;
}
export interface ThumbnailPresignedRequest {
  courseId: number;
  filename: string;
  contentType: string;
}
export interface ThumbnailPresignedResponse {
  uploadUrl: string;
  objectKey: string;
  expiresAt: string;
}
export interface ThumbnailConfirmRequest {
  courseId: number;
  objectKey: string;
}
export interface ThumbnailConfirmResponse {
  courseId: number;
  thumbnailUrl: string;
  confirmedAt: string;
}

// ================================================
// 리뷰 타입
// ================================================
export interface Review {
  id: number;
  courseId: number;
  memberId: number;
  memberNickname: string;
  rating: number;
  content: string;
  createdAt: string;
}

export interface ReviewSummary {
  averageRating: number;
  totalCount: number;
  ratingDistribution: Record<number, number>;
}

// ================================================
// 찜 목록 타입
// ================================================
export interface WishlistItem {
  id: number;
  courseId: number;
  courseTitle: string;
  courseThumbnailUrl?: string;
  coursePrice: number;
  instructorNickname?: string;
  createdAt: string;
}

// ================================================
// 결제 타입
// ================================================
export interface Payment {
  id: number;
  orderId: string;
  courseId: number;
  courseTitle: string;
  amount: number;
  status: string;
  paymentMethod?: string;
  paidAt?: string;
  createdAt: string;
}

// ================================================
// 문의 타입
// ================================================
export interface CourseQuestion {
  id: number;
  courseId: number;
  memberId: number;
  memberNickname: string;
  title: string;
  content: string;
  answer?: string;
  answeredAt?: string;
  isResolved: boolean;
  createdAt: string;
}

// ================================================
// 회원 프로필 타입
// ================================================
export interface MemberProfile {
  id: number;
  email: string;
  nickname: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  bio?: string;
  profileImageUrl?: string;
  createdAt: string;
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
