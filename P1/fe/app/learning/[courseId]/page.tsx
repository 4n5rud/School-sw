'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import VideoPlayer from '@/components/VideoPlayer';
import SectionSidebar from '@/components/SectionSidebar';
import { sectionService, courseService } from '@/lib/api';
import { Course, Section, Lecture } from '@/lib/api/types';

/**
 * 강의 학습 페이지
 * - 섹션별 강의 선택
 * - 동영상 플레이어
 * - 진행 상황 관리
 */
export default function LearningPage() {
  const params = useParams();
  const courseId = parseInt(params.courseId as string);

  const [course, setCourse] = useState<Course | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSectionId, setExpandedSectionId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true); // 사이드바 토글

  // 강의 정보 및 섹션 로드
  useEffect(() => {
    const loadCourseAndSections = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 1️⃣ 강의 정보 로드
        const courseData = await courseService.getCourseById(courseId);
        setCourse(courseData);
        console.log('[LearningPage] 강의 정보 로드:', courseData);

        // 2️⃣ 섹션 목록 로드
        const sectionsData = await sectionService.getSectionsByCourse(courseId);
        setSections(sectionsData);
        console.log('[LearningPage] 섹션 목록 로드:', {
          count: sectionsData.length,
          sections: sectionsData,
        });

        // 3️⃣ 첫 섹션의 첫 강의 자동 선택
        if (sectionsData.length > 0 && sectionsData[0].lectures?.length > 0) {
          const firstLecture = sectionsData[0].lectures[0];
          setSelectedLecture(firstLecture);
          setExpandedSectionId(sectionsData[0].id);
          console.log('[LearningPage] 첫 강의 자동 선택:', firstLecture);
        }
      } catch (err: any) {
        console.error('[LearningPage] 로드 실패:', err);
        setError(err.message || '강의 정보를 불러오는데 실패했습니다');
      } finally {
        setIsLoading(false);
      }
    };

    loadCourseAndSections();
  }, [courseId]);

  // 강의 선택 핸들러
  const handleLectureSelect = (lectureId: number) => {
    console.log('[LearningPage] 강의 선택:', lectureId);

    // 선택된 강의를 찾기
    for (const section of sections) {
      const lecture = section.lectures?.find((l) => l.id === lectureId);
      if (lecture) {
        setSelectedLecture(lecture);
        setExpandedSectionId(section.id);
        break;
      }
    }
  };

  // 다음 강의로 이동
  const handleNextLecture = () => {
    if (!selectedLecture) return;

    for (let i = 0; i < sections.length; i++) {
      const lectures = sections[i].lectures || [];
      const lecIndex = lectures.findIndex((l) => l.id === selectedLecture.id);

      // 현재 강의가 섹션 마지막이 아니면 다음 강의
      if (lecIndex !== -1 && lecIndex < lectures.length - 1) {
        setSelectedLecture(lectures[lecIndex + 1]);
        setExpandedSectionId(sections[i].id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // 현재 강의가 섹션 마지막이고 다음 섹션이 있으면 다음 섹션의 첫 강의
      if (lecIndex === lectures.length - 1 && i < sections.length - 1) {
        const nextSection = sections[i + 1];
        if (nextSection.lectures && nextSection.lectures.length > 0) {
          setSelectedLecture(nextSection.lectures[0]);
          setExpandedSectionId(nextSection.id);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
      }
    }

    alert('마지막 강의입니다');
  };

  // 이전 강의로 이동
  const handlePrevLecture = () => {
    if (!selectedLecture) return;

    for (let i = sections.length - 1; i >= 0; i--) {
      const lectures = sections[i].lectures || [];
      const lecIndex = lectures.findIndex((l) => l.id === selectedLecture.id);

      // 현재 강의가 섹션 첫 강의가 아니면 이전 강의
      if (lecIndex > 0) {
        setSelectedLecture(lectures[lecIndex - 1]);
        setExpandedSectionId(sections[i].id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // 현재 강의가 섹션 첫 강의이고 이전 섹션이 있으면 이전 섹션의 마지막 강의
      if (lecIndex === 0 && i > 0) {
        const prevSection = sections[i - 1];
        if (prevSection.lectures && prevSection.lectures.length > 0) {
          const lastLecture = prevSection.lectures[prevSection.lectures.length - 1];
          setSelectedLecture(lastLecture);
          setExpandedSectionId(prevSection.id);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
      }
    }

    alert('첫 강의입니다');
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

  if (error) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-[#000000]">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="text-center">
              <p className="text-red-400 text-lg mb-4">{error}</p>
              <Link
                href="/my-courses"
                className="inline-block text-[#FFD700] hover:text-yellow-400"
              >
                내 강의 목록으로
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!course || !selectedLecture) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-[#000000]">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <p className="text-gray-400">강의를 찾을 수 없습니다</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <div className="w-screen h-screen bg-black text-white flex flex-col overflow-hidden">
      {/* 헤더 */}
      <header className="h-14 border-b border-gray-700 flex items-center px-4 gap-4 bg-[#0a0a0a] flex-shrink-0">
        <Link href="/my-courses" className="text-yellow-500 hover:text-yellow-400 text-sm font-medium">
          ← 내 강의실
        </Link>
        <h1 className="text-lg font-bold">{course?.title}</h1>
      </header>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 왼쪽: 비디오 플레이어 영역 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 비디오 플레이어 */}
          <div className="flex-1 overflow-hidden bg-black">
            <VideoPlayer
              lectureId={selectedLecture?.id || 0}
              videoUrl={selectedLecture?.videoUrl || ''}
              title={selectedLecture?.title || ''}
              playTime={selectedLecture?.playTime || 0}
            />
          </div>

          {/* 하단: 네비게이션 및 정보 */}
          <div className="h-auto bg-[#0a0a0a] border-t border-gray-700 p-4 flex-shrink-0">
            {/* 네비게이션 버튼 */}
            <div className="flex gap-3 mb-3">
              <button
                onClick={handlePrevLecture}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 text-sm rounded font-medium transition"
              >
                ← 이전
              </button>
              <button
                onClick={handleNextLecture}
                className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black py-2 text-sm rounded font-semibold transition"
              >
                다음 →
              </button>
            </div>

            {/* 강의 정보 */}
            <div className="bg-[#1a1a1a] rounded p-3 border border-gray-700 text-sm">
              <h3 className="font-bold text-white mb-1">{selectedLecture?.title}</h3>
              <p className="text-gray-400 text-xs mb-2">강사: {course?.instructor.nickname}</p>
              <div className="flex gap-6 text-xs text-gray-400">
                <div>강의 길이: <span className="text-yellow-500">{Math.floor((selectedLecture?.playTime || 0) / 60)}분</span></div>
                <div>수강생: <span className="text-yellow-500">{course?.studentCount.toLocaleString()}</span>명</div>
              </div>
            </div>
          </div>
        </div>

        {/* 오른쪽: 섹션 사이드바 */}
        {sidebarOpen && (
          <aside className="w-80 bg-[#0a0a0a] border-l border-gray-700 flex flex-col overflow-hidden">
            <div className="h-12 border-b border-gray-700 flex items-center justify-between px-4 flex-shrink-0">
              <h2 className="text-sm font-semibold">📚 강의 목록</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 hover:bg-gray-700 rounded transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <SectionSidebar
                sections={sections}
                selectedLectureId={selectedLecture?.id}
                onLectureSelect={handleLectureSelect}
                expandedSectionId={expandedSectionId}
                onSectionToggle={setExpandedSectionId}
              />
            </div>
          </aside>
        )}

        {/* 사이드바 닫혔을 때 토글 버튼 */}
        {!sidebarOpen && (
          <div className="w-12 bg-[#0a0a0a] border-l border-gray-700 flex items-center justify-center flex-shrink-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-gray-700 rounded transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l7-7-7-7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
