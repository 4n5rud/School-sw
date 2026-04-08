'use client';

import React from 'react';
import { Section, Lecture } from '@/lib/api/types';

interface SectionSidebarProps {
  sections: Section[];
  selectedLectureId?: number;
  onLectureSelect: (lectureId: number) => void;
  expandedSectionId?: number | null;
  onSectionToggle?: (sectionId: number) => void;
}

/**
 * 섹션 사이드바 컴포넌트
 * - 섹션 목록 표시
 * - 각 섹션의 강의 목록 표시
 * - 강의 선택 기능
 */
export default function SectionSidebar({
  sections,
  selectedLectureId,
  onLectureSelect,
  expandedSectionId,
  onSectionToggle,
}: SectionSidebarProps) {
  const [expanded, setExpanded] = React.useState<Set<number>>(
    expandedSectionId ? new Set([expandedSectionId]) : new Set()
  );

  const toggleSection = (sectionId: number) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpanded(newExpanded);
    onSectionToggle?.(sectionId);
  };

  return (
    <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 h-full overflow-y-auto">
      <div className="p-4 space-y-2">
        {sections.map((section) => (
          <div key={section.id} className="space-y-1">
            {/* 섹션 헤더 (클릭 가능) */}
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-800 transition text-left"
            >
              <span className="text-gray-400">
                {expanded.has(section.id) ? '▼' : '▶'}
              </span>
              <span className="text-sm font-semibold text-[#ffffff] flex-1">
                {section.title}
              </span>
              <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                {section.lectures?.length || 0}
              </span>
            </button>

            {/* 강의 목록 (확장 시 표시) */}
            {expanded.has(section.id) && section.lectures && (
              <div className="ml-2 space-y-1">
                {section.lectures.map((lecture) => (
                  <button
                    key={lecture.id}
                    onClick={() => onLectureSelect(lecture.id)}
                    className={`w-full text-left p-2 rounded-lg text-sm transition ${
                      selectedLectureId === lecture.id
                        ? 'bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]'
                        : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs">🎬</span>
                      <span className="flex-1 truncate">{lecture.title}</span>
                    </div>
                    <span className="text-xs text-gray-500 ml-5">
                      {formatTime(lecture.playTime)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// 시간 포맷팅 함수
function formatTime(seconds: number) {
  if (!seconds || !Number.isFinite(seconds)) return '0:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}
