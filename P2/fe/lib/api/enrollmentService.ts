import { apiClient } from './client';
import { Enrollment, EnrollmentCreateRequest, PaginatedResponse } from './types';

class EnrollmentService {
  /**
   * 강의 수강 등록
   */
  async enrollCourse(courseId: number): Promise<Enrollment> {
    const data: EnrollmentCreateRequest = { courseId };
    const response = await apiClient.enrollCourse(data);
    return response.data;
  }

  /**
   * 내 수강 강의 목록 조회
   */
  async getMyEnrollments(
    page: number = 0,
    size: number = 10
  ): Promise<PaginatedResponse<Enrollment>> {
    const response = await apiClient.getMyEnrollments(page, size);
    return response.data;
  }

  /**
   * 강의 완강 처리
   */
  async completeCourse(courseId: number): Promise<void> {
    await apiClient.completeCourse(courseId);
  }
}

export const enrollmentService = new EnrollmentService();
