import {
  SignUpRequest,
  LoginRequest,
  SignUpResponse,
  LoginResponse,
  RefreshTokenResponse,
  UserInfo,
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
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

console.log('[API Client Init]', {
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  API_BASE_URL,
  isProduction: process.env.NODE_ENV === 'production',
  nodeEnv: process.env.NODE_ENV,
});

interface RequestOptions extends RequestInit {
  includeAuth?: boolean;
}

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
    const contentType = response.headers.get('content-type');
    let data: any;

    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    console.log(`[API Response] Status: ${response.status}`, {
      statusText: response.statusText,
      contentType,
      dataLength: JSON.stringify(data).length,
    });

    if (!response.ok) {
      const token = this.getAccessToken();
      const errorLog = {
        message: data.message || response.statusText,
        status: response.status,
        code: data.code,
        hasToken: !!token,
        tokenLength: token?.length || 0,
      };

      console.error('[API Error Response]', response.status, errorLog);
      console.error('[API Error Data]', data);

      // ⭐ 401 Unauthorized 처리: 토큰 만료 또는 유효하지 않은 토큰
      if (response.status === 401) {
        console.warn('[API Auth Error] 401 Unauthorized - 토큰이 유효하지 않습니다');
        // 토큰 삭제
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          console.log('[API Cleanup] 토큰 및 사용자 정보 삭제 완료');
          
          // 로그인 페이지로 리다이렉트
          window.location.href = '/auth/login';
        }
      }

      throw errorLog as ApiError;
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

    console.log('[API Request]', {
      method: fetchOptions.method || 'GET',
      fullUrl: url,
      endpoint,
      baseUrl: this.baseUrl,
      includeAuth,
      hasBody: !!fetchOptions.body,
    });

    // 디버깅: 인증이 필요한 요청인 경우 토큰 상태 로깅
    if (includeAuth) {
      const token = this.getAccessToken();
      const authHeader = (headers as any)['Authorization'];
      console.log(`[API Auth Check] ${fetchOptions.method} ${endpoint}`, {
        hasToken: !!token,
        tokenLength: token?.length || 0,
        authHeader: authHeader ? '포함됨' : '없음',
      });
    }

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
      });

      console.log('[API Fetch Completed]', {
        url,
        status: response.status,
        ok: response.ok,
      });

      return this.handleResponse<ApiResponse<T>>(response);
    } catch (error) {
      console.error('[API Fetch Failed]', {
        url,
        error: error instanceof Error ? error.message : String(error),
        type: error instanceof TypeError ? 'TypeError' : 'Other',
      });
      throw error;
    }
  }

  // ================================================
  // 인증 API
  // ================================================
  async signup(data: SignUpRequest): Promise<ApiResponse<SignUpResponse>> {
    return this.makeRequest<SignUpResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    return this.makeRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async checkEmail(email: string): Promise<ApiResponse<boolean>> {
    return this.makeRequest<boolean>(
      `/auth/check-email?email=${encodeURIComponent(email)}`,
      {
        method: 'GET',
      }
    );
  }

  async refreshToken(): Promise<ApiResponse<RefreshTokenResponse>> {
    const token = this.getRefreshToken();
    if (!token) {
      throw { message: 'Refresh Token이 없습니다', status: 401 } as ApiError;
    }

    return this.makeRequest<RefreshTokenResponse>('/auth/refresh', {
      method: 'POST',
      includeAuth: true,
    });
  }

  // ================================================
  // 강의 API
  // ================================================
  async getCourses(
    page: number = 0,
    size: number = 10
  ): Promise<ApiResponse<PaginatedResponse<Course>>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    console.log('[API Call] getCourses', { page, size, queryString: params.toString() });

    return this.makeRequest<PaginatedResponse<Course>>(
      `/courses?${params.toString()}`,
      {
        method: 'GET',
      }
    );
  }

  async getCourseById(courseId: number): Promise<ApiResponse<Course>> {
    console.log('[API Call] getCourseById', { courseId });

    return this.makeRequest<Course>(`/courses/${courseId}`, {
      method: 'GET',
    });
  }

  async getCoursesByCategory(
    category: string,
    page: number = 0,
    size: number = 10
  ): Promise<ApiResponse<PaginatedResponse<Course>>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    console.log('[API Call] getCoursesByCategory', { category, page, size });

    return this.makeRequest<PaginatedResponse<Course>>(
      `/courses/category/${category}?${params.toString()}`,
      {
        method: 'GET',
      }
    );
  }

  async getCoursesByInstructor(
    instructorId: number,
    page: number = 0,
    size: number = 10
  ): Promise<ApiResponse<PaginatedResponse<Course>>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    console.log('[API Call] getCoursesByInstructor', { instructorId, page, size });

    return this.makeRequest<PaginatedResponse<Course>>(
      `/courses/instructor/${instructorId}?${params.toString()}`,
      {
        method: 'GET',
      }
    );
  }

  async searchCourses(
    keyword: string,
    category?: string,
    page: number = 0,
    size: number = 10
  ): Promise<ApiResponse<PaginatedResponse<Course>>> {
    const params = new URLSearchParams({
      keyword,
      page: page.toString(),
      size: size.toString(),
    });

    if (category) {
      params.append('category', category);
    }

    console.log('[API Call] searchCourses', { keyword, category, page, size });

    return this.makeRequest<PaginatedResponse<Course>>(
      `/courses/search?${params.toString()}`,
      {
        method: 'GET',
      }
    );
  }

  async createCourse(data: CourseCreateRequest): Promise<ApiResponse<Course>> {
    return this.makeRequest<Course>('/courses', {
      method: 'POST',
      body: JSON.stringify(data),
      includeAuth: true,
    });
  }

  async updateCourse(
    courseId: number,
    data: CourseUpdateRequest
  ): Promise<ApiResponse<Course>> {
    return this.makeRequest<Course>(`/courses/${courseId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      includeAuth: true,
    });
  }

  async deleteCourse(courseId: number): Promise<ApiResponse<null>> {
    return this.makeRequest<null>(`/courses/${courseId}`, {
      method: 'DELETE',
      includeAuth: true,
    });
  }

  // ================================================
  // 수강 API
  // ================================================
  async enrollCourse(data: EnrollmentCreateRequest): Promise<ApiResponse<Enrollment>> {
    return this.makeRequest<Enrollment>('/enrollments', {
      method: 'POST',
      body: JSON.stringify(data),
      includeAuth: true,
    });
  }

  async getMyEnrollments(
    page: number = 0,
    size: number = 10
  ): Promise<ApiResponse<PaginatedResponse<Enrollment>>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    return this.makeRequest<PaginatedResponse<Enrollment>>(
      `/enrollments/my?${params.toString()}`,
      {
        method: 'GET',
        includeAuth: true,
      }
    );
  }

  async completeCourse(courseId: number): Promise<ApiResponse<null>> {
    return this.makeRequest<null>(`/enrollments/courses/${courseId}/complete`, {
      method: 'PUT',
      includeAuth: true,
    });
  }

  // ================================================
  // 학습 진행 API
  // ================================================
  async saveLectureProgress(
    data: LectureProgressCreateRequest
  ): Promise<ApiResponse<LectureProgress>> {
    return this.makeRequest<LectureProgress>('/lecture-progress', {
      method: 'POST',
      body: JSON.stringify(data),
      includeAuth: true,
    });
  }

  async getLectureProgress(lectureId: number): Promise<ApiResponse<LectureProgress>> {
    return this.makeRequest<LectureProgress>(
      `/lecture-progress/lectures/${lectureId}`,
      {
        method: 'GET',
        includeAuth: true,
      }
    );
  }

  async getMyLectureProgress(): Promise<ApiResponse<LectureProgress[]>> {
    return this.makeRequest<LectureProgress[]>('/lecture-progress/my', {
      method: 'GET',
      includeAuth: true,
    });
  }

  async deleteLectureProgress(lectureId: number): Promise<ApiResponse<null>> {
    return this.makeRequest<null>(`/lecture-progress/lectures/${lectureId}`, {
      method: 'DELETE',
      includeAuth: true,
    });
  }

  // ================================================
  // 헬스 체크
  // ================================================
  async healthCheck(): Promise<ApiResponse<string>> {
    return this.makeRequest<string>('/health', {
      method: 'GET',
    });
  }
}

export const apiClient = new ApiClient();
