'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { teacherService } from '@/lib/api';
import { TeacherStudentList, TeacherCourseStats } from '@/lib/api/types';
import {
  ChevronLeftIcon, SpinnerIcon, AlertCircleIcon, UsersIcon,
  CheckCircleIcon, BarChartIcon,
} from '@/components/Icons';

export default function CourseStudentsPage() {
  const { id } = useParams();
  const courseId = parseInt(id as string);
  const { user, isLoading: authLoading } = useAuth();

  const [studentData, setStudentData] = useState<TeacherStudentList | null>(null);
  const [stats, setStats] = useState<TeacherCourseStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'students' | 'stats'>('students');

  useEffect(() => {
    if (authLoading) return;
    const load = async () => {
      try {
        const [sd, st] = await Promise.all([
          teacherService.getCourseStudents(courseId),
          teacherService.getCourseStats(courseId),
        ]);
        setStudentData(sd);
        setStats(st);
      } catch (err: any) {
        setError(err.message || '데이터를 불러오는데 실패했습니다');
      } finally {
        setIsLoading(false);
      }
    };
    if (!isNaN(courseId)) load();
  }, [courseId, authLoading]);

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

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f4f4f8]">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <AlertCircleIcon size={40} className="text-[#ef4444] mx-auto mb-4" />
            <p className="text-[#18181b] font-semibold mb-2">{error}</p>
            <Link href="/teacher/courses" className="text-sm text-[#e9a000] hover:text-[#cc8e00]">강의 목록으로</Link>
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
        <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
          {/* Header */}
          <div>
            <nav className="flex items-center gap-2 text-sm text-[#9898a8] mb-4">
              <Link href="/teacher/courses" className="hover:text-[#6b6b7b] transition-colors duration-150">내 강의</Link>
              <ChevronLeftIcon size={14} className="rotate-180" />
              <Link href={`/teacher/courses/${courseId}/manage`} className="hover:text-[#6b6b7b] transition-colors duration-150 line-clamp-1">
                {studentData?.courseTitle || '강의'}
              </Link>
              <ChevronLeftIcon size={14} className="rotate-180" />
              <span className="text-[#6b6b7b]">수강생</span>
            </nav>
            <h1 className="text-xl font-bold text-[#18181b]">{studentData?.courseTitle}</h1>
          </div>

          {/* Stats Summary */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-[#ffffff] border border-[#e2e2ea] rounded-xl p-5">
                <p className="text-xs text-[#9898a8] uppercase tracking-wider mb-1">수강생</p>
                <p className="text-2xl font-bold text-[#18181b]">{(stats.totalEnrollments ?? 0).toLocaleString()}</p>
              </div>
              <div className="bg-[#ffffff] border border-[#e2e2ea] rounded-xl p-5">
                <p className="text-xs text-[#9898a8] uppercase tracking-wider mb-1">완강률</p>
                <p className="text-2xl font-bold text-[#e9a000]">{(stats.completionRate ?? 0).toFixed(1)}%</p>
              </div>
              <div className="bg-[#ffffff] border border-[#e2e2ea] rounded-xl p-5">
                <p className="text-xs text-[#9898a8] uppercase tracking-wider mb-1">강의 수</p>
                <p className="text-2xl font-bold text-[#18181b]">{stats.lectureStats.length}</p>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-[#ffffff] border border-[#e2e2ea] rounded-xl w-fit">
            <button
              onClick={() => setTab('students')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                tab === 'students' ? 'bg-[#e9a000] text-[#0a0a0d]' : 'text-[#6b6b7b] hover:text-[#18181b]'
              }`}
            >
              <UsersIcon size={14} />
              수강생 목록
            </button>
            <button
              onClick={() => setTab('stats')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                tab === 'stats' ? 'bg-[#e9a000] text-[#0a0a0d]' : 'text-[#6b6b7b] hover:text-[#18181b]'
              }`}
            >
              <BarChartIcon size={14} />
              강의별 통계
            </button>
          </div>

          {/* Students Tab */}
          {tab === 'students' && studentData && (
            <div className="space-y-3">
              {studentData.students.length === 0 ? (
                <div className="bg-[#ffffff] border border-[#e2e2ea] rounded-xl p-10 text-center">
                  <UsersIcon size={36} className="text-[#e2e2ea] mx-auto mb-3" />
                  <p className="text-sm text-[#9898a8]">아직 수강생이 없습니다</p>
                </div>
              ) : (
                studentData.students.map((student) => (
                  <div key={student.memberId} className="bg-[#ffffff] border border-[#e2e2ea] rounded-xl p-4 flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-[#e9a000] flex items-center justify-center text-[#0a0a0d] text-sm font-bold shrink-0">
                      {(student.nickname ?? '?').charAt(0).toUpperCase()}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-[#18181b] text-sm">{student.nickname}</p>
                        {student.isCompleted && (
                          <span className="flex items-center gap-1 text-xs text-[#4ade80]">
                            <CheckCircleIcon size={11} />
                            완강
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#9898a8] mt-0.5">
                        등록일 {new Date(student.enrolledAt).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                    {/* Progress */}
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-[#9898a8] mb-1">진행률</p>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-[#e2e2ea] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#e9a000] rounded-full transition-all duration-300"
                            style={{ width: `${student.progressRate}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-[#e9a000] w-9 text-right">
                          {student.progressRate}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Stats Tab */}
          {tab === 'stats' && stats && (
            <div className="space-y-3">
              {stats.lectureStats.length === 0 ? (
                <div className="bg-[#ffffff] border border-[#e2e2ea] rounded-xl p-10 text-center">
                  <BarChartIcon size={36} className="text-[#e2e2ea] mx-auto mb-3" />
                  <p className="text-sm text-[#9898a8]">통계 데이터가 없습니다</p>
                </div>
              ) : (
                stats.lectureStats.map((ls, idx) => (
                  <div key={ls.lectureId} className="bg-[#ffffff] border border-[#e2e2ea] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-[#9898a8] shrink-0">{idx + 1}</span>
                        <p className="text-sm font-medium text-[#18181b] line-clamp-1">{ls.lectureTitle}</p>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-[#9898a8] shrink-0">
                        <span className="flex items-center gap-1">
                          <UsersIcon size={11} />
                          시청 {ls.viewCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircleIcon size={11} />
                          완료 {ls.completionCount}
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-[#e2e2ea] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#e9a000] rounded-full"
                        style={{ width: `${ls.viewCount > 0 ? (ls.completionCount / ls.viewCount) * 100 : 0}%` }}
                      />
                    </div>
                    <p className="text-xs text-[#9898a8] mt-1 text-right">
                      완료율 {ls.viewCount > 0 ? Math.round((ls.completionCount / ls.viewCount) * 100) : 0}%
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
