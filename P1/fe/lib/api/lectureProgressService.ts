import { apiClient } from './client';
import { LectureProgress, LectureProgressCreateRequest } from './types';

class LectureProgressService {
  /**
   * 강의 진행 상황 저장
   */
  async saveLectureProgress(
    lectureId: number,
    lastPosition: number
  ): Promise<LectureProgress> {
    const data: LectureProgressCreateRequest = { lectureId, lastPosition };
    const response = await apiClient.saveLectureProgress(data);
    return response.data;
  }

  /**
   * 특정 강의 진행 정보 조회
   */
  async getLectureProgress(lectureId: number): Promise<LectureProgress> {
    const response = await apiClient.getLectureProgress(lectureId);
    return response.data;
  }

  /**
   * 내 전체 강의 진행 정보 조회
   */
  async getMyLectureProgress(): Promise<LectureProgress[]> {
    const response = await apiClient.getMyLectureProgress();
    return response.data;
  }

  /**
   * 강의 진행 정보 삭제
   */
  async deleteLectureProgress(lectureId: number): Promise<void> {
    await apiClient.deleteLectureProgress(lectureId);
  }
}

export const lectureProgressService = new LectureProgressService();
