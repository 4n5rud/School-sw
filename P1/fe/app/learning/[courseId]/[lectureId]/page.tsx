'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useParams } from 'next/navigation';
import { courseService, lectureProgressService } from '@/lib/api';
import { Course } from '@/lib/api/types';

export default function LearningPage() {
  const params = useParams();
  const courseId = parseInt(params.courseId as string);
  const lectureId = parseInt(params.lectureId as string);

  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(300); // 기본 5분
  const [showMenu, setShowMenu] = useState(true);
  const progressInterval = useRef<NodeJS.Timeout | undefined>(undefined);

  // 강의 정보 로드
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

  // 강의 진행 상황 저장 (매 10초마다)
  useEffect(() => {
    if (!course) return;

    const saveProgress = async () => {
      try {
        await lectureProgressService.saveLectureProgress(lectureId, Math.floor(currentTime));
      } catch (err) {
        console.error('진행 상황 저장 실패:', err);
      }
    };

    const saveInterval = setInterval(saveProgress, 10000); // 10초마다 저장
    return () => clearInterval(saveInterval);
  }, [lectureId, currentTime, course]);

  // 비디오 재생 시뮬레이션
  useEffect(() => {
    if (!isPlaying) return;

    progressInterval.current = setInterval(() => {
      setCurrentTime((prev) => {
        const newTime = prev + 1;
        if (newTime >= duration) {
          setIsPlaying(false);
          return duration;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(progressInterval.current);
  }, [isPlaying, duration]);

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
            <Link href="/my-courses" className="inline-block text-[#FFD700] hover:text-yellow-400">
              내 강의로 돌아가기
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#000000]">
        <div className="flex h-screen">
          {/* Video Player Section */}
          <div className="flex-1 flex flex-col bg-[#000000]">
            {/* Video Container */}
            <div className="flex-1 bg-[#1a1a1a] flex items-center justify-center relative overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-[#2a2a2a] to-[#000000] flex items-center justify-center">
                {/* Video Player UI */}
                <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center">
                  <div className="text-center text-[#fffffc] space-y-6">
                    <div className="text-6xl">▶</div>
                    <div>
                      <h2 className="text-2xl font-bold mb-2">
                        {course.title}
                      </h2>
                      <p className="text-[#beb7a4]">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Video Controls */}
                <div className="absolute bottom-6 left-6 right-6 space-y-4">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="bg-[#2a2a2a] rounded-full h-1 cursor-pointer hover:h-2 transition group">
                      <div
                        className="bg-[#FFD700] h-full rounded-full transition-all group-hover:bg-yellow-300"
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-between text-[#fffffc]">
                    <div className="flex items-center gap-4">
                      {/* Play/Pause */}
                      <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="hover:scale-110 transition text-xl"
                      >
                        {isPlaying ? '⏸' : '▶'}
                      </button>

                      {/* Time Display */}
                      <span className="text-sm font-medium">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    </div>

                    {/* Right Controls */}
                    <div className="flex items-center gap-4">
                      {/* Quality */}
                      <button className="text-sm hover:text-[#FFD700] transition">
                        1080p
                      </button>

                      {/* Fullscreen */}
                      <button className="hover:scale-110 transition text-lg">
                        ⛶
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Video Info */}
            <div className="bg-[#1a1a1a] border-b border-[#2a2a2a] p-6 space-y-4">
              <div>
                <h1 className="text-2xl font-bold text-[#fffffc] mb-2">
                  강의 제목 - Lecture {lectureId}
                </h1>
                <p className="text-[#beb7a4]">
                  {course.title} • {formatTime(duration)}
                </p>
              </div>

              {/* Navigation Buttons */}
              <div className="flex gap-3">
                {lectureId > 1 && (
                  <Link
                    href={`/learning/${courseId}/${lectureId - 1}`}
                    className="px-4 py-2 bg-[#2a2a2a] text-[#fffffc] rounded-lg hover:bg-[#3a3a3a] transition text-sm font-medium"
                  >
                    ◀ 이전 강의
                  </Link>
                )}
                <Link
                  href={`/learning/${courseId}/${lectureId + 1}`}
                  className="px-4 py-2 bg-[#FFD700] text-[#000000] rounded-lg hover:bg-yellow-400 transition text-sm font-medium"
                >
                  다음 강의 ▶
                </Link>
              </div>
            </div>
          </div>

          {/* Sidebar - Curriculum */}
          <div
            className={`${
              showMenu ? 'w-80' : 'w-0'
            } bg-[#1a1a1a] border-l border-[#2a2a2a] overflow-hidden transition-all duration-300 flex flex-col`}
          >
            {/* Header */}
            <div className="p-4 border-b border-[#2a2a2a] flex items-center justify-between">
              <h3 className="text-[#fffffc] font-bold">커리큘럼</h3>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="text-[#beb7a4] hover:text-[#fffffc]"
              >
                ✕
              </button>
            </div>

            {/* Course Title */}
            <Link
              href={`/courses/${courseId}`}
              className="p-4 border-b border-[#2a2a2a] hover:bg-[#2a2a2a] transition"
            >
              <p className="text-sm text-[#beb7a4] hover:text-[#fffffc] font-medium">
                {course.title}
              </p>
            </Link>

            {/* Lectures List */}
            <div className="flex-1 overflow-y-auto">
              {[1, 2, 3, 4, 5].map((idx) => (
                <Link
                  key={idx}
                  href={`/learning/${courseId}/${idx}`}
                  className={`block px-4 py-3 border-b border-[#2a2a2a] hover:bg-[#2a2a2a] transition ${
                    idx === lectureId ? 'bg-gray-800 border-l-2 border-l-[#FFD700]' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <span className="text-[#beb7a4] text-sm min-w-6">
                      {idx === lectureId ? '▶' : idx}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm line-clamp-2 ${
                          idx === lectureId
                            ? 'text-[#fffffc] font-semibold'
                            : 'text-[#beb7a4]'
                        }`}
                      >
                        Section {Math.ceil(idx / 2)} - Lecture {idx}
                      </p>
                      <p className="text-xs text-[#beb7a4]/70 mt-1">
                        {formatTime(duration)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-[#2a2a2a] p-4 space-y-3">
              <Link
                href="/my-courses"
                className="block w-full text-center py-2 bg-[#2a2a2a] text-[#fffffc] rounded-lg hover:bg-[#3a3a3a] transition text-sm font-medium"
              >
                내 강의실로 돌아가기
              </Link>
            </div>
          </div>

          {/* Toggle Menu Button */}
          {!showMenu && (
            <button
              onClick={() => setShowMenu(true)}
              className="absolute right-6 top-6 bg-[#2a2a2a] text-[#fffffc] px-3 py-2 rounded-lg hover:bg-[#3a3a3a] transition text-sm z-10"
            >
              메뉴 열기
            </button>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
