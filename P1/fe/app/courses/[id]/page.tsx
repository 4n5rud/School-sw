'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { courseService, enrollmentService } from '@/lib/api';
import { useParams } from 'next/navigation';
import { Course } from '@/lib/api/types';
import { useAuth } from '@/lib/context/AuthContext';

export default function CourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = parseInt(params.id as string);
  const { isLoggedIn } = useAuth();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollSuccess, setEnrollSuccess] = useState(false);

  // 강의 상세 정보 로드
  useEffect(() => {
    const loadCourse = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const courseData = await courseService.getCourseById(courseId);
        setCourse(courseData);
      } catch (err: any) {
        console.error('강의 조회 실패:', err);
        setError(err.message || '강의를 불러오는데 실패했습니다');
      } finally {
        setIsLoading(false);
      }
    };

    loadCourse();
  }, [courseId]);

  // 수강 신청 핸들러
  const handleEnroll = async () => {
    if (!isLoggedIn) {
      alert('로그인 후 수강 신청이 가능합니다');
      router.push('/auth/login');
      return;
    }

    try {
      setIsEnrolling(true);
      console.log('수강 신청 시작:', { courseId, isLoggedIn });
      await enrollmentService.enrollCourse(courseId);
      console.log('[수강신청 성공] 강의ID:', courseId);
      setEnrollSuccess(true);
      alert('수강 신청이 완료되었습니다!');
    } catch (err: any) {
      console.error('[수강신청 에러]', err);
      
      // ⭐ 401 에러: 토큰 만료 또는 유효하지 않음
      if (err.status === 401) {
        alert('로그인 정보가 만료되었습니다. 다시 로그인해주세요');
        router.push('/auth/login');
      } 
      // 409 에러: 이미 등록된 강의
      else if (err.status === 409) {
        alert('이미 등록된 강의입니다');
      }
      // 403 에러: 강의를 찾을 수 없음
      else if (err.status === 403) {
        alert('강의를 찾을 수 없습니다');
      }
      // 기타 에러
      else {
        alert(err.message || '수강 신청에 실패했습니다');
      }
    } finally {
      setIsEnrolling(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-[#000000] flex items-center justify-center">
          <p className="text-gray-400 text-xl">강의를 불러오는 중...</p>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !course) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-[#000000] flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-400 text-lg mb-4">{error || '강의를 찾을 수 없습니다'}</p>
            <Link href="/courses" className="inline-block text-[#FFD700] hover:text-yellow-400">
              강의 목록으로 돌아가기
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
      <main className="min-h-screen bg-[#000000]">
        {/* Hero Section */}
        <section className="bg-[#000000]">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="grid md:grid-cols-3 gap-12">
              {/* Left - Course Info */}
              <div className="md:col-span-2 space-y-8">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Link href="/" className="hover:text-gray-300">
                    홈
                  </Link>
                  <span>/</span>
                  <Link href="/courses" className="hover:text-gray-300">
                    강의
                  </Link>
                  <span>/</span>
                  <span className="text-[#ffffff] font-semibold">{course.title}</span>
                </div>

                {/* Category */}
                <div className="inline-block">
                  <span className="px-4 py-2 bg-gray-800 text-[#ffffff] rounded-full text-sm font-semibold">
                    {course.category === 'DOMESTIC_STOCK' ? '📈 국내주식' : course.category === 'OVERSEAS_STOCK' ? '🌍 해외주식' : course.category === 'CRYPTO' ? '🪙 암호화폐' : course.category === 'NFT' ? '🎨 NFT' : course.category === 'ETF' ? '📊 ETF' : '⚡ 선물투자'}
                  </span>
                </div>

                {/* Title */}
                <h1 className="text-4xl font-bold text-[#ffffff] leading-tight">
                  {course.title}
                </h1>

                {/* Meta Info */}
                <div className="flex flex-wrap gap-6 text-base">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-500 text-xl">👥</span>
                    <span className="text-[#ffffff]">
                      <strong>{course.studentCount}</strong>
                      <span className="text-gray-400 ml-1">명 수강 중</span>
                    </span>
                  </div>
                  <div className="text-gray-400">
                    강사: <strong className="text-[#ffffff]">{course.instructor.nickname}</strong>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-[#ffffff]">강의 소개</h2>
                  <p className="text-gray-300 leading-relaxed text-lg">
                    {course.description}
                  </p>
                </div>

                {/* Curriculum */}
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-[#ffffff]">강의 특징</h2>
                  <div className="space-y-4">
                    {[
                      '체계적인 커리큘럼으로 기초부터 심화까지 학습',
                      '실제 투자 사례를 통한 실전 스킬 습득',
                      '전문가 강사진의 개인 피드백',
                      '언제 어디서나 학습할 수 있는 온디맨드 강의'
                    ].map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-4 p-4 bg-[#1a1a1a] rounded-lg border border-gray-800">
                        <span className="text-[#FFD700] text-lg">✓</span>
                        <p className="text-gray-300">{feature}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right - Enroll Card */}
              <div>
                <div className="sticky top-20 bg-[#1a1a1a] rounded-lg shadow-lg p-6 space-y-6 border border-gray-800">
                  {/* Thumbnail */}
                  <div className="w-full h-40 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center">
                    <span className="text-[#ffffff] text-center font-semibold">
                      강의 썸네일
                    </span>
                  </div>

                  {/* Price */}
                  <div>
                    <p className="text-sm text-gray-400 mb-1">가격</p>
                    <p className="text-3xl font-bold text-[#ffffff]">
                      ₩{course.price.toLocaleString()}
                    </p>
                  </div>

                  {/* Enroll Button */}
                  {!enrollSuccess ? (
                    <button
                      onClick={handleEnroll}
                      disabled={isEnrolling}
                      className="w-full bg-[#FFD700] text-[#000000] font-semibold py-3 rounded-lg hover:bg-yellow-400 disabled:bg-gray-600 transition text-lg"
                    >
                      {isEnrolling ? '수강 신청 중...' : '지금 수강하기'}
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-center text-green-400 font-medium">
                        ✓ 수강 신청 완료
                      </p>
                      <Link
                        href="/my-courses"
                        className="block w-full bg-[#ffffff] text-[#000000] font-semibold py-3 rounded-lg hover:bg-gray-200 transition text-lg text-center"
                      >
                        내 강의실 가기
                      </Link>
                    </div>
                  )}

                  {/* Features */}
                  <div className="space-y-3 border-t border-gray-800 pt-6">
                    {[
                      { icon: '📱', text: '모든 기기에서 학습 가능' },
                      { icon: '🎓', text: '수료증 발급' },
                      { icon: '🔄', text: '무제한 재시청' },
                    ].map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-gray-300">
                        <span>{feature.icon}</span>
                        <span className="text-sm">{feature.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
