'use client';

import React, { useRef, useEffect, useState } from 'react';
import { lectureProgressService } from '@/lib/api';
import { PlayIcon, PauseIcon, Volume2Icon, Maximize2Icon } from '@/components/Icons';

interface VideoPlayerProps {
  lectureId: number;
  videoUrl: string;
  title: string;
  playTime?: number;
  onTimeUpdate?: (time: number) => void;
}

function extractYouTubeId(url: string): string | null {
  try {
    const short = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (short) return short[1];
    const v = new URL(url).searchParams.get('v');
    if (v && v.length === 11) return v;
    const embed = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
    if (embed) return embed[1];
  } catch {}
  return null;
}

function formatTime(seconds: number): string {
  if (!seconds || !Number.isFinite(seconds)) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function VideoPlayer({
  lectureId,
  videoUrl,
  title,
  playTime,
  onTimeUpdate,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const youtubeId = extractYouTubeId(videoUrl);
  const watchPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  useEffect(() => {
    const load = async () => {
      try {
        const progress = await lectureProgressService.getLectureProgress(lectureId);
        if (videoRef.current && progress.lastPosition) {
          videoRef.current.currentTime = progress.lastPosition;
        }
      } catch {}
    };
    load();
  }, [lectureId]);

  useEffect(() => {
    return () => {
      if (videoRef.current && currentTime > 0) {
        lectureProgressService
          .saveLectureProgress(lectureId, Math.floor(videoRef.current.currentTime))
          .catch(() => {});
      }
    };
  }, [lectureId]);

  const saveProgress = async (time: number) => {
    if (Math.abs(time - lastSaveTime) < 5) return;
    try {
      setIsSaving(true);
      await lectureProgressService.saveLectureProgress(lectureId, Math.floor(time));
      setLastSaveTime(time);
    } catch {}
    finally { setIsSaving(false); }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const t = videoRef.current.currentTime;
    setCurrentTime(t);
    onTimeUpdate?.(t);
    saveProgress(t);
  };

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) videoRef.current.pause();
    else videoRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !progressBarRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const newTime = ratio * duration;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen?.();
      }
    }
  };

  if (youtubeId) {
    return (
      <div className="w-full h-full flex flex-col bg-black">
        <div className="flex-1 relative">
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            className="absolute inset-0 w-full h-full border-0"
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full h-full flex flex-col bg-black relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Video */}
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          className="max-w-full max-h-full"
          onLoadedMetadata={() => {
            if (videoRef.current) setDuration(videoRef.current.duration);
          }}
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onClick={handlePlayPause}
        >
          <source src={videoUrl} type="video/mp4" />
        </video>
      </div>

      {/* Controls overlay */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent px-4 pb-3 pt-10 transition-opacity duration-300 ${
          isHovered || !isPlaying ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Progress Bar */}
        <div
          ref={progressBarRef}
          onClick={handleProgressClick}
          className="w-full h-1 bg-white/20 rounded-full cursor-pointer mb-3 relative group/bar hover:h-1.5 transition-all duration-150"
        >
          <div
            className="h-full bg-[#e9a000] rounded-full pointer-events-none"
            style={{ width: `${watchPercent}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-[#e9a000] rounded-full -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-opacity duration-150 pointer-events-none"
            style={{ left: `${watchPercent}%` }}
          />
        </div>

        {/* Control Row */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePlayPause}
            className="text-white hover:text-[#e9a000] transition-colors duration-150 p-1"
          >
            {isPlaying ? <PauseIcon size={18} /> : <PlayIcon size={18} />}
          </button>

          <span className="text-xs text-white/70 font-mono tabular-nums">
            {formatTime(currentTime)} / {formatTime(duration || playTime || 0)}
          </span>

          {isSaving && (
            <span className="text-xs text-[#4ade80] ml-1">저장 중</span>
          )}

          <div className="flex-1" />

          <button
            onClick={handleFullscreen}
            className="text-white/70 hover:text-white transition-colors duration-150 p-1"
          >
            <Maximize2Icon size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
