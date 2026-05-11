import { apiClient } from './client';
import {
  TeacherCourse,
  TeacherDashboard,
  TeacherStudentList,
  TeacherCourseStats,
  CourseCreateRequest,
  CourseUpdateRequest,
  Section,
  Lecture,
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
} from './types';

class TeacherService {
  // 강의 관리
  async getMyCourses(): Promise<TeacherCourse[]> {
    const res = await apiClient.getTeacherCourses();
    return res.data;
  }

  async createCourse(data: CourseCreateRequest): Promise<TeacherCourse> {
    const res = await apiClient.createTeacherCourse(data);
    return res.data;
  }

  async updateCourse(courseId: number, data: CourseUpdateRequest): Promise<TeacherCourse> {
    const res = await apiClient.updateTeacherCourse(courseId, data);
    return res.data;
  }

  async deleteCourse(courseId: number): Promise<void> {
    await apiClient.deleteTeacherCourse(courseId);
  }

  async togglePublish(courseId: number): Promise<TeacherCourse> {
    const res = await apiClient.toggleTeacherCoursePublish(courseId);
    return res.data;
  }

  // 섹션 관리
  async addSection(courseId: number, title: string): Promise<Section> {
    const res = await apiClient.addSection(courseId, { title } as SectionCreateRequest);
    return res.data;
  }

  async updateSection(sectionId: number, title: string): Promise<Section> {
    const res = await apiClient.updateSection(sectionId, { title } as SectionUpdateRequest);
    return res.data;
  }

  async deleteSection(sectionId: number): Promise<void> {
    await apiClient.deleteSection(sectionId);
  }

  async reorderSections(courseId: number, data: SectionReorderRequest): Promise<Section[]> {
    const res = await apiClient.reorderSections(courseId, data);
    return res.data;
  }

  // 강의 유닛 관리
  async addLecture(sectionId: number, data: LectureCreateRequest): Promise<Lecture> {
    const res = await apiClient.addLecture(sectionId, data);
    return res.data;
  }

  async updateLecture(lectureId: number, data: LectureUpdateRequest): Promise<Lecture> {
    const res = await apiClient.updateLecture(lectureId, data);
    return res.data;
  }

  async deleteLecture(lectureId: number): Promise<void> {
    await apiClient.deleteLecture(lectureId);
  }

  // 파일 업로드
  async getVideoPresignedUrl(data: VideoPresignedRequest): Promise<VideoPresignedResponse> {
    const res = await apiClient.getVideoPresignedUrl(data);
    return res.data;
  }

  async confirmVideoUpload(data: VideoConfirmRequest): Promise<VideoConfirmResponse> {
    const res = await apiClient.confirmVideoUpload(data);
    return res.data;
  }

  async getThumbnailPresignedUrl(data: ThumbnailPresignedRequest): Promise<ThumbnailPresignedResponse> {
    const res = await apiClient.getThumbnailPresignedUrl(data);
    return res.data;
  }

  async confirmThumbnailUpload(data: ThumbnailConfirmRequest): Promise<ThumbnailConfirmResponse> {
    const res = await apiClient.confirmThumbnailUpload(data);
    return res.data;
  }

  async uploadFileToR2(uploadUrl: string, file: File): Promise<void> {
    const res = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    });
    if (!res.ok) throw new Error('파일 업로드에 실패했습니다');
  }

  // 통계
  async getDashboard(): Promise<TeacherDashboard> {
    const res = await apiClient.getTeacherDashboard();
    return res.data;
  }

  async getCourseStudents(courseId: number): Promise<TeacherStudentList> {
    const res = await apiClient.getTeacherCourseStudents(courseId);
    return res.data;
  }

  async getCourseStats(courseId: number): Promise<TeacherCourseStats> {
    const res = await apiClient.getTeacherCourseStats(courseId);
    return res.data;
  }
}

export const teacherService = new TeacherService();
