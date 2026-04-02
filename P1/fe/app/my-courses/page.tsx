'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { mockMyCoures } from '@/lib/mockData';

export default function MyCoursesPage() {
  const activeCourses = mockMyCoures.filter((c) => !c.isCompleted);
  const completedCourses = mockMyCoures.filter((c) => c.isCompleted);

  const totalProgress =
    mockMyCoures.length > 0
      ? Math.round(
          mockMyCoures.reduce((sum, c) => sum + c.progressPercentage, 0) /
            mockMyCoures.length,
        )
      : 0;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#000000] py-12">
        <div className="max-w-7xl mx-auto px-4 space-y-12">
          {/* Dashboard Header */}
          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-[#ffffff]">내 강의실</h1>

            {/* Overall Progress */}
            <div className="bg-[#1a1a1a] rounded-lg shadow-md p-8 space-y-4 border border-gray-800">
              <p className="text-gray-400 font-medium">전체 학습 진도</p>
              <div className="flex items-end gap-6">
                <div>
                  <p className="text-5xl font-bold text-[#ffffff]">{totalProgress}%</p>
                </div>
                <div className="flex-1">
                  <div className="w-full bg-gray-800 rounded-full h-4">
                    <div
                      className="bg-[#ffffff] h-4 rounded-full transition-all duration-500"
                      style={{ width: `${totalProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-400 mt-2">
                    {mockMyCoures.length}개 강의 수강 중
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Active Courses */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-[#ffffff] flex items-center gap-2">
              📚 수강 중인 강의 ({activeCourses.length})
            </h2>

            {activeCourses.length > 0 ? (
              <div className="grid md:grid-cols-3 gap-6">
                {activeCourses.map((course) => (
                  <div key={course.id} className="bg-[#1a1a1a] rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition border border-gray-800">
                    {/* Thumbnail */}
                    <div className="h-32 bg-gradient-to-br from-gray-700 to-gray-800"></div>

                    {/* Content */}
                    <div className="p-4 space-y-4">
                      {/* Title */}
                      <div>
                        <h3 className="font-bold text-base line-clamp-2 text-[#ffffff]">
                          {course.title}
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">
                          {course.instructor}
                        </p>
                      </div>

                      {/* Date */}
                      <p className="text-xs text-gray-500">
                        수강 시작: {new Date(course.enrolledAt).toLocaleDateString()}
                      </p>

                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-400">진도</span>
                          <span className="font-semibold text-[#ffffff]">{course.progressPercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-2">
                          <div
                            className="bg-[#ffffff] h-2 rounded-full transition-all"
                            style={{ width: `${course.progressPercentage}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <Link
                        href={`/learning/${course.courseId}/1`}
                        className="block w-full bg-[#ffffff] text-[#000000] text-center py-2 rounded-lg font-medium hover:bg-gray-200 transition text-sm"
                      >
                        {course.progressPercentage === 0
                          ? '강의 시작'
                          : '계속 학습'}
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
                {completedCourses.map((course) => (
                  <div
                    key={course.id}
                    className="bg-[#1a1a1a] rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition opacity-75 border border-gray-800"
                  >
                    {/* Thumbnail */}
                    <div className="h-32 bg-gradient-to-br from-gray-700 to-gray-800"></div>

                    {/* Content */}
                    <div className="p-4 space-y-4">
                      {/* Title */}
                      <div>
                        <h3 className="font-bold text-base line-clamp-2 text-[#ffffff]">
                          {course.title}
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">
                          {course.instructor}
                        </p>
                      </div>

                      {/* Badge */}
                      <div className="flex items-center gap-2 text-xs text-[#ffffff] bg-gray-800 w-fit px-3 py-1 rounded-full">
                        <span>✓</span>
                        <span>완강</span>
                      </div>

                      {/* Action Button */}
                      <button className="w-full bg-gray-800 text-[#ffffff] py-2 rounded-lg font-medium hover:bg-gray-700 transition text-sm">
                        다시 보기
                      </button>
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
