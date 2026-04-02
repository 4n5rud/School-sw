'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { mockCourseDetail, mockCourses } from '@/lib/mockData';
import { useParams } from 'next/navigation';

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = parseInt(params.id as string);
  const [isEnrolled, setIsEnrolled] = useState(false);

  const course = mockCourseDetail[courseId];
  const courseInfo = mockCourses.find((c) => c.id === courseId);

  if (!course || !courseInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#000000]">
        <p className="text-gray-400 text-lg">강의를 찾을 수 없습니다</p>
      </div>
    );
  }

  const handleEnroll = () => {
    setIsEnrolled(true);
    alert('강의 수강이 신청되었습니다!');
  };

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
                    <span className="text-yellow-500 text-xl">★</span>
                    <span className="text-[#ffffff]">
                      <strong>{course.rating}</strong>
                      <span className="text-gray-400 ml-1">
                        ({course.totalEnrollments}명 참여)
                      </span>
                    </span>
                  </div>
                  <div className="text-gray-400">
                    강사: <strong className="text-[#ffffff]">{course.instructor}</strong>
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
                  <h2 className="text-2xl font-bold text-[#ffffff]">커리큘럼</h2>
                  <div className="space-y-4">
                    {course.sections.map((section, idx) => (
                      <div key={section.id} className="border border-gray-800 rounded-lg overflow-hidden">
                        {/* Section Header */}
                        <div className="bg-[#1a1a1a] p-4 border-b border-gray-800 cursor-pointer hover:bg-[#222222]">
                          <h3 className="font-semibold text-[#ffffff]">
                            {section.title}
                          </h3>
                          <p className="text-sm text-gray-400">
                            {section.lectures.length}개 강의
                          </p>
                        </div>

                        {/* Lecture List */}
                        <div className="divide-y divide-gray-800">
                          {section.lectures.map((lecture, lectureIdx) => (
                            <div
                              key={lecture.id}
                              className="p-4 hover:bg-[#111111] transition"
                            >
                              <div className="flex items-start gap-4">
                                <span className="text-gray-500 font-medium text-sm">
                                  {lectureIdx + 1}.
                                </span>
                                <div className="flex-1 space-y-1">
                                  <p className="font-medium text-[#ffffff]">
                                    {lecture.title}
                                  </p>
                                  <p className="text-sm text-gray-400">
                                    {Math.round(lecture.playTime / 60)}분
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
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
                  {!isEnrolled ? (
                    <button
                      onClick={handleEnroll}
                      className="w-full bg-[#ffffff] text-[#000000] font-semibold py-3 rounded-lg hover:bg-gray-200 transition text-lg"
                    >
                      지금 수강하기
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-center text-gray-400 font-medium">
                        ✓ 수강 중입니다
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
