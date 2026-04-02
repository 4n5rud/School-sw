'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { mockCourseDetail, mockCourses } from '@/lib/mockData';
import { useParams } from 'next/navigation';

export default function LearningPage() {
  const params = useParams();
  const courseId = parseInt(params.courseId as string);
  const lectureId = parseInt(params.lectureId as string);

  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showMenu, setShowMenu] = useState(true);
  const progressInterval = useRef<NodeJS.Timeout | undefined>(undefined);

  const course = mockCourseDetail[courseId];
  const courseInfo = mockCourses.find((c) => c.id === courseId);

  // Find current lecture
  let currentLecture = null;
  let currentSection = null;
  let currentLectureIndex = 0;

  if (course) {
    for (let section of course.sections) {
      for (let lecture of section.lectures) {
        if (lecture.id === lectureId) {
          currentLecture = lecture;
          currentSection = section;
          break;
        }
      }
      if (currentLecture) break;
    }
  }

  // Get all lectures in order
  const allLectures = course
    ? course.sections.flatMap((s) => s.lectures)
    : [];
  currentLectureIndex = allLectures.findIndex((l) => l.id === lectureId);

  const nextLecture =
    currentLectureIndex < allLectures.length - 1
      ? allLectures[currentLectureIndex + 1]
      : null;
  const previousLecture =
    currentLectureIndex > 0 ? allLectures[currentLectureIndex - 1] : null;

  // Simulate video playback
  useEffect(() => {
    if (!isPlaying || !currentLecture) return;

    progressInterval.current = setInterval(() => {
      setCurrentTime((prev) => {
        const newTime = prev + 1;
        if (newTime >= (currentLecture?.playTime || 0)) {
          setIsPlaying(false);
          return currentLecture?.playTime || 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(progressInterval.current);
  }, [isPlaying, currentLecture]);

  if (!course || !currentLecture || !currentSection || !courseInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#000000]">
        <p className="text-gray-400 text-lg">강의를 찾을 수 없습니다</p>
      </div>
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
                    <div className="text-6xl">play</div>
                    <div>
                      <h2 className="text-2xl font-bold mb-2">
                        {currentLecture.title}
                      </h2>
                      <p className="text-[#beb7a4]">
                        {formatTime(currentTime)} / {formatTime(currentLecture.playTime)}
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
                        className="bg-[#ffffff] h-full rounded-full transition-all group-hover:bg-gray-300"
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
                        className="hover:scale-110 transition"
                      >
                        {isPlaying ? 'pause' : 'play'}
                      </button>

                      {/* Time Display */}
                      <span className="text-sm font-medium">
                        {formatTime(currentTime)} / {formatTime(currentLecture.playTime)}
                      </span>
                    </div>

                    {/* Right Controls */}
                    <div className="flex items-center gap-4">
                      {/* Quality */}
                      <button className="text-sm hover:text-[#beb7a4] transition">
                        1080p
                      </button>

                      {/* Fullscreen */}
                      <button className="hover:scale-110 transition text-lg">
                        fullscreen
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
                  {currentLecture.title}
                </h1>
                <p className="text-[#beb7a4]">
                  {currentSection.title} • {formatTime(currentLecture.playTime)}
                </p>
              </div>

              {/* Navigation Buttons */}
              <div className="flex gap-3">
                {previousLecture && (
                  <Link
                    href={`/learning/${courseId}/${previousLecture.id}`}
                    className="px-4 py-2 bg-[#2a2a2a] text-[#fffffc] rounded-lg hover:bg-[#3a3a3a] transition text-sm font-medium"
                  >
                    angle-left 이전 강의
                  </Link>
                )}
                {nextLecture && (
                  <Link
                    href={`/learning/${courseId}/${nextLecture.id}`}
                    className="px-4 py-2 bg-[#ffffff] text-[#000000] rounded-lg hover:bg-gray-200 transition text-sm font-medium"
                  >
                    다음 강의 angle-right
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Curriculum */}
          <div
            className={`${showMenu ? 'w-80' : 'w-0'} bg-[#1a1a1a] border-l border-[#2a2a2a] overflow-hidden transition-all duration-300 flex flex-col`}
          >
            {/* Header */}
            <div className="p-4 border-b border-[#2a2a2a] flex items-center justify-between">
              <h3 className="text-[#fffffc] font-bold">커리큘럼</h3>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="text-[#beb7a4] hover:text-[#fffffc]"
              >
                close
              </button>
            </div>

            {/* Course Title */}
            <Link
              href={`/courses/${courseId}`}
              className="p-4 border-b border-[#2a2a2a] hover:bg-[#2a2a2a] transition"
            >
              <p className="text-sm text-[#beb7a4] hover:text-[#fffffc] font-medium">
                {courseInfo.title}
              </p>
            </Link>

            {/* Sections & Lectures */}
            <div className="flex-1 overflow-y-auto">
              {course.sections.map((section) => (
                <div key={section.id}>
                  {/* Section */}
                  <div className="px-4 py-3 bg-[#2a2a2a]/50 border-b border-[#2a2a2a]">
                    <p className="text-xs font-semibold text-[#beb7a4] uppercase tracking-wider">
                      {section.title}
                    </p>
                  </div>

                  {/* Lectures */}
                  {section.lectures.map((lecture, idx) => (
                    <Link
                      key={lecture.id}
                      href={`/learning/${courseId}/${lecture.id}`}
                      className={`block px-4 py-3 border-b border-[#2a2a2a] hover:bg-[#2a2a2a] transition ${
                        lecture.id === lectureId ? 'bg-gray-800 border-l-2 border-l-[#ffffff]' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        <span className="text-[#beb7a4] text-sm min-w-6">
                          {lecture.id === lectureId ? 'play' : idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm line-clamp-2 ${
                              lecture.id === lectureId
                                ? 'text-[#fffffc] font-semibold'
                                : 'text-[#beb7a4]'
                            }`}
                          >
                            {lecture.title}
                          </p>
                          <p className="text-xs text-[#beb7a4]/70 mt-1">
                            {formatTime(lecture.playTime)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
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
