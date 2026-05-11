'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { courseService } from '@/lib/api';
import { Course, CATEGORY_LABELS, CategoryType } from '@/lib/api/types';
import { SpinnerIcon, AlertCircleIcon, BookOpenIcon, UsersIcon } from '@/components/Icons';

const CATEGORY_COLORS: Record<CategoryType, { text: string; bg: string; border: string }> = {
  DOMESTIC_STOCK: { text: '#60a5fa', bg: '#dbeafe', border: '#bfdbfe' },
  OVERSEAS_STOCK: { text: '#2dd4bf', bg: '#ccfbf1', border: '#99f6e4' },
  CRYPTO:         { text: '#fbbf24', bg: '#fef3c7', border: '#fde68a' },
  NFT:            { text: '#c084fc', bg: '#f3e8ff', border: '#e9d5ff' },
  ETF:            { text: '#4ade80', bg: '#dcfce7', border: '#bbf7d0' },
  FUTURES:        { text: '#f87171', bg: '#fee2e2', border: '#fecaca' },
};

export default function InstructorPage() {
  const params = useParams();
  const instructorId = parseInt(params.id as string);

  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const data = await courseService.getCoursesByInstructor(instructorId, 0, 50);
        const published = (data.content || []).filter((c) => c.isPublished);
        setCourses(published);
      } catch (err: any) {
        setError(err.message || '강사 정보를 불러오는데 실패했습니다');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [instructorId]);

  const instructorName =
    courses[0]?.instructor?.nickname ??
    courses[0]?.instructorNickname ??
    '강사';

  const totalStudents = courses.reduce(
    (acc, c) => acc + (c.studentCount ?? c.enrollmentCount ?? 0),
    0
  );

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-[#f4f4f8] flex items-center justify-center">
          <SpinnerIcon size={36} className="text-[#e9a000]" />
        </main>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-[#f4f4f8] flex items-center justify-center px-4">
          <div className="text-center animate-fade-in">
            <AlertCircleIcon size={40} className="text-[#ef4444] mx-auto mb-4" />
            <p className="text-sm text-[#9898a8]">{error}</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f4f8]">
      <Header />

      <main className="flex-1 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Instructor Profile Card */}
          <div className="bg-[#ffffff] border border-[#e2e2ea] rounded-2xl p-8 mb-10 animate-fade-in">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-[#e9a000] flex items-center justify-center text-[#0a0a0d] text-3xl font-bold shrink-0">
                {instructorName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-[#18181b]">{instructorName}</h1>
                <p className="text-sm text-[#6b6b7b] mt-1">강사</p>
                <div className="flex items-center gap-5 mt-3 text-sm text-[#9898a8]">
                  <span className="flex items-center gap-1.5">
                    <BookOpenIcon size={15} />
                    강의 {courses.length}개
                  </span>
                  <span className="flex items-center gap-1.5">
                    <UsersIcon size={15} />
                    수강생 {totalStudents.toLocaleString()}명
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Courses */}
          <div className="animate-fade-in-up">
            <h2 className="text-lg font-bold text-[#18181b] mb-5">
              {instructorName} 강사의 강의
            </h2>

            {courses.length === 0 ? (
              <div className="text-center py-20 text-[#9898a8]">
                <BookOpenIcon size={40} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm">등록된 강의가 없습니다</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {courses.map((course) => {
                  const cat = CATEGORY_COLORS[course.category];
                  const enrollCount = course.studentCount ?? course.enrollmentCount ?? 0;
                  const isFree = (course.price ?? 0) === 0;
                  return (
                    <Link
                      key={course.id}
                      href={`/courses/${course.id}`}
                      className="group bg-[#ffffff] border border-[#e2e2ea] rounded-xl overflow-hidden hover:border-[#d0d0dc] hover:shadow-lg transition-all duration-200"
                    >
                      {/* Thumbnail */}
                      <div className="w-full aspect-video bg-[#f0f0f8] relative overflow-hidden">
                        {course.thumbnailUrl ? (
                          <img
                            src={course.thumbnailUrl}
                            alt={course.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center"
                            style={{ background: cat.bg }}
                          >
                            <span className="text-sm font-bold" style={{ color: cat.text }}>
                              {CATEGORY_LABELS[course.category]}
                            </span>
                          </div>
                        )}
                        <span
                          className="absolute top-2 left-2 text-xs font-semibold px-2 py-0.5 rounded border"
                          style={{ color: cat.text, borderColor: cat.border, background: cat.bg }}
                        >
                          {CATEGORY_LABELS[course.category]}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="p-4 space-y-2">
                        <h3 className="text-sm font-semibold text-[#18181b] line-clamp-2 leading-snug group-hover:text-[#e9a000] transition-colors duration-150">
                          {course.title}
                        </h3>
                        <p className="text-xs text-[#9898a8]">수강생 {enrollCount.toLocaleString()}명</p>
                        <p className="text-base font-bold text-[#e9a000]">
                          {isFree ? '무료' : `₩${(course.price ?? 0).toLocaleString()}`}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
