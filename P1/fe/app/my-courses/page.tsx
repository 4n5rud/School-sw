'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { enrollmentService } from '@/lib/api';
import { Enrollment } from '@/lib/api/types';

export default function MyCoursesPage() {
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 수강 목록 조회
  useEffect(() => {
    if (!isLoggedIn) {
      setIsLoading(false);
      return;
    }

    const loadEnrollments = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await enrollmentService.getMyEnrollments(0, 100);
        console.log('[MyCoursesPage] 전체 응답:', response);
        console.log('[MyCoursesPage] response 타입:', typeof response);
        console.log('[MyCoursesPage] response 키:', Object.keys(response || {}));
        
        // response 구조 분석
        let enrollmentList: Enrollment[] = [];
        
        // 시도 1: response.data?.content
        if ((response as any).data?.content) {
          enrollmentList = (response as any).data.content;
          console.log('[MyCoursesPage] 방법 1 성공 - response.data.content');
        }
        // 시도 2: response.content (Paginated로 직접 반환)
        else if ((response as any).content) {
          enrollmentList = (response as any).content;
          console.log('[MyCoursesPage] 방법 2 성공 - response.content');
        }
        // 시도 3: response가 배열인 경우
        else if (Array.isArray(response)) {
          enrollmentList = response as Enrollment[];
          console.log('[MyCoursesPage] 방법 3 성공 - response는 배열');
        }
        // 시도 4: 응답 전체가 Enrollment[]인 경우
        else if ((response as any)[0]?.courseTitle !== undefined) {
          enrollmentList = response as any[];
          console.log('[MyCoursesPage] 방법 4 성공 - 직접 배열');
        }
        
        console.log('[MyCoursesPage] 최종 강의 목록:', {
          count: enrollmentList.length,
          first: enrollmentList[0],
        });
        setEnrollments(enrollmentList);
      } catch (err: any) {
        console.error('수강 목록 조회 실패:', err);
        console.error('에러 타입:', err.constructor.name);
        setError(err.message || '수강 목록을 불러오는데 실패했습니다');
      } finally {
        setIsLoading(false);
      }
    };

    loadEnrollments();
  }, [isLoggedIn]);

  const activeCourses = enrollments.filter((e) => !e.isCompleted);
  const completedCourses = enrollments.filter((e) => e.isCompleted);

  if (authLoading || isLoading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-[#000000] flex items-center justify-center">
          <p className="text-gray-400 text-xl">로딩 중...</p>
        </main>
        <Footer />
      </>
    );
  }

  if (!isLoggedIn) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-[#000000] flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-400 text-xl mb-4">로그인이 필요합니다</p>
            <Link href="/auth/login" className="inline-block bg-[#FFD700] text-[#000000] px-6 py-2 rounded-lg font-medium hover:bg-yellow-400">
              로그인하기
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#000000] py-12">
        <div className="max-w-7xl mx-auto px-4 space-y-12">
          {/* Dashboard Header */}
          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-[#ffffff]">내 강의실</h1>

            {/* Learning Stats */}
            <div className="bg-[#1a1a1a] rounded-lg shadow-md p-8 space-y-4 border border-gray-800">
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-gray-400 text-sm font-medium mb-2">수강 중</p>
                  <p className="text-4xl font-bold text-[#FFD700]">{activeCourses.length}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm font-medium mb-2">완강</p>
                  <p className="text-4xl font-bold text-[#ffffff]">{completedCourses.length}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm font-medium mb-2">전체</p>
                  <p className="text-4xl font-bold text-gray-400">{enrollments.length}</p>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 text-red-400">
              {error}
            </div>
          )}

          {/* Active Courses */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-[#ffffff] flex items-center gap-2">
              📚 수강 중인 강의 ({activeCourses.length})
            </h2>

            {activeCourses.length > 0 ? (
              <div className="grid md:grid-cols-3 gap-6">
                {activeCourses.map((enrollment) => (
                  <div key={enrollment.id} className="bg-[#1a1a1a] rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition border border-gray-800">
                    {/* Thumbnail */}
                    <div className="h-32 bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                      <span className="text-gray-500">📚</span>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-4">
                      {/* Title */}
                      <div>
                        <h3 className="font-bold text-base line-clamp-2 text-[#ffffff]">
                          {enrollment.courseTitle}
                        </h3>
                      </div>

                      {/* Date */}
                      <p className="text-xs text-gray-500">
                        수강 시작: {new Date(enrollment.enrolledAt).toLocaleDateString('ko-KR')}
                      </p>

                      {/* Action Button */}
                      <Link
                        href={`/learning/${enrollment.courseId}`}
                        className="block w-full bg-[#FFD700] text-[#000000] text-center py-2 rounded-lg font-medium hover:bg-yellow-400 transition text-sm"
                      >
                        학습하기
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-[#1a1a1a] rounded-lg shadow-sm p-12 text-center border border-gray-800">
                <p className="text-gray-400 mb-4">수강 중인 강의가 없습니다</p>
                <Link
                  href="/courses"
                  className="inline-block bg-[#ffffff] text-[#000000] px-6 py-2 rounded-lg hover:bg-gray-200 transition font-medium"
                >
                  강의 탐색하기
                </Link>
              </div>
            )}
          </div>

          {/* Completed Courses */}
          {completedCourses.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-[#ffffff] flex items-center gap-2">
                ✓ 완강한 강의 ({completedCourses.length})
              </h2>

              <div className="grid md:grid-cols-3 gap-6">
                {completedCourses.map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="bg-[#1a1a1a] rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition opacity-75 border border-gray-800"
                  >
                    {/* Thumbnail */}
                    <div className="h-32 bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                      <span className="text-gray-500">✓</span>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-4">
                      {/* Title */}
                      <div>
                        <h3 className="font-bold text-base line-clamp-2 text-[#ffffff]">
                          {enrollment.courseTitle}
                        </h3>
                      </div>

                      {/* Badge */}
                      <div className="flex items-center gap-2 text-xs text-[#ffffff] bg-gray-800 w-fit px-3 py-1 rounded-full">
                        <span>✓</span>
                        <span>완강</span>
                      </div>

                      {/* Completion Date */}
                      <p className="text-xs text-gray-500">
                        등록: {new Date(enrollment.enrolledAt).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
