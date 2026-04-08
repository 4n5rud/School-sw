'use client';

import React, { useRef, useEffect, useState } from 'react';
import { lectureProgressService } from '@/lib/api';

interface VideoPlayerProps {
  lectureId: number;
  videoUrl: string;
  title: string;
  playTime: number;
  onTimeUpdate?: (time: number) => void;
}

/**
 * 비디오 플레이어 컴포넌트
 * - HTML5 video 태그 사용
 * - 진행 상황 자동 저장 (5초마다)
 * - 마지막 시청 위치 복원
 */
export default function VideoPlayer({
  lectureId,
  videoUrl,
  title,
  playTime,
  onTimeUpdate,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState(0);
  const [watchPercentage, setWatchPercentage] = useState(0);

  // 마지막 시청 위치에서 복원
  useEffect(() => {
    const loadProgress = async () => {
      try {
        console.log('[VideoPlayer] 진행 상황 로드:', { lectureId });
        const progress = await lectureProgressService.getLectureProgress(lectureId);
        
        if (videoRef.current && progress.lastPosition) {
          videoRef.current.currentTime = progress.lastPosition;
          console.log('[VideoPlayer] 위치 복원:', {
            lectureId,
            lastPosition: progress.lastPosition,
          });
        }
      } catch (error) {
        console.warn('[VideoPlayer] 진행 상황 로드 실패:', error);
        // 에러 무시 - 첫 강의 시청 시 진행 정보가 없을 수 있음
      }
    };

    loadProgress();
  }, [lectureId]);

  // 진행 상황 자동 저장 (5초마다)
  const saveProgress = async (time: number) => {
    // 5초 이상 변화가 있을 때만 저장
    if (Math.abs(time - lastSaveTime) < 5) {
      return;
    }

    try {
      setIsSaving(true);
      console.log('[VideoPlayer] 진행 상황 저장:', { lectureId, currentTime: time });
      
      await lectureProgressService.saveLectureProgress(lectureId, Math.floor(time));
      setLastSaveTime(time);
      
      console.log('[VideoPlayer] 진행 상황 저장 완료');
    } catch (error) {
      console.error('[VideoPlayer] 진행 상황 저장 실패:', error);
      // 에러 무시 - 재시도는 다음 주기에
    } finally {
      setIsSaving(false);
    }
  };

  // 비디오 메타데이터 로드 시
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      console.log('[VideoPlayer] 메타데이터 로드:', {
        duration: videoRef.current.duration,
      });
    }
  };

  // 비디오 재생 시간 업데이트
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      setCurrentTime(time);
      
      // 시청 비율 계산
      const percentage = duration > 0 ? (time / duration) * 100 : 0;
      setWatchPercentage(percentage);

      // 콜백
      onTimeUpdate?.(time);

      // 주기적으로 저장
      saveProgress(time);
    }
  };

  // 재생/일시정지
  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // 페이지 이동 시 최종 위치 저장
  useEffect(() => {
    return () => {
      if (videoRef.current && currentTime > 0) {
        lectureProgressService.saveLectureProgress(
          lectureId,
          Math.floor(videoRef.current.currentTime)
        ).catch(error => {
          console.warn('[VideoPlayer] 언마운트 시 저장 실패:', error);
        });
      }
    };
  }, [lectureId]);

  // 시간 포맷팅
  const formatTime = (seconds: number) => {
    if (!seconds || !Number.isFinite(seconds)) return '0:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="w-full space-y-4">
      {/* 비디오 플레이어 */}
      <div className="bg-black rounded-lg overflow-hidden shadow-lg">
        <video
          ref={videoRef}
          className="w-full"
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        >
          <source src={videoUrl} type="video/mp4" />
          브라우저가 비디오를 지원하지 않습니다.
        </video>
      </div>

      {/* 커스텀 컨트롤 바 */}
      <div className="bg-[#1a1a1a] rounded-lg p-4 space-y-3 border border-gray-800">
        {/* 진행률 바 */}
        <div className="space-y-1">
          <div className="w-full bg-gray-700 rounded-full h-1 overflow-hidden">
            <div
              className="h-full bg-[#FFD700] transition-all duration-100"
              style={{ width: `${watchPercentage}%` }}
            />
          </div>
          <div className="text-xs text-gray-400">
            {watchPercentage.toFixed(1)}% 시청 완료
          </div>
        </div>

        {/* 재생 시간 */}
        <div className="flex items-center justify-between text-sm text-gray-300">
          <span>{formatTime(currentTime)}</span>
          <span className="text-gray-500">{formatTime(duration)}</span>
        </div>

        {/* 컨트롤 버튼 */}
        <div className="flex items-center gap-4">
          <button
            onClick={handlePlayPause}
            className="flex-1 bg-[#FFD700] text-black font-semibold py-2 rounded-lg hover:bg-yellow-400 transition"
          >
            {isPlaying ? '⏸ 일시정지' : '▶️ 재생'}
          </button>

          {isSaving && (
            <div className="text-xs text-green-400 bg-green-900/20 px-2 py-1 rounded">
              저장 중...
            </div>
          )}
        </div>

        {/* 강의 정보 */}
        <div className="pt-2 border-t border-gray-700 space-y-1">
          <p className="text-sm font-medium text-[#ffffff]">{title}</p>
          <p className="text-xs text-gray-400">
            전체 길이: {formatTime(playTime)} 분
          </p>
        </div>
      </div>
    </div>
  );
}
