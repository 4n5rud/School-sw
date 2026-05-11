import { apiClient } from './client';
import { Section, Lecture } from './types';

class SectionService {
  /**
   * 강의별 섹션 목록 조회 (섹션 내 강의 포함)
   */
  async getSectionsByCourse(courseId: number): Promise<Section[]> {
    const response = await apiClient.getSectionsByCourse(courseId);
    return response.data;
  }

  async getLecturesBySection(sectionId: number): Promise<Lecture[]> {
    const response = await apiClient.getLecturesBySection(sectionId);
    return response.data;
  }

  async getLectureById(lectureId: number): Promise<Lecture> {
    const response = await apiClient.getLectureById(lectureId);
    return response.data;
  }
}

export const sectionService = new SectionService();
