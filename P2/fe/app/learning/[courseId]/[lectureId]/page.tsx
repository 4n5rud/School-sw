'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { useParams } from 'next/navigation';
import { courseService, lectureProgressService } from '@/lib/api';
import { Course } from '@/lib/api/types';
import {
  ChevronLeftIcon, ChevronRightIcon, ArrowLeftIcon,
  PlayIcon, PauseIcon, Maximize2Icon, SpinnerIcon,
} from '@/components/Icons';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function LecturePage() {
  const params = useParams();
  const courseId = parseInt(params.courseId as string);
  const lectureId = parseInt(params.lectureId as string);

  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration] = useState(300);
  const progressInterval = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    courseService.getCourseById(courseId)
      .then((data) => setCourse(data))
      .catch((err: any) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [courseId]);

  useEffect(() => {
    if (!course) return;
    const save = () =>
      lectureProgressService.saveLectureProgress(lectureId, Math.floor(currentTime)).catch(() => {});
    const id = setInterval(save, 10000);
    return () => clearInterval(id);
  }, [lectureId, currentTime, course]);

  useEffect(() => {
    if (!isPlaying) return;
    progressInterval.current = setInterval(() => {
      setCurrentTime((t) => {
        if (t + 1 >= duration) { setIsPlaying(false); return duration; }
        return t + 1;
      });
    }, 1000);
    return () => clearInterval(progressInterval.current);
  }, [isPlaying, duration]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0d] flex items-center justify-center">
        <SpinnerIcon size={36} className="text-[#e9a000]" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-[#0a0a0d] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-[#ef4444] text-sm mb-4">{error || '강의를 찾을 수 없습니다'}</p>
          <Link href="/my-courses" className="text-[#e9a000] hover:text-[#cc8e00] text-sm">
            내 강의로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0d] flex flex-col">
      <Header />

      <main className="flex-1 flex">
        {/* Player */}
        <div className="flex-1 flex flex-col">
          {/* Video */}
          <div className="relative bg-black" style={{ paddingBottom: '56.25%' }}>
            <div className="absolute inset-0 flex items-center justify-center bg-[#131318]">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-16 h-16 rounded-full bg-[#e9a000]/10 border border-[#e9a000]/30 flex items-center justify-center text-[#e9a000] hover:bg-[#e9a000]/20 transition-all duration-200"
              >
                {isPlaying ? <PauseIcon size={24} /> : <PlayIcon size={24} />}
              </button>
            </div>

            {/* Progress overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-8">
              <div className="w-full h-1 bg-white/20 rounded-full cursor-pointer mb-3 hover:h-1.5 transition-all duration-150">
                <div
                  className="h-full bg-[#e9a000] rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <button onClick={() => setIsPlaying(!isPlaying)} className="hover:text-[#e9a000] transition-colors">
                    {isPlaying ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
                  </button>
                  <span className="text-xs font-mono">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>
                <button className="text-white/70 hover:text-white transition-colors">
                  <Maximize2Icon size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="bg-[#131318] border-t border-[#2d2d38] p-5 space-y-4">
            <div>
              <h1 className="text-lg font-bold text-[#f2f2f5] mb-1">
                강의 {lectureId} — {course.title}
              </h1>
              <p className="text-sm text-[#52525e]">
                {course.instructorNickname} • {formatTime(duration)}
              </p>
            </div>

            <div className="flex gap-3">
              {lectureId > 1 && (
                <Link
                  href={`/learning/${courseId}/${lectureId - 1}`}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#2d2d38] text-sm font-medium text-[#8c8c9e] bg-[#1d1d25] hover:bg-[#252530] hover:text-[#f2f2f5] transition-all duration-150"
                >
                  <ArrowLeftIcon size={15} />
                  이전 강의
                </Link>
              )}
              <Link
                href={`/learning/${courseId}/${lectureId + 1}`}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#e9a000] text-[#0a0a0d] hover:bg-[#cc8e00] transition-all duration-150"
              >
                다음 강의
                <ChevronRightIcon size={15} />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
