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
    size: number = 10
  ): Promise<PaginatedResponse<Course>> {
    console.log('[CourseService] getAllCourses called', { page, size });
    try {
      const response = await apiClient.getCourses(page, size);
      console.log('[CourseService] getAllCourses response', {
        success: response.success,
        contentLength: response.data?.content?.length,
        totalPages: response.data?.totalPages,
        totalElements: response.data?.totalElements,
        number: response.data?.number,
      });
      return response.data;
    } catch (error) {
      console.error('[CourseService] getAllCourses error', error);
      throw error;
    }
  }

  /**
   * 강의 상세 조회
   */
  async getCourseById(courseId: number): Promise<Course> {
    console.log('[CourseService] getCourseById called', { courseId });
    try {
      const response = await apiClient.getCourseById(courseId);
      console.log('[CourseService] getCourseById response', { success: response.success });
      return response.data;
    } catch (error) {
      console.error('[CourseService] getCourseById error', error);
      throw error;
    }
  }

  /**
   * 카테고리별 강의 조회
   */
  async getCoursesByCategory(
    category: string,
    page: number = 0,
    size: number = 10
  ): Promise<PaginatedResponse<Course>> {
    console.log('[CourseService] getCoursesByCategory called', { category, page, size });
    try {
      const response = await apiClient.getCoursesByCategory(category, page, size);
      console.log('[CourseService] getCoursesByCategory response', {
        success: response.success,
        contentLength: response.data?.content?.length,
      });
      return response.data;
    } catch (error) {
      console.error('[CourseService] getCoursesByCategory error', error);
      throw error;
    }
  }

  /**
   * 강사별 강의 조회
   */
  async getCoursesByInstructor(
    instructorId: number,
    page: number = 0,
    size: number = 10
  ): Promise<PaginatedResponse<Course>> {
    console.log('[CourseService] getCoursesByInstructor called', { instructorId, page, size });
    try {
      const response = await apiClient.getCoursesByInstructor(instructorId, page, size);
      console.log('[CourseService] getCoursesByInstructor response', {
        success: response.success,
        contentLength: response.data?.content?.length,
      });
      return response.data;
    } catch (error) {
      console.error('[CourseService] getCoursesByInstructor error', error);
      throw error;
    }
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
    console.log('[CourseService] searchCourses called', { keyword, category, page, size });
    try {
      const response = await apiClient.searchCourses(keyword, category, page, size);
      console.log('[CourseService] searchCourses response', {
        success: response.success,
        contentLength: response.data?.content?.length,
      });
      return response.data;
    } catch (error) {
      console.error('[CourseService] searchCourses error', error);
      throw error;
    }
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
