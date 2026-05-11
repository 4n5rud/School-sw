'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import VideoPlayer from '@/components/VideoPlayer';
import { sectionService, courseService, lectureProgressService } from '@/lib/api';
import { Course, Section, Lecture, LectureProgress } from '@/lib/api/types';
import { useAuth } from '@/lib/context/AuthContext';
import {
  ArrowLeftIcon, ArrowRightIcon, ChevronLeftIcon, ChevronDownIcon,
  BookOpenIcon, ClockIcon, UsersIcon, SpinnerIcon, XIcon, CheckCircleIcon,
  VideoIcon, AwardIcon,
} from '@/components/Icons';

function formatDuration(secs?: number): string {
  if (!secs) return '—';
  const m = Math.floor(secs / 60);
  return `${m}분`;
}

function formatTime(seconds?: number): string {
  if (!seconds || !Number.isFinite(seconds) || seconds === 0) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ── Sidebar with progress checkmarks ──────────────────────────────────────
interface ProgressSidebarProps {
  sections: Section[];
  selectedLectureId?: number;
  onLectureSelect: (lectureId: number) => void;
  expandedSectionId?: number | null;
  onSectionToggle?: (sectionId: number) => void;
  completedLectureIds: Set<number>;
}

function ProgressSidebar({
  sections,
  selectedLectureId,
  onLectureSelect,
  expandedSectionId,
  onSectionToggle,
  completedLectureIds,
}: ProgressSidebarProps) {
  const [expanded, setExpanded] = useState<Set<number>>(
    expandedSectionId != null ? new Set([expandedSectionId]) : new Set()
  );

  useEffect(() => {
    if (expandedSectionId != null) {
      setExpanded((prev) => new Set([...prev, expandedSectionId]));
    }
  }, [expandedSectionId]);

  const toggleSection = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    onSectionToggle?.(id);
  };

  if (sections.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-[#9898a8]">
        강의 목록이 없습니다
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {sections.map((section) => {
        const isOpen = expanded.has(section.id);
        const lectureCount = section.lectures?.length ?? 0;
        const completedInSection = section.lectures?.filter((l) => completedLectureIds.has(l.id)).length ?? 0;

        return (
          <div key={section.id}>
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-[#f0f0f8] transition-all duration-150 text-left group"
            >
              <span
                className="text-[#9898a8] transition-transform duration-200"
                style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}
              >
                <ChevronDownIcon size={15} />
              </span>
              <span className="flex-1 text-sm font-medium text-[#6b6b7b] group-hover:text-[#18181b] transition-colors duration-150 line-clamp-1">
                {section.title}
              </span>
              <span className="text-xs text-[#9898a8] shrink-0">
                {completedInSection}/{lectureCount}
              </span>
            </button>

            {isOpen && section.lectures && (
              <div className="ml-2 mt-0.5 space-y-0.5">
                {section.lectures.map((lecture) => {
                  const isSelected = selectedLectureId === lecture.id;
                  const isCompleted = completedLectureIds.has(lecture.id);
                  const duration = formatTime(lecture.playTime);

                  return (
                    <button
                      key={lecture.id}
                      onClick={() => onLectureSelect(lecture.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-150 flex items-start gap-2.5 ${
                        isSelected
                          ? 'bg-[#fef3c7] border border-[#fde68a] text-[#e9a000]'
                          : 'text-[#9898a8] hover:text-[#6b6b7b] hover:bg-[#f0f0f8]'
                      }`}
                    >
                      {/* Completed checkmark or video icon */}
                      {isCompleted ? (
                        <span className="mt-0.5 shrink-0">
                          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                          </svg>
                        </span>
                      ) : (
                        <VideoIcon size={14} className="mt-0.5 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`line-clamp-2 leading-snug ${isCompleted && !isSelected ? 'text-[#6b6b7b]' : ''}`}>
                          {lecture.title}
                        </p>
                        {duration && (
                          <div className="flex items-center gap-1 mt-1">
                            <ClockIcon size={11} className="text-[#d0d0dc]" />
                            <span className="text-xs text-[#d0d0dc]">{duration}</span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function LearningPage() {
  const params = useParams();
  const courseId = parseInt(params.courseId as string);
  const { isLoggedIn } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSectionId, setExpandedSectionId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Progress state
  const [completedLectureIds, setCompletedLectureIds] = useState<Set<number>>(new Set());
  const [markingComplete, setMarkingComplete] = useState(false);
  const [allCompleted, setAllCompleted] = useState(false);
  const [completingCourse, setCompletingCourse] = useState(false);
  const [completionMsg, setCompletionMsg] = useState('');
  const [showCompletionBanner, setShowCompletionBanner] = useState(false);

  // Load progress from API
  const loadProgress = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const progressList = await lectureProgressService.getMyLectureProgress();
      const completedIds = new Set(
        progressList
          .filter((p: LectureProgress) => p.isCompleted)
          .map((p: LectureProgress) => p.lectureId)
      );
      setCompletedLectureIds(completedIds);
    } catch {
      // silent — progress is optional
    }
  }, [isLoggedIn]);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const [courseData, sectionsData] = await Promise.all([
          courseService.getCourseById(courseId),
          sectionService.getSectionsByCourse(courseId),
        ]);
        setCourse(courseData);
        setSections(sectionsData);
        if (sectionsData.length > 0 && sectionsData[0].lectures?.length > 0) {
          setSelectedLecture(sectionsData[0].lectures[0]);
          setExpandedSectionId(sectionsData[0].id);
        }
      } catch (err: any) {
        setError(err.message || '강의 정보를 불러오는데 실패했습니다');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [courseId]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  // Compute allCompleted — show banner when it first becomes true
  useEffect(() => {
    const allLectures = sections.flatMap((s) => s.lectures ?? []);
    if (allLectures.length > 0 && completedLectureIds.size >= allLectures.length) {
      const allIds = allLectures.map((l) => l.id);
      const done = allIds.every((id) => completedLectureIds.has(id));
      if (done && !allCompleted) setShowCompletionBanner(true);
      setAllCompleted(done);
    } else {
      setAllCompleted(false);
    }
  }, [sections, completedLectureIds]);

  const handleLectureSelect = (lectureId: number) => {
    for (const section of sections) {
      const lec = section.lectures?.find((l) => l.id === lectureId);
      if (lec) {
        setSelectedLecture(lec);
        setExpandedSectionId(section.id);
        break;
      }
    }
  };

  const navigate = (dir: 'prev' | 'next') => {
    if (!selectedLecture) return;
    const allLectures = sections.flatMap((s) => s.lectures ?? []);
    const idx = allLectures.findIndex((l) => l.id === selectedLecture.id);
    const target = dir === 'prev' ? allLectures[idx - 1] : allLectures[idx + 1];
    if (target) {
      setSelectedLecture(target);
      for (const s of sections) {
        if (s.lectures?.some((l) => l.id === target.id)) {
          setExpandedSectionId(s.id);
          break;
        }
      }
    }
  };

  // Mark current lecture as completed — optimistic update first, then sync to API
  const handleMarkComplete = async () => {
    if (!selectedLecture || !isLoggedIn || isCurrentCompleted) return;
    // Immediately show checkmark regardless of API result
    setCompletedLectureIds((prev) => new Set([...prev, selectedLecture.id]));
    setMarkingComplete(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/lecture-progress`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ lectureId: selectedLecture.id, lastPosition: 0 }),
        }
      );
      if (!res.ok) {
        await lectureProgressService.saveLectureProgress(selectedLecture.id, 0);
      }
    } catch {
      // silent — UI already updated optimistically
    } finally {
      setMarkingComplete(false);
    }
  };

  // Complete entire course
  const handleCompleteCourse = async () => {
    setCompletingCourse(true);
    setCompletionMsg('');
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/enrollments/courses/${courseId}/complete`,
        { method: 'PUT', headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error();
      setCompletionMsg('success');
    } catch {
      setCompletionMsg('fail');
    } finally {
      setCompletingCourse(false);
    }
  };

  const allLectures = sections.flatMap((s) => s.lectures ?? []);
  const currentIdx = selectedLecture
    ? allLectures.findIndex((l) => l.id === selectedLecture.id)
    : -1;
  const hasPrev = currentIdx > 0;
  const hasNext = currentIdx < allLectures.length - 1;

  const totalLectures = allLectures.length;
  const completedCount = allLectures.filter((l) => completedLectureIds.has(l.id)).length;
  const progressPct = totalLectures > 0 ? Math.round((completedCount / totalLectures) * 100) : 0;

  const isCurrentCompleted = selectedLecture
    ? completedLectureIds.has(selectedLecture.id)
    : false;

  if (isLoading) {
    return (
      <div className="w-screen h-screen bg-[#f4f4f8] flex items-center justify-center">
        <SpinnerIcon size={36} className="text-[#e9a000]" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="w-screen h-screen bg-[#f4f4f8] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-[#ef4444] text-sm mb-4">{error || '강의를 찾을 수 없습니다'}</p>
          <Link href="/my-courses" className="text-[#e9a000] hover:text-[#cc8e00] text-sm transition-colors duration-150">
            내 강의실로
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-[#f4f4f8] text-[#18181b] flex flex-col overflow-hidden">

      {/* Completion Banner Modal */}
      {showCompletionBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl animate-fade-in-up">
            <div className="w-16 h-16 rounded-full bg-[#dcfce7] border border-[#bbf7d0] flex items-center justify-center mx-auto mb-4">
              <AwardIcon size={32} className="text-[#4ade80]" />
            </div>
            <h2 className="text-xl font-bold text-[#18181b] mb-2">🎉 모든 강의를 완료했습니다!</h2>
            <p className="text-sm text-[#6b6b7b] mb-6">
              수고하셨습니다. 완강 처리 후 수료증을 발급받을 수 있습니다.
            </p>
            <div className="space-y-2">
              <button
                onClick={async () => {
                  setShowCompletionBanner(false);
                  await handleCompleteCourse();
                }}
                disabled={completingCourse}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#e9a000] text-[#0a0a0d] font-bold hover:bg-[#cc8e00] disabled:opacity-50 transition-all duration-150"
              >
                {completingCourse ? <SpinnerIcon size={16} /> : <AwardIcon size={16} />}
                완강하기 &amp; 수료증 받기
              </button>
              <Link
                href="/my-courses"
                className="w-full flex items-center justify-center py-3 rounded-xl border border-[#e2e2ea] text-[#6b6b7b] text-sm font-medium hover:bg-[#f0f0f8] transition-all duration-150"
                onClick={() => setShowCompletionBanner(false)}
              >
                내 강의실로 돌아가기
              </Link>
              <button
                onClick={() => setShowCompletionBanner(false)}
                className="w-full text-xs text-[#9898a8] hover:text-[#6b6b7b] py-2 transition-colors duration-150"
              >
                계속 강의 보기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <header className="h-14 border-b border-[#e2e2ea] bg-[#ffffff] flex items-center px-4 gap-3 shrink-0">
        <Link
          href="/my-courses"
          className="flex items-center gap-1.5 text-sm font-medium text-[#6b6b7b] hover:text-[#18181b] transition-colors duration-150 shrink-0"
        >
          <ChevronLeftIcon size={16} />
          <span className="hidden sm:inline">내 강의실</span>
        </Link>
        <div className="h-4 w-px bg-[#e2e2ea]" />
        <h1 className="text-sm font-medium text-[#18181b] line-clamp-1 flex-1 min-w-0">
          {course.title}
        </h1>
        {selectedLecture && (
          <span className="text-xs text-[#9898a8] shrink-0 hidden sm:block">
            {currentIdx + 1} / {allLectures.length}
          </span>
        )}
        {allCompleted && (
          <Link
            href="/my-courses"
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#e9a000] text-[#0a0a0d] text-xs font-semibold hover:bg-[#cc8e00] transition-all duration-150"
          >
            강의 나가기
          </Link>
        )}
      </header>

      {/* Progress bar */}
      {totalLectures > 0 && (
        <div className="h-1 bg-[#f0f0f8] shrink-0">
          <div
            className="h-full bg-[#e9a000] transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Area */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Player */}
          <div className="flex-1 bg-black overflow-hidden">
            {selectedLecture ? (
              <VideoPlayer
                lectureId={selectedLecture.id}
                videoUrl={selectedLecture.videoUrl || ''}
                title={selectedLecture.title}
                playTime={selectedLecture.playTime}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#9898a8]">
                <BookOpenIcon size={40} />
              </div>
            )}
          </div>

          {/* Bottom Controls */}
          <div className="bg-[#ffffff] border-t border-[#e2e2ea] px-4 py-3 shrink-0">
            {/* Progress summary */}
            {totalLectures > 0 && (
              <div className="flex items-center gap-3 mb-3 text-xs text-[#9898a8]">
                <div className="flex items-center gap-1.5">
                  <div className="w-16 h-1 bg-[#e2e2ea] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#e9a000] rounded-full transition-all duration-500"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <span>{completedCount}/{totalLectures} 완료 ({progressPct}%)</span>
                </div>
                {allCompleted && !completionMsg && (
                  <button
                    onClick={() => setShowCompletionBanner(true)}
                    className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#dcfce7] border border-[#bbf7d0] text-[#22c55e] text-xs font-medium hover:bg-[#bbf7d0] transition-all duration-150"
                  >
                    <AwardIcon size={13} />
                    완강하기
                  </button>
                )}
                {completionMsg === 'success' && (
                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-xs text-[#22c55e]">수강 완료!</span>
                    <Link
                      href={`/certificate/${courseId}`}
                      className="text-xs px-2.5 py-1 rounded-lg bg-[#e9a000] text-[#0a0a0d] font-semibold hover:bg-[#cc8e00] transition-all duration-150"
                    >
                      수료증 보기
                    </Link>
                    <Link
                      href="/my-courses"
                      className="text-xs px-2.5 py-1 rounded-lg border border-[#e2e2ea] text-[#6b6b7b] hover:bg-[#f0f0f8] transition-all duration-150"
                    >
                      내 강의실
                    </Link>
                  </div>
                )}
                {completionMsg === 'fail' && (
                  <span className="ml-auto text-xs text-[#f87171]">완강 처리 실패 — 다시 시도해 주세요</span>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 mb-3">
              <button
                onClick={() => navigate('prev')}
                disabled={!hasPrev}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium border border-[#e2e2ea] text-[#6b6b7b] bg-[#f0f0f8] hover:bg-[#e8e8f2] hover:text-[#18181b] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
              >
                <ArrowLeftIcon size={15} />
                이전
              </button>

              {/* Mark complete button */}
              {isLoggedIn && selectedLecture && (
                <button
                  onClick={handleMarkComplete}
                  disabled={markingComplete || isCurrentCompleted}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isCurrentCompleted
                      ? 'bg-[#dcfce7] border border-[#bbf7d0] text-[#4ade80] cursor-default'
                      : 'border border-[#e2e2ea] text-[#6b6b7b] bg-[#f0f0f8] hover:bg-[#e8e8f2] hover:text-[#18181b] disabled:opacity-50'
                  }`}
                >
                  {markingComplete ? (
                    <SpinnerIcon size={13} />
                  ) : (
                    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                  {isCurrentCompleted ? '완료됨' : '완강 표시'}
                </button>
              )}

              <button
                onClick={() => navigate('next')}
                disabled={!hasNext}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium bg-[#e9a000] text-[#0a0a0d] hover:bg-[#cc8e00] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 ml-auto"
              >
                다음
                <ArrowRightIcon size={15} />
              </button>
            </div>

            {selectedLecture && (
              <div className="bg-[#f0f0f8] rounded-xl p-3 border border-[#e2e2ea]">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-[#18181b] line-clamp-1 mb-1">
                    {selectedLecture.title}
                  </p>
                  {isCurrentCompleted && (
                    <span className="shrink-0 flex items-center gap-1 text-xs text-[#4ade80]">
                      <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      완료
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-[#9898a8]">
                  <span className="flex items-center gap-1">
                    <ClockIcon size={12} />
                    {formatDuration(selectedLecture.playTime)}
                  </span>
                  <span className="flex items-center gap-1">
                    <UsersIcon size={12} />
                    {course.instructorNickname}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-72 bg-[#ffffff] border-l border-[#e2e2ea] flex flex-col overflow-hidden shrink-0 animate-slide-left">
            <div className="h-12 border-b border-[#e2e2ea] flex items-center justify-between px-4 shrink-0">
              <div className="flex items-center gap-2 text-sm font-medium text-[#18181b]">
                <BookOpenIcon size={15} className="text-[#6b6b7b]" />
                강의 목록
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 rounded-lg text-[#9898a8] hover:text-[#6b6b7b] hover:bg-[#f0f0f8] transition-all duration-150"
              >
                <XIcon size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <ProgressSidebar
                sections={sections}
                selectedLectureId={selectedLecture?.id}
                onLectureSelect={handleLectureSelect}
                expandedSectionId={expandedSectionId}
                onSectionToggle={setExpandedSectionId}
                completedLectureIds={completedLectureIds}
              />
            </div>
          </aside>
        )}

        {/* Sidebar collapsed toggle */}
        {!sidebarOpen && (
          <div className="w-10 bg-[#ffffff] border-l border-[#e2e2ea] flex items-center justify-center shrink-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-[#9898a8] hover:text-[#6b6b7b] hover:bg-[#f0f0f8] transition-all duration-150"
              title="강의 목록 열기"
            >
              <ChevronLeftIcon size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
