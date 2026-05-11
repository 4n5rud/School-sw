// Member
export interface Member {
  id: number;
  email: string;
  nickname: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  createdAt: string;
}

// Course
export interface Course {
  id: number;
  title: string;
  description: string;
  category: 'DOMESTIC_STOCK' | 'OVERSEAS_STOCK' | 'CRYPTO' | 'NFT' | 'ETF' | 'FUTURES';
  price: number;
  thumbnailUrl: string;
  instructor: string;
  rating: number;
  totalEnrollments: number;
}

// Section (Chapter)
export interface Section {
  id: number;
  courseId: number;
  title: string;
  sortOrder: number;
  lectures: Lecture[];
}

// Lecture (Unit/Video)
export interface Lecture {
  id: number;
  sectionId: number;
  title: string;
  videoUrl: string;
  playTime: number; // seconds
  sortOrder: number;
}

// Enrollment
export interface Enrollment {
  id: number;
  memberId: number;
  courseId: number;
  enrolledAt: string;
  isCompleted: boolean;
}

// LectureProgress
export interface LectureProgress {
  id: number;
  memberId: number;
  lectureId: number;
  lastPosition: number; // seconds
  updatedAt: string;
}

// API Response Types
export interface CourseDetail extends Course {
  sections: Section[];
}

export interface MyCourseSummary {
  id: number;
  courseId: number;
  title: string;
  thumbnailUrl: string;
  instructor: string;
  enrolledAt: string;
  progressPercentage: number;
  isCompleted: boolean;
}
