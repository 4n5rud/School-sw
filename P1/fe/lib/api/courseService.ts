import { apiClient } from './client';
import {
  Course,
  CourseCreateRequest,
  CourseUpdateRequest,
  PaginatedResponse,
} from './types';

class CourseService {
  /**
   * 전체 강의 목록 조회
   */
  async getAllCourses(
    page: number = 0,
    size: number = 10,
    sort: string = 'id,desc'
  ): Promise<PaginatedResponse<Course>> {
    const response = await apiClient.getCourses(page, size, sort);
    return response.data;
  }

  /**
   * 강의 상세 조회
   */
  async getCourseById(courseId: number): Promise<Course> {
    const response = await apiClient.getCourseById(courseId);
    return response.data;
  }

  /**
   * 카테고리별 강의 조회
   */
  async getCoursesByCategory(
    category: string,
    page: number = 0,
    size: number = 10
  ): Promise<PaginatedResponse<Course>> {
    const response = await apiClient.getCoursesByCategory(category, page, size);
    return response.data;
  }

  /**
   * 강사별 강의 조회
   */
  async getCoursesByInstructor(
    instructorId: number,
    page: number = 0,
    size: number = 10
  ): Promise<PaginatedResponse<Course>> {
    const response = await apiClient.getCoursesByInstructor(instructorId, page, size);
    return response.data;
  }

  /**
   * 강의 검색 및 필터링 조회
   */
  async searchCourses(
    keyword: string,
    category?: string,
    page: number = 0,
    size: number = 10
  ): Promise<PaginatedResponse<Course>> {
    const response = await apiClient.searchCourses(keyword, category, page, size);
    return response.data;
  }

  /**
   * 강의 등록 (강사 전용)
   */
  async createCourse(data: CourseCreateRequest): Promise<Course> {
    const response = await apiClient.createCourse(data);
    return response.data;
  }

  /**
   * 강의 수정 (강사 전용)
   */
  async updateCourse(courseId: number, data: CourseUpdateRequest): Promise<Course> {
    const response = await apiClient.updateCourse(courseId, data);
    return response.data;
  }

  /**
   * 강의 삭제 (강사 전용)
   */
  async deleteCourse(courseId: number): Promise<void> {
    await apiClient.deleteCourse(courseId);
  }
}

export const courseService = new CourseService();
