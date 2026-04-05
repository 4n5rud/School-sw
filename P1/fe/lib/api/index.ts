// API 클라이언트
export { apiClient } from './client';

// 타입
export * from './types';

// 서비스 레이어
export { authService } from './authService';
export { courseService } from './courseService';
export { enrollmentService } from './enrollmentService';
export { lectureProgressService } from './lectureProgressService';

// 사용 예시:
// import { authService, courseService, enrollmentService } from '@/lib/api';
// import type { Course, Enrollment } from '@/lib/api';
