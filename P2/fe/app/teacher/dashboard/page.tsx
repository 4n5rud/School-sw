'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { teacherService } from '@/lib/api';
import { TeacherDashboard } from '@/lib/api/types';
import { SpinnerIcon, AlertCircleIcon, BookOpenIcon, UsersIcon, CheckCircleIcon, BarChartIcon, PlusIcon } from '@/components/Icons';

function StatCard({ label, value, accent = false }: { label: string; value?: number | null; accent?: boolean }) {
  const display = value != null ? value.toLocaleString() : '—';
  return (
    <div className="bg-[#ffffff] border border-[#e2e2ea] rounded-xl p-5">
      <p className="text-xs font-medium text-[#9898a8] uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-3xl font-bold ${accent ? 'text-[#e9a000]' : 'text-[#18181b]'}`}>{display}</p>
    </div>
  );
}

export default function TeacherDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [data, setData] = useState<TeacherDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'TEACHER') {
      setIsLoading(false);
      return;
    }
    const load = async () => {
      try {
        const raw = await teacherService.getDashboard();
        console.log('[Dashboard] 응답 원본:', raw);
        // 응답 구조 정규화
        const normalized: TeacherDashboard = {
          totalCourses: (raw as any)?.totalCourses ?? 0,
          totalStudents: (raw as any)?.totalStudents ?? 0,
          totalCompletions: (raw as any)?.totalCompletions ?? 0,
          courses: Array.isArray((raw as any)?.courses) ? (raw as any).courses : [],
        };
        setData(normalized);
      } catch (err: any) {
        console.error('[Dashboard] 에러:', err);
        setError(err.message || '대시보드를 불러오는데 실패했습니다');
        // 에러여도 빈 데이터로 UI 표시
        setData({ totalCourses: 0, totalStudents: 0, totalCompletions: 0, courses: [] });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [user, authLoading]);

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

  if (!user || user.role !== 'TEACHER') {
    return (
      <div className="min-h-screen flex flex-col bg-[#f4f4f8]">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <AlertCircleIcon size={40} className="text-[#ef4444] mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-[#18181b] mb-2">접근 권한이 없습니다</h2>
            <p className="text-sm text-[#9898a8] mb-6">강사 계정으로 로그인하세요</p>
            <Link href="/auth/login" className="px-5 py-2.5 rounded-xl bg-[#e9a000] text-[#0a0a0d] text-sm font-semibold hover:bg-[#cc8e00] transition-all duration-150">
              로그인
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const courses = data?.courses ?? [];

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f4f8]">
      <Header />
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#18181b]">강사 대시보드</h1>
              <p className="text-sm text-[#9898a8] mt-1">안녕하세요, {user.nickname}님</p>
            </div>
            <Link
              href="/teacher/courses/new"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#e9a000] text-[#0a0a0d] text-sm font-semibold hover:bg-[#cc8e00] transition-all duration-150"
            >
              <PlusIcon size={16} />
              강의 만들기
            </Link>
          </div>

          {error && (
            <div className="flex items-center gap-2.5 p-4 rounded-xl bg-[#fef3c7] border border-[#fde68a]">
              <AlertCircleIcon size={16} className="text-[#fbbf24] shrink-0" />
              <p className="text-sm text-[#fbbf24]">{error} (통계 미연동)</p>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard label="내 강의 수" value={data?.totalCourses} accent />
            <StatCard label="전체 수강생" value={data?.totalStudents} />
            <StatCard label="완강 수" value={data?.totalCompletions} />
          </div>

          {/* Course List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#18181b]">강의별 현황</h2>
              <Link href="/teacher/courses" className="text-sm text-[#e9a000] hover:text-[#cc8e00] transition-colors duration-150">
                강의 관리 →
              </Link>
            </div>
            {courses.length === 0 ? (
              <div className="bg-[#ffffff] border border-[#e2e2ea] rounded-xl p-10 text-center">
                <BookOpenIcon size={36} className="text-[#e2e2ea] mx-auto mb-4" />
                <p className="text-sm text-[#9898a8]">등록한 강의가 없습니다</p>
                <Link
                  href="/teacher/courses/new"
                  className="inline-flex items-center gap-1.5 mt-4 px-4 py-2.5 rounded-xl bg-[#f0f0f8] border border-[#e2e2ea] text-sm text-[#18181b] hover:bg-[#e8e8f2] transition-all duration-150"
                >
                  <PlusIcon size={14} /> 첫 강의 만들기
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {courses.map((c) => (
                  <div key={c.id} className="bg-[#ffffff] border border-[#e2e2ea] rounded-xl p-5 flex items-center gap-4 hover:border-[#d0d0dc] transition-all duration-200">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#18181b] line-clamp-1">{c.title}</p>
                      <div className="flex items-center gap-4 mt-1.5 text-xs text-[#9898a8]">
                        <span className="flex items-center gap-1">
                          <UsersIcon size={12} />
                          수강생 {(c.enrollmentCount ?? 0).toLocaleString()}명
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircleIcon size={12} />
                          완강 {(c.completionCount ?? 0).toLocaleString()}명
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-xs text-[#9898a8]">완강률</p>
                        <p className="text-sm font-semibold text-[#e9a000]">
                          {(c.enrollmentCount ?? 0) > 0
                            ? Math.round(((c.completionCount ?? 0) / c.enrollmentCount) * 100)
                            : 0}%
                        </p>
                      </div>
                      <Link
                        href={`/teacher/courses/${c.id}/students`}
                        className="px-3 py-1.5 rounded-lg bg-[#f0f0f8] border border-[#e2e2ea] text-xs text-[#18181b] hover:bg-[#e8e8f2] transition-all duration-150"
                      >
                        수강생
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Link href="/teacher/courses" className="bg-[#ffffff] border border-[#e2e2ea] rounded-xl p-5 hover:border-[#d0d0dc] transition-all duration-200">
              <BookOpenIcon size={24} className="text-[#e9a000] mb-3" />
              <p className="font-semibold text-[#18181b] text-sm">강의 관리</p>
              <p className="text-xs text-[#9898a8] mt-0.5">강의 생성·수정·삭제</p>
            </Link>
            <Link href="/teacher/courses/new" className="bg-[#ffffff] border border-[#e2e2ea] rounded-xl p-5 hover:border-[#d0d0dc] transition-all duration-200">
              <PlusIcon size={24} className="text-[#60a5fa] mb-3" />
              <p className="font-semibold text-[#18181b] text-sm">새 강의</p>
              <p className="text-xs text-[#9898a8] mt-0.5">새 강의 만들기</p>
            </Link>
            <Link href="/" className="bg-[#ffffff] border border-[#e2e2ea] rounded-xl p-5 hover:border-[#d0d0dc] transition-all duration-200">
              <BarChartIcon size={24} className="text-[#4ade80] mb-3" />
              <p className="font-semibold text-[#18181b] text-sm">플랫폼 탐색</p>
              <p className="text-xs text-[#9898a8] mt-0.5">강의 둘러보기</p>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
