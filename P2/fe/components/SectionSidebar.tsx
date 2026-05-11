'use client';

import React from 'react';
import { Section } from '@/lib/api/types';
import { ChevronDownIcon, ChevronRightIcon, VideoIcon, ClockIcon } from '@/components/Icons';

interface SectionSidebarProps {
  sections: Section[];
  selectedLectureId?: number;
  onLectureSelect: (lectureId: number) => void;
  expandedSectionId?: number | null;
  onSectionToggle?: (sectionId: number) => void;
}

function formatTime(seconds?: number): string {
  if (!seconds || !Number.isFinite(seconds) || seconds === 0) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function SectionSidebar({
  sections,
  selectedLectureId,
  onLectureSelect,
  expandedSectionId,
  onSectionToggle,
}: SectionSidebarProps) {
  const [expanded, setExpanded] = React.useState<Set<number>>(
    expandedSectionId != null ? new Set([expandedSectionId]) : new Set()
  );

  React.useEffect(() => {
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
      <div className="flex items-center justify-center h-32 text-sm text-[#52525e]">
        강의 목록이 없습니다
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {sections.map((section, si) => {
        const isOpen = expanded.has(section.id);
        const lectureCount = section.lectures?.length ?? 0;

        return (
          <div key={section.id}>
            {/* Section Header */}
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-[#1d1d25] transition-all duration-150 text-left group"
            >
              <span className="text-[#52525e] transition-transform duration-200" style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
                <ChevronDownIcon size={15} />
              </span>
              <span className="flex-1 text-sm font-medium text-[#8c8c9e] group-hover:text-[#f2f2f5] transition-colors duration-150 line-clamp-1">
                {section.title}
              </span>
              <span className="text-xs text-[#52525e] bg-[#1d1d25] px-1.5 py-0.5 rounded shrink-0">
                {lectureCount}
              </span>
            </button>

            {/* Lectures */}
            {isOpen && section.lectures && (
              <div className="ml-2 mt-0.5 space-y-0.5 animate-slide-down">
                {section.lectures.map((lecture) => {
                  const isSelected = selectedLectureId === lecture.id;
                  const duration = formatTime(lecture.playTime);

                  return (
                    <button
                      key={lecture.id}
                      onClick={() => onLectureSelect(lecture.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-150 flex items-start gap-2.5 ${
                        isSelected
                          ? 'bg-[#2a1f0a] border border-[#3a2f1a] text-[#e9a000]'
                          : 'text-[#52525e] hover:text-[#8c8c9e] hover:bg-[#1d1d25]'
                      }`}
                    >
                      <VideoIcon size={14} className="mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="line-clamp-2 leading-snug">{lecture.title}</p>
                        {duration && (
                          <div className="flex items-center gap-1 mt-1">
                            <ClockIcon size={11} className="text-[#3d3d4a]" />
                            <span className="text-xs text-[#3d3d4a]">{duration}</span>
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
