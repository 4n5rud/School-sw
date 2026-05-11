import {
  SignUpRequest,
  LoginRequest,
  SignUpResponse,
  LoginResponse,
  RefreshTokenResponse,
  ApiResponse,
  Course,
  CourseCreateRequest,
  CourseUpdateRequest,
  PaginatedResponse,
  Enrollment,
  EnrollmentCreateRequest,
  LectureProgress,
  LectureProgressCreateRequest,
  ApiError,
  Section,
  Lecture,
  TeacherCourse,
  TeacherDashboard,
  TeacherStudentList,
  TeacherCourseStats,
  SectionCreateRequest,
  SectionUpdateRequest,
  SectionReorderRequest,
  LectureCreateRequest,
  LectureUpdateRequest,
  VideoPresignedRequest,
  VideoPresignedResponse,
  VideoConfirmRequest,
  VideoConfirmResponse,
  ThumbnailPresignedRequest,
  ThumbnailPresignedResponse,
  ThumbnailConfirmRequest,
  ThumbnailConfirmResponse,
  Review,
  ReviewSummary,
  WishlistItem,
  Payment,
  CourseQuestion,
  MemberProfile,
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

interface RequestOptions extends RequestInit {
  includeAuth?: boolean;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(includeAuth = false): HeadersInit {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (includeAuth) {
      const token = this.getAccessToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
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
    const contentType = response.headers.get('content-type');
    const data = contentType?.includes('application/json')
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      if (response.status === 401 && typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/auth/login';
      }
      const message =
        response.status === 403
          ? (data?.message || '권한이 없습니다. 강사 계정으로 로그인되어 있는지 확인해주세요.')
          : (data?.message || response.statusText);
      throw {
        message,
        status: response.status,
        code: data?.code,
      } as ApiError;
    }

    return data;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { includeAuth = false, ...fetchOptions } = options;
    const url = `${this.baseUrl}${endpoint}`;
    const headers = this.getHeaders(includeAuth);

    if (includeAuth && process.env.NODE_ENV === 'development') {
      const token = this.getAccessToken();
      console.debug(`[API] ${fetchOptions.method || 'GET'} ${endpoint}`, {
        hasToken: !!token,
        tokenPrefix: token ? token.substring(0, 20) + '...' : null,
        authHeader: (headers as Record<string, string>)['Authorization']?.substring(0, 27) + '...',
      });
    }

    try {
      const response = await fetch(url, { ...fetchOptions, headers });
      return this.handleResponse<ApiResponse<T>>(response);
    } catch (error) {
      if ((error as ApiError).status) throw error;
      throw { message: '서버에 연결할 수 없습니다', status: 0 } as ApiError;
    }
  }

  // ================================================
  // 인증
  // ================================================
  async signup(data: SignUpRequest): Promise<ApiResponse<SignUpResponse>> {
    return this.makeRequest<SignUpResponse>('/auth/signup', { method: 'POST', body: JSON.stringify(data) });
  }

  async login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    return this.makeRequest<LoginResponse>('/auth/login', { method: 'POST', body: JSON.stringify(data) });
  }

  async checkEmail(email: string): Promise<ApiResponse<boolean>> {
    return this.makeRequest<boolean>(`/auth/check-email?email=${encodeURIComponent(email)}`);
  }

  async refreshToken(): Promise<ApiResponse<RefreshTokenResponse>> {
    const token = this.getRefreshToken();
    if (!token) throw { message: 'Refresh Token이 없습니다', status: 401 } as ApiError;
    return this.makeRequest<RefreshTokenResponse>('/auth/refresh', { method: 'POST', includeAuth: true });
  }

  // ================================================
  // 강의
  // ================================================
  async getCourses(page = 0, size = 10): Promise<ApiResponse<PaginatedResponse<Course>>> {
    return this.makeRequest<PaginatedResponse<Course>>(
      `/courses?page=${page}&size=${size}`
    );
  }

  async getCourseById(courseId: number): Promise<ApiResponse<Course>> {
    return this.makeRequest<Course>(`/courses/${courseId}`);
  }

  async getCoursesByCategory(category: string, page = 0, size = 10): Promise<ApiResponse<PaginatedResponse<Course>>> {
    return this.makeRequest<PaginatedResponse<Course>>(
      `/courses/category/${category}?page=${page}&size=${size}`
    );
  }

  async getCoursesByInstructor(instructorId: number, page = 0, size = 10): Promise<ApiResponse<PaginatedResponse<Course>>> {
    return this.makeRequest<PaginatedResponse<Course>>(
      `/courses/instructor/${instructorId}?page=${page}&size=${size}`
    );
  }

  async searchCourses(keyword: string, category?: string, page = 0, size = 10): Promise<ApiResponse<PaginatedResponse<Course>>> {
    const params = new URLSearchParams({ keyword, page: String(page), size: String(size) });
    if (category) params.append('category', category);
    return this.makeRequest<PaginatedResponse<Course>>(`/courses/search?${params}`);
  }

  async createCourse(data: CourseCreateRequest): Promise<ApiResponse<Course>> {
    return this.makeRequest<Course>('/courses', { method: 'POST', body: JSON.stringify(data), includeAuth: true });
  }

  async updateCourse(courseId: number, data: CourseUpdateRequest): Promise<ApiResponse<Course>> {
    return this.makeRequest<Course>(`/courses/${courseId}`, { method: 'PUT', body: JSON.stringify(data), includeAuth: true });
  }

  async deleteCourse(courseId: number): Promise<ApiResponse<null>> {
    return this.makeRequest<null>(`/courses/${courseId}`, { method: 'DELETE', includeAuth: true });
  }

  // ================================================
  // 수강
  // ================================================
  async enrollCourse(data: EnrollmentCreateRequest): Promise<ApiResponse<Enrollment>> {
    return this.makeRequest<Enrollment>('/enrollments', { method: 'POST', body: JSON.stringify(data), includeAuth: true });
  }

  async getMyEnrollments(page = 0, size = 10): Promise<ApiResponse<PaginatedResponse<Enrollment>>> {
    return this.makeRequest<PaginatedResponse<Enrollment>>(
      `/enrollments/my?page=${page}&size=${size}`,
      { includeAuth: true }
    );
  }

  async completeCourse(courseId: number): Promise<ApiResponse<null>> {
    return this.makeRequest<null>(`/enrollments/courses/${courseId}/complete`, { method: 'PUT', includeAuth: true });
  }

  // ================================================
  // 학습 진행
  // ================================================
  async saveLectureProgress(data: LectureProgressCreateRequest): Promise<ApiResponse<LectureProgress>> {
    return this.makeRequest<LectureProgress>('/lecture-progress', { method: 'POST', body: JSON.stringify(data), includeAuth: true });
  }

  async getLectureProgress(lectureId: number): Promise<ApiResponse<LectureProgress>> {
    return this.makeRequest<LectureProgress>(`/lecture-progress/lectures/${lectureId}`, { includeAuth: true });
  }

  async getMyLectureProgress(): Promise<ApiResponse<LectureProgress[]>> {
    return this.makeRequest<LectureProgress[]>('/lecture-progress/my', { includeAuth: true });
  }

  async deleteLectureProgress(lectureId: number): Promise<ApiResponse<null>> {
    return this.makeRequest<null>(`/lecture-progress/lectures/${lectureId}`, { method: 'DELETE', includeAuth: true });
  }

  // ================================================
  // 섹션/강의
  // ================================================
  async getSectionsByCourse(courseId: number): Promise<ApiResponse<Section[]>> {
    return this.makeRequest<Section[]>(`/sections/courses/${courseId}`);
  }

  async getLecturesBySection(sectionId: number): Promise<ApiResponse<Lecture[]>> {
    return this.makeRequest<Lecture[]>(`/sections/${sectionId}/lectures`);
  }

  async getLectureById(lectureId: number): Promise<ApiResponse<Lecture>> {
    return this.makeRequest<Lecture>(`/sections/lectures/${lectureId}`);
  }

  // ================================================
  // 헬스 체크
  // ================================================
  async healthCheck(): Promise<ApiResponse<string>> {
    return this.makeRequest<string>('/health');
  }

  // ================================================
  // 강사 전용 — 강의 관리
  // ================================================
  async getTeacherCourses(): Promise<ApiResponse<TeacherCourse[]>> {
    return this.makeRequest<TeacherCourse[]>('/v1/teacher/courses', { includeAuth: true });
  }

  async createTeacherCourse(data: CourseCreateRequest): Promise<ApiResponse<TeacherCourse>> {
    return this.makeRequest<TeacherCourse>('/v1/teacher/courses', { method: 'POST', body: JSON.stringify(data), includeAuth: true });
  }

  async updateTeacherCourse(courseId: number, data: CourseUpdateRequest): Promise<ApiResponse<TeacherCourse>> {
    return this.makeRequest<TeacherCourse>(`/v1/teacher/courses/${courseId}`, { method: 'PUT', body: JSON.stringify(data), includeAuth: true });
  }

  async deleteTeacherCourse(courseId: number): Promise<ApiResponse<null>> {
    return this.makeRequest<null>(`/v1/teacher/courses/${courseId}`, { method: 'DELETE', includeAuth: true });
  }

  async toggleTeacherCoursePublish(courseId: number): Promise<ApiResponse<TeacherCourse>> {
    return this.makeRequest<TeacherCourse>(`/v1/teacher/courses/${courseId}/publish`, { method: 'PATCH', includeAuth: true });
  }

  // ================================================
  // 강사 전용 — 섹션 관리
  // ================================================
  async addSection(courseId: number, data: SectionCreateRequest): Promise<ApiResponse<Section>> {
    return this.makeRequest<Section>(`/v1/teacher/courses/${courseId}/sections`, { method: 'POST', body: JSON.stringify(data), includeAuth: true });
  }

  async updateSection(sectionId: number, data: SectionUpdateRequest): Promise<ApiResponse<Section>> {
    return this.makeRequest<Section>(`/v1/teacher/sections/${sectionId}`, { method: 'PUT', body: JSON.stringify(data), includeAuth: true });
  }

  async deleteSection(sectionId: number): Promise<ApiResponse<null>> {
    return this.makeRequest<null>(`/v1/teacher/sections/${sectionId}`, { method: 'DELETE', includeAuth: true });
  }

  async reorderSections(courseId: number, data: SectionReorderRequest): Promise<ApiResponse<Section[]>> {
    return this.makeRequest<Section[]>(`/v1/teacher/courses/${courseId}/sections/reorder`, { method: 'PATCH', body: JSON.stringify(data), includeAuth: true });
  }

  // ================================================
  // 강사 전용 — 영상 유닛 관리
  // ================================================
  async addLecture(sectionId: number, data: LectureCreateRequest): Promise<ApiResponse<Lecture>> {
    return this.makeRequest<Lecture>(`/v1/teacher/sections/${sectionId}/lectures`, { method: 'POST', body: JSON.stringify(data), includeAuth: true });
  }

  async updateLecture(lectureId: number, data: LectureUpdateRequest): Promise<ApiResponse<Lecture>> {
    return this.makeRequest<Lecture>(`/v1/teacher/lectures/${lectureId}`, { method: 'PUT', body: JSON.stringify(data), includeAuth: true });
  }

  async deleteLecture(lectureId: number): Promise<ApiResponse<null>> {
    return this.makeRequest<null>(`/v1/teacher/lectures/${lectureId}`, { method: 'DELETE', includeAuth: true });
  }

  // ================================================
  // 강사 전용 — 파일 업로드
  // ================================================
  async getVideoPresignedUrl(data: VideoPresignedRequest): Promise<ApiResponse<VideoPresignedResponse>> {
    return this.makeRequest<VideoPresignedResponse>('/v1/teacher/uploads/video-presigned', { method: 'POST', body: JSON.stringify(data), includeAuth: true });
  }

  async confirmVideoUpload(data: VideoConfirmRequest): Promise<ApiResponse<VideoConfirmResponse>> {
    return this.makeRequest<VideoConfirmResponse>('/v1/teacher/uploads/video-confirm', { method: 'POST', body: JSON.stringify(data), includeAuth: true });
  }

  async getThumbnailPresignedUrl(data: ThumbnailPresignedRequest): Promise<ApiResponse<ThumbnailPresignedResponse>> {
    return this.makeRequest<ThumbnailPresignedResponse>('/v1/teacher/uploads/thumbnail-presigned', { method: 'POST', body: JSON.stringify(data), includeAuth: true });
  }

  async confirmThumbnailUpload(data: ThumbnailConfirmRequest): Promise<ApiResponse<ThumbnailConfirmResponse>> {
    return this.makeRequest<ThumbnailConfirmResponse>('/v1/teacher/uploads/thumbnail-confirm', { method: 'POST', body: JSON.stringify(data), includeAuth: true });
  }

  // ================================================
  // 강사 전용 — 통계
  // ================================================
  async getTeacherDashboard(): Promise<ApiResponse<TeacherDashboard>> {
    return this.makeRequest<TeacherDashboard>('/v1/teacher/dashboard', { includeAuth: true });
  }

  async getTeacherCourseStudents(courseId: number): Promise<ApiResponse<TeacherStudentList>> {
    return this.makeRequest<TeacherStudentList>(`/v1/teacher/courses/${courseId}/students`, { includeAuth: true });
  }

  async getTeacherCourseStats(courseId: number): Promise<ApiResponse<TeacherCourseStats>> {
    return this.makeRequest<TeacherCourseStats>(`/v1/teacher/courses/${courseId}/stats`, { includeAuth: true });
  }

  // ================================================
  // 회원 프로필
  // ================================================
  async getMyProfile(): Promise<ApiResponse<MemberProfile>> {
    return this.makeRequest<MemberProfile>('/members/me', { includeAuth: true });
  }

  async updateProfile(data: { nickname: string; bio?: string }): Promise<ApiResponse<MemberProfile>> {
    return this.makeRequest<MemberProfile>('/members/me', {
      method: 'PUT',
      body: JSON.stringify(data),
      includeAuth: true,
    });
  }

  async updatePassword(data: { currentPassword: string; newPassword: string }): Promise<ApiResponse<any>> {
    return this.makeRequest<any>('/members/me/password', {
      method: 'PUT',
      body: JSON.stringify(data),
      includeAuth: true,
    });
  }

  async deleteAccount(): Promise<ApiResponse<any>> {
    return this.makeRequest<any>('/members/me', { method: 'DELETE', includeAuth: true });
  }

  // ================================================
  // 리뷰
  // ================================================
  async getCourseReviews(courseId: number): Promise<ApiResponse<Review[]>> {
    return this.makeRequest<Review[]>(`/courses/${courseId}/reviews`, { includeAuth: true });
  }

  async getCourseReviewSummary(courseId: number): Promise<ApiResponse<ReviewSummary>> {
    return this.makeRequest<ReviewSummary>(`/courses/${courseId}/reviews/summary`);
  }

  async createOrUpdateReview(courseId: number, data: { rating: number; content: string }): Promise<ApiResponse<Review>> {
    return this.makeRequest<Review>(`/courses/${courseId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(data),
      includeAuth: true,
    });
  }

  async deleteReview(courseId: number): Promise<ApiResponse<null>> {
    return this.makeRequest<null>(`/courses/${courseId}/reviews`, { method: 'DELETE', includeAuth: true });
  }

  // ================================================
  // 찜 목록
  // ================================================
  async getMyWishlist(): Promise<ApiResponse<WishlistItem[]>> {
    return this.makeRequest<WishlistItem[]>('/wishlist', { includeAuth: true });
  }

  async toggleWishlist(courseId: number): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(`/wishlist/${courseId}`, { method: 'POST', includeAuth: true });
  }

  async checkWishlistStatus(courseId: number): Promise<ApiResponse<boolean>> {
    return this.makeRequest<boolean>(`/wishlist/${courseId}/status`, { includeAuth: true });
  }

  // ================================================
  // 문의
  // ================================================
  async getCourseQuestions(courseId: number, page = 0): Promise<ApiResponse<PaginatedResponse<CourseQuestion>>> {
    return this.makeRequest<PaginatedResponse<CourseQuestion>>(
      `/courses/${courseId}/questions?page=${page}`,
      { includeAuth: true }
    );
  }

  async createQuestion(courseId: number, data: { title: string; content: string }): Promise<ApiResponse<CourseQuestion>> {
    return this.makeRequest<CourseQuestion>(`/courses/${courseId}/questions`, {
      method: 'POST',
      body: JSON.stringify(data),
      includeAuth: true,
    });
  }

  async answerQuestion(courseId: number, questionId: number, data: { answer: string }): Promise<ApiResponse<CourseQuestion>> {
    return this.makeRequest<CourseQuestion>(`/courses/${courseId}/questions/${questionId}/answer`, {
      method: 'POST',
      body: JSON.stringify(data),
      includeAuth: true,
    });
  }

  async deleteQuestion(courseId: number, questionId: number): Promise<ApiResponse<null>> {
    return this.makeRequest<null>(`/courses/${courseId}/questions/${questionId}`, {
      method: 'DELETE',
      includeAuth: true,
    });
  }

  // ================================================
  // 결제
  // ================================================
  async createPayment(data: { courseId: number; paymentMethod?: string }): Promise<ApiResponse<Payment>> {
    return this.makeRequest<Payment>('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
      includeAuth: true,
    });
  }

  async getMyPayments(): Promise<ApiResponse<Payment[]>> {
    return this.makeRequest<Payment[]>('/payments/my', { includeAuth: true });
  }
}

export const apiClient = new ApiClient();
