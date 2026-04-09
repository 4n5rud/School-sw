'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { courseService, enrollmentService } from '@/lib/api';
import { Course } from '@/lib/api/types';
import { useAuth } from '@/lib/context/AuthContext';

/**
 * 강의 상세 페이지
 * - 강의 정보 표시
 * - 수강신청 / 학습하기 버튼
 */
export default function CourseDetailPage() {
  const params = useParams();
  const courseId = parseInt(params.id as string);
  
  const { user, isLoggedIn } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);

  // 강의 정보 로드
  useEffect(() => {
    const loadCourse = async () => {
      try {
        setIsLoading(true);
        const data = await courseService.getCourseById(courseId);
        setCourse(data);
        console.log('[CourseDetail] 강의 정보 로드:', data);

        // 수강 여부 확인
        if (isLoggedIn && user) {
          const enrollments = await enrollmentService.getMyEnrollments(0, 100);
          let enrollmentList: any[] = [];
          
          if ((enrollments as any).data?.content) {
            enrollmentList = (enrollments as any).data.content;
          } else if ((enrollments as any).content) {
            enrollmentList = (enrollments as any).content;
          } else if (Array.isArray(enrollments)) {
            enrollmentList = enrollments;
          }

          const enrolled = enrollmentList.some((e) => e.courseId === courseId);
          setIsEnrolled(enrolled);
          console.log('[CourseDetail] 수강 여부:', enrolled);
        }
      } catch (err: any) {
        console.error('강의 정보 로드 실패:', err);
        setError(err.message || '강의를 불러오는데 실패했습니다');
      } finally {
        setIsLoading(false);
      }
    };

    loadCourse();
  }, [courseId, isLoggedIn, user]);

  const handleEnroll = async () => {
    if (!isLoggedIn) {
      window.location.href = '/auth/login';
      return;
    }

    try {
      setIsEnrolling(true);
      await enrollmentService.enrollCourse(courseId);
      setIsEnrolled(true);
      console.log('[CourseDetail] 수강신청 완료');
    } catch (err: any) {
      console.error('수강신청 실패:', err);
      alert(err.message || '수강신청에 실패했습니다');
    } finally {
      setIsEnrolling(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-[#000000] flex items-center justify-center">
          <p className="text-xl text-gray-400">강의 정보를 불러오는 중입니다...</p>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !course) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-[#000000]">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-red-400 mb-4">오류가 발생했습니다</h1>
              <p className="text-gray-400 mb-8">{error || '강의를 찾을 수 없습니다'}</p>
              <Link href="/" className="inline-block bg-[#FFD700] text-black px-6 py-2 rounded-lg font-semibold hover:bg-yellow-400 transition">
                홈으로 돌아가기
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#000000]">
        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* Breadcrumb */}
          <div className="mb-8 text-gray-400">
            <Link href="/" className="hover:text-[#FFD700] transition">홈</Link>
            <span className="mx-2">/</span>
            <span>{course.title}</span>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Left: Thumbnail */}
            <div className="md:col-span-2 space-y-8">
              {/* Thumbnail */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
                {course.thumbnailUrl ? (
                  <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center">
                    <p className="text-6xl mb-4">
                      {course.category === 'DOMESTIC_STOCK' ? '📈' : 
                       course.category === 'OVERSEAS_STOCK' ? '🌍' : 
                       course.category === 'CRYPTO' ? '🪙' : 
                       course.category === 'NFT' ? '🎨' : 
                       course.category === 'ETF' ? '📊' : '⚡'}
                    </p>
                    <p className="text-gray-400">강의 이미지</p>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-4">
                <h1 className="text-4xl font-bold text-[#ffffff]">{course.title}</h1>
                <p className="text-gray-400 text-lg">{course.description}</p>

                {/* Instructor Info */}
                <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-[#ffffff] mb-4">강사</h3>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#FFD700] rounded-full flex items-center justify-center text-black text-lg font-bold">
                      {course.instructor.nickname.charAt(0)}
                    </div>
                    <div>
                      <p className="text-[#ffffff] font-semibold">{course.instructor.nickname}</p>
                      <p className="text-gray-400 text-sm">{course.instructor.email}</p>
                    </div>
                  </div>
                </div>

                {/* Course Info */}
                <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-gray-400 text-sm mb-2">수강 생</p>
                    <p className="text-2xl font-bold text-[#ffffff]">{course.studentCount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-2">카테고리</p>
                    <p className="text-lg font-semibold text-[#FFD700]">
                      {course.category === 'DOMESTIC_STOCK' ? '국내주식' : 
                       course.category === 'OVERSEAS_STOCK' ? '해외주식' : 
                       course.category === 'CRYPTO' ? '암호화폐' : 
                       course.category === 'NFT' ? 'NFT' : 
                       course.category === 'ETF' ? 'ETF' : '선물투자'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-2">평점</p>
                    <p className="text-xl font-bold text-yellow-400">⭐ {(course.rating || 4.5).toFixed(1)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-2">가격</p>
                    <p className="text-lg font-bold text-[#FFD700]">₩{course.price.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="space-y-4">
              <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 sticky top-20 space-y-4">
                {/* Price Display */}
                <div className="text-center py-4 border-b border-gray-700">
                  <p className="text-gray-400 text-sm mb-2">강의 가격</p>
                  <p className="text-4xl font-bold text-[#FFD700]">₩{course.price.toLocaleString()}</p>
                </div>

                {/* Action Buttons */}
                {isEnrolled ? (
                  <>
                    <Link
                      href={`/learning/${courseId}`}
                      className="block w-full bg-[#FFD700] text-black py-3 rounded-lg font-semibold hover:bg-yellow-400 transition text-lg text-center"
                    >
                      🎓 학습하기
                    </Link>
                    <p className="text-center text-green-400 text-sm">수강 중인 강의입니다</p>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleEnroll}
                      disabled={isEnrolling}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition text-lg disabled:bg-gray-700 disabled:cursor-not-allowed"
                    >
                      {isEnrolling ? '수강신청 중...' : '💳 수강신청'}
                    </button>
                    <p className="text-center text-gray-400 text-xs">
                      {isLoggedIn ? '수강신청 후 학습을 시작하세요' : '로그인하여 수강신청하세요'}
                    </p>
                  </>
                )}

                {/* Info */}
                <div className="pt-4 border-t border-gray-700 space-y-2 text-sm text-gray-400">
                  <div className="flex justify-between">
                    <span>학생 수</span>
                    <span className="text-white">{course.studentCount}명</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
