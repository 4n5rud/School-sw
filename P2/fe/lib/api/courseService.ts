import { apiClient } from './client';
import { Course, CourseCreateRequest, CourseUpdateRequest, PaginatedResponse } from './types';

class CourseService {
  async getAllCourses(page = 0, size = 10): Promise<PaginatedResponse<Course>> {
    const response = await apiClient.getCourses(page, size);
    return response.data;
  }

  async getCourseById(courseId: number): Promise<Course> {
    const response = await apiClient.getCourseById(courseId);
    return response.data;
  }

  async getCoursesByCategory(category: string, page = 0, size = 10): Promise<PaginatedResponse<Course>> {
    const response = await apiClient.getCoursesByCategory(category, page, size);
    return response.data;
  }

  async getCoursesByInstructor(instructorId: number, page = 0, size = 10): Promise<PaginatedResponse<Course>> {
    const response = await apiClient.getCoursesByInstructor(instructorId, page, size);
    return response.data;
  }

  async searchCourses(keyword: string, category?: string, page = 0, size = 10): Promise<PaginatedResponse<Course>> {
    const response = await apiClient.searchCourses(keyword, category, page, size);
    return response.data;
  }

  async createCourse(data: CourseCreateRequest): Promise<Course> {
    const response = await apiClient.createCourse(data);
    return response.data;
  }

  async updateCourse(courseId: number, data: CourseUpdateRequest): Promise<Course> {
    const response = await apiClient.updateCourse(courseId, data);
    return response.data;
  }

  async deleteCourse(courseId: number): Promise<void> {
    await apiClient.deleteCourse(courseId);
  }
}

export const courseService = new CourseService();
