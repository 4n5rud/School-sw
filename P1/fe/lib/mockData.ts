import { Course, CourseDetail } from './types';

export interface MyCourse {
  id: number;
  courseId: number;
  title: string;
  thumbnailUrl: string;
  instructor: string;
  enrolledAt: string;
  progressPercentage: number;
  isCompleted: boolean;
}

export const mockCourses: Course[] = [];

export const mockCourseDetail: Record<number, CourseDetail> = {};

export const mockMyCoures: MyCourse[] = [];
