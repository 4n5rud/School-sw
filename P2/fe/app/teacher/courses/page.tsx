'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { teacherService } from '@/lib/api';
import { TeacherCourse, CATEGORY_LABELS, CategoryType } from '@/lib/api/types';
import {
  SpinnerIcon, AlertCircleIcon, PlusIcon, EditIcon, TrashIcon,
  EyeIcon, EyeOffIcon, BookOpenIcon, UsersIcon, SettingsIcon,
} from '@/components/Icons';

const CATEGORY_COLORS: Record<CategoryType, string> = {
  DOMESTIC_STOCK: '#60a5fa',
  OVERSEAS_STOCK: '#2dd4bf',
  CRYPTO: '#fbbf24',
  NFT: '#c084fc',
  ETF: '#4ade80',
  FUTURES: '#f87171',
};

export default function TeacherCoursesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const load = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await teacherService.getMyCourses();
      setCourses(Array.isArray(data) ? data : []);
    } catch (err: any) {
      // 네트워크 에러(status 0)는 조용히 처리 — 강의 없음 상태로 표시
      const status = (err as any).status ?? 0;
      if (status !== 0) {
        setError(err.message || '강의 목록을 불러오는데 실패했습니다');
      }
      setCourses([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user?.role === 'TEACHER') load();
    else if (!authLoading) setIsLoading(false);
  }, [user, authLoading]);

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`"${title}" 강의를 삭제하시겠습니까?\n\n삭제 시 모든 섹션·영상이 함께 삭제됩니다.`)) return;
    try {
      setDeletingId(id);
      await teacherService.deleteCourse(id);
      setCourses((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      alert(err.message || '삭제에 실패했습니다');
    } finally {
      setDeletingId(null);
    }
  };

  const handleTogglePublish = async (id: number) => {
    try {
      setTogglingId(id);
      const updated = await teacherService.togglePublish(id);
      setCourses((prev) => prev.map((c) => (c.id === id ? { ...c, isPublished: updated.isPublished } : c)));
    } catch (err: any) {
      alert(err.message || '공개 상태 변경에 실패했습니다');
    } finally {
      setTogglingId(null);
    }
  };

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
            <Link href="/auth/login" className="px-5 py-2.5 rounded-xl bg-[#e9a000] text-[#0a0a0d] text-sm font-semibold">
              로그인
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
        <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#18181b]">내 강의 관리</h1>
              <p className="text-sm text-[#9898a8] mt-1">강의를 생성하고 관리하세요</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/teacher/dashboard"
                className="px-3 py-2 rounded-lg text-sm text-[#6b6b7b] bg-[#f0f0f8] border border-[#e2e2ea] hover:text-[#18181b] hover:bg-[#e8e8f2] transition-all duration-150"
              >
                대시보드
              </Link>
              <Link
                href="/teacher/courses/new"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#e9a000] text-[#0a0a0d] text-sm font-semibold hover:bg-[#cc8e00] transition-all duration-150"
              >
                <PlusIcon size={16} />
                새 강의
              </Link>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2.5 p-4 rounded-xl bg-[#fee2e2] border border-[#fecaca]">
              <AlertCircleIcon size={16} className="text-[#ef4444] shrink-0" />
              <p className="text-sm text-[#f87171]">{error}</p>
            </div>
          )}

          {/* Course List */}
          {courses.length === 0 ? (
            <div className="bg-[#ffffff] border border-[#e2e2ea] rounded-xl p-16 text-center">
              <BookOpenIcon size={40} className="text-[#e2e2ea] mx-auto mb-4" />
              <p className="text-[#18181b] font-medium mb-1">아직 등록한 강의가 없습니다</p>
              <p className="text-sm text-[#9898a8] mb-6">첫 번째 강의를 만들어보세요</p>
              <Link
                href="/teacher/courses/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e9a000] text-[#0a0a0d] text-sm font-semibold hover:bg-[#cc8e00] transition-all duration-150"
              >
                <PlusIcon size={16} />
                강의 만들기
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="bg-[#ffffff] border border-[#e2e2ea] rounded-xl p-5 flex items-center gap-4 hover:border-[#d0d0dc] transition-all duration-200"
                >
                  {/* Thumbnail */}
                  <div className="w-20 h-14 rounded-lg bg-[#f0f0f8] overflow-hidden shrink-0">
                    {course.thumbnailUrl ? (
                      <img src={course.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpenIcon size={20} className="text-[#d0d0dc]" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-[#18181b] line-clamp-1">{course.title}</h3>
                      <span
                        className="text-xs px-2 py-0.5 rounded-md font-medium shrink-0"
                        style={{ color: CATEGORY_COLORS[course.category], background: `${CATEGORY_COLORS[course.category]}18` }}
                      >
                        {CATEGORY_LABELS[course.category]}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[#9898a8]">
                      <span className="flex items-center gap-1">
                        <UsersIcon size={12} />
                        {course.enrollmentCount}명
                      </span>
                      <span className="text-[#e9a000] font-medium">
                        {(course.price ?? 0) === 0 ? '무료' : `₩${(course.price ?? 0).toLocaleString()}`}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          course.isPublished
                            ? 'bg-[#dcfce7] text-[#4ade80]'
                            : 'bg-[#f0f0f8] text-[#9898a8]'
                        }`}
                      >
                        {course.isPublished ? '공개' : '비공개'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/teacher/courses/${course.id}/manage`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f0f0f8] border border-[#e2e2ea] text-xs text-[#18181b] hover:bg-[#e8e8f2] transition-all duration-150"
                      title="섹션·강의 관리"
                    >
                      <SettingsIcon size={13} />
                      관리
                    </Link>
                    <Link
                      href={`/teacher/courses/${course.id}/edit`}
                      className="p-2 rounded-lg bg-[#f0f0f8] border border-[#e2e2ea] text-[#6b6b7b] hover:text-[#18181b] hover:bg-[#e8e8f2] transition-all duration-150"
                      title="수정"
                    >
                      <EditIcon size={15} />
                    </Link>
                    <button
                      onClick={() => handleTogglePublish(course.id)}
                      disabled={togglingId === course.id}
                      className="p-2 rounded-lg bg-[#f0f0f8] border border-[#e2e2ea] text-[#6b6b7b] hover:text-[#18181b] hover:bg-[#e8e8f2] disabled:opacity-50 transition-all duration-150"
                      title={course.isPublished ? '비공개로 전환' : '공개로 전환'}
                    >
                      {togglingId === course.id ? (
                        <SpinnerIcon size={15} />
                      ) : course.isPublished ? (
                        <EyeOffIcon size={15} />
                      ) : (
                        <EyeIcon size={15} />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(course.id, course.title)}
                      disabled={deletingId === course.id}
                      className="p-2 rounded-lg bg-[#f0f0f8] border border-[#e2e2ea] text-[#6b6b7b] hover:text-[#ef4444] hover:bg-[#fee2e2] hover:border-[#fecaca] disabled:opacity-50 transition-all duration-150"
                      title="삭제"
                    >
                      {deletingId === course.id ? <SpinnerIcon size={15} /> : <TrashIcon size={15} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
