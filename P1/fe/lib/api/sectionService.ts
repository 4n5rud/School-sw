import { apiClient } from './client';
import { Section, Lecture } from './types';

class SectionService {
  /**
   * 강의별 섹션 목록 조회 (섹션 내 강의 포함)
   */
  async getSectionsByCourse(courseId: number): Promise<Section[]> {
    console.log('[SectionService] getSectionsByCourse', { courseId });
    const response = await apiClient.getSectionsByCourse(courseId);
    return response.data;
  }

  /**
   * 섹션별 강의 목록 조회
   */
  async getLecturesBySection(sectionId: number): Promise<Lecture[]> {
    console.log('[SectionService] getLecturesBySection', { sectionId });
    const response = await apiClient.getLecturesBySection(sectionId);
    return response.data;
  }

  /**
   * 특정 강의 조회
   */
  async getLectureById(lectureId: number): Promise<Lecture> {
    console.log('[SectionService] getLectureById', { lectureId });
    const response = await apiClient.getLectureById(lectureId);
    return response.data;
  }
}

export const sectionService = new SectionService();
