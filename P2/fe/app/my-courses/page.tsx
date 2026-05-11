'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { enrollmentService, courseService } from '@/lib/api';
import { Enrollment } from '@/lib/api/types';
import {
  BookOpenIcon, CheckCircleIcon, SpinnerIcon, AlertCircleIcon,
} from '@/components/Icons';

function StatCard({ label, value, accent = false }: { label: string; value?: number | null; accent?: boolean }) {
  return (
    <div className="bg-[#ffffff] border border-[#e2e2ea] rounded-xl p-5 animate-fade-in-up">
      <p className="text-xs font-medium text-[#9898a8] uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-3xl font-bold ${accent ? 'text-[#e9a000]' : 'text-[#18181b]'}`}>
        {value ?? 0}
      </p>
    </div>
  );
}

function EnrollmentCard({ enrollment, showLearn }: { enrollment: Enrollment; showLearn: boolean }) {
  const thumb = enrollment.thumbnailUrl ?? enrollment.courseThumbnailUrl ?? enrollment.course?.thumbnailUrl;
  return (
    <div className="bg-[#ffffff] border border-[#e2e2ea] rounded-xl overflow-hidden hover:border-[#d0d0dc] transition-all duration-200 animate-fade-in-up flex flex-col">
      {/* Thumbnail */}
      <Link href={`/courses/${enrollment.courseId}`} className="block h-28 bg-[#f0f0f8] flex items-center justify-center shrink-0 overflow-hidden hover:opacity-90 transition-opacity duration-150">
        {thumb ? (
          <img src={thumb} alt={enrollment.courseTitle} className="w-full h-full object-cover" />
        ) : (
          <BookOpenIcon size={28} className="text-[#e2e2ea]" />
        )}
      </Link>

      <div className="p-4 flex flex-col flex-1 gap-3">
        <Link href={`/courses/${enrollment.courseId}`}>
          <h3 className="font-semibold text-sm leading-snug line-clamp-2 text-[#18181b] hover:text-[#e9a000] transition-colors duration-150">
            {enrollment.courseTitle}
          </h3>
        </Link>

        <p className="text-xs text-[#9898a8]">
          등록일 {new Date(enrollment.enrolledAt).toLocaleDateString('ko-KR')}
        </p>

        <div className="mt-auto">
          {showLearn ? (
            <Link
              href={`/learning/${enrollment.courseId}`}
              className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-[#e9a000] text-[#0a0a0d] text-sm font-semibold hover:bg-[#cc8e00] transition-all duration-150"
            >
              <BookOpenIcon size={14} />
              학습하기
            </Link>
          ) : (
            <div className="flex items-center gap-1.5 w-full py-2.5 rounded-xl bg-[#dcfce7] border border-[#bbf7d0] justify-center">
              <CheckCircleIcon size={14} className="text-[#4ade80]" />
              <span className="text-sm font-medium text-[#4ade80]">완강</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MyCoursesPage() {
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      setIsLoading(false);
      return;
    }
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await enrollmentService.getMyEnrollments(0, 100);
        let list: Enrollment[] = [];
        if ((response as any).data?.content) list = (response as any).data.content;
        else if ((response as any).content) list = (response as any).content;
        else if (Array.isArray(response)) list = response as Enrollment[];

        // Enrollment API doesn't return thumbnailUrl — fetch course details in parallel
        const courseResults = await Promise.allSettled(
          list.map((e) => courseService.getCourseById(e.courseId))
        );
        const enriched = list.map((e, i) => {
          const result = courseResults[i];
          const thumb = result.status === 'fulfilled' ? result.value?.thumbnailUrl : undefined;
          return thumb ? { ...e, thumbnailUrl: thumb } : e;
        });
        setEnrollments(enriched);
      } catch (err: any) {
        setError(err.message || '수강 목록을 불러오는데 실패했습니다');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [isLoggedIn]);

  const active = enrollments.filter((e) => !e.isCompleted);
  const completed = enrollments.filter((e) => e.isCompleted);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f4f4f8]">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <SpinnerIcon size={32} className="text-[#e9a000]" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f4f4f8]">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-[#f0f0f8] border border-[#e2e2ea] flex items-center justify-center mx-auto mb-5">
              <BookOpenIcon size={28} className="text-[#9898a8]" />
            </div>
            <h2 className="text-lg font-semibold text-[#18181b] mb-2">로그인이 필요합니다</h2>
            <p className="text-sm text-[#9898a8] mb-6">내 강의실을 이용하려면 로그인하세요</p>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#e9a000] text-[#0a0a0d] font-semibold text-sm hover:bg-[#cc8e00] transition-all duration-150"
            >
              로그인하기
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f4f8]">
      <Header />

      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">
          {/* Page Title */}
          <div className="animate-fade-in-up">
            <h1 className="text-2xl font-bold text-[#18181b] tracking-tight">내 강의실</h1>
            <p className="text-sm text-[#9898a8] mt-1">수강 중인 강의와 완강한 강의를 관리하세요</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="수강 중" value={active.length} accent />
            <StatCard label="완강" value={completed.length} />
            <StatCard label="전체" value={enrollments.length} />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2.5 p-4 rounded-xl bg-[#fee2e2] border border-[#fecaca]">
              <AlertCircleIcon size={16} className="text-[#ef4444] shrink-0" />
              <p className="text-sm text-[#f87171]">{error}</p>
            </div>
          )}

          {/* Active Courses */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#18181b]">
                수강 중인 강의
                <span className="ml-2 text-sm font-normal text-[#9898a8]">({active.length})</span>
              </h2>
              {active.length === 0 && (
                <Link
                  href="/"
                  className="text-sm text-[#e9a000] hover:text-[#cc8e00] transition-colors duration-150"
                >
                  강의 탐색하기
                </Link>
              )}
            </div>

            {active.length > 0 ? (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
                {active.map((e) => (
                  <EnrollmentCard key={e.id} enrollment={e} showLearn />
                ))}
              </div>
            ) : (
              <div className="bg-[#ffffff] border border-[#e2e2ea] rounded-xl p-10 text-center animate-fade-in">
                <BookOpenIcon size={36} className="text-[#e2e2ea] mx-auto mb-4" />
                <p className="text-sm text-[#9898a8]">수강 중인 강의가 없습니다</p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 mt-4 px-4 py-2.5 rounded-xl bg-[#f0f0f8] border border-[#e2e2ea] text-sm text-[#18181b] hover:bg-[#e8e8f2] hover:border-[#d0d0dc] transition-all duration-150"
                >
                  강의 탐색하기
                </Link>
              </div>
            )}
          </div>

          {/* Completed Courses */}
          {completed.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-[#18181b]">
                완강한 강의
                <span className="ml-2 text-sm font-normal text-[#9898a8]">({completed.length})</span>
              </h2>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
                {completed.map((e) => (
                  <EnrollmentCard key={e.id} enrollment={e} showLearn={false} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
