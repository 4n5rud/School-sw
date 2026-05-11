'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Course, CategoryType, CATEGORY_LABELS } from '@/lib/api/types';
import { UsersIcon, TagIcon } from '@/components/Icons';

interface CourseCardProps {
  course: Course;
  index?: number;
}

const CATEGORY_COLORS: Record<CategoryType, { bg: string; text: string; border: string }> = {
  DOMESTIC_STOCK: { bg: '#dbeafe', text: '#60a5fa', border: '#bfdbfe' },
  OVERSEAS_STOCK: { bg: '#ccfbf1', text: '#2dd4bf', border: '#99f6e4' },
  CRYPTO:         { bg: '#fef3c7', text: '#fbbf24', border: '#fde68a' },
  NFT:            { bg: '#f3e8ff', text: '#c084fc', border: '#e9d5ff' },
  ETF:            { bg: '#dcfce7', text: '#4ade80', border: '#bbf7d0' },
  FUTURES:        { bg: '#fee2e2', text: '#f87171', border: '#fecaca' },
};

const CATEGORY_PLACEHOLDER_BG: Record<CategoryType, string> = {
  DOMESTIC_STOCK: '#dbeafe',
  OVERSEAS_STOCK: '#ccfbf1',
  CRYPTO:         '#fef3c7',
  NFT:            '#f3e8ff',
  ETF:            '#dcfce7',
  FUTURES:        '#fee2e2',
};

export default function CourseCard({ course, index = 0 }: CourseCardProps) {
  const router = useRouter();
  const colors = CATEGORY_COLORS[course.category];
  const placeholderBg = CATEGORY_PLACEHOLDER_BG[course.category];
  const delay = Math.min(index * 0.05, 0.3);
  const instructorName = course.instructor?.nickname ?? course.instructorNickname ?? '—';
  const instructorId = course.instructor?.id ?? course.instructorId;
  const enrollCount = course.studentCount ?? course.enrollmentCount;

  return (
    <div
      className="block group cursor-pointer"
      onClick={() => router.push(`/courses/${course.id}`)}
    >
      <div
        className="bg-white rounded-xl border border-[#e2e2ea] overflow-hidden transition-all duration-250 hover:border-[#d0d0dc] hover:shadow-md hover:shadow-gray-200 hover:-translate-y-0.5 animate-fade-in-up h-full flex flex-col"
        style={{ animationDelay: `${delay}s` }}
      >
        {/* Thumbnail */}
        <div className="relative w-full aspect-video overflow-hidden bg-[#f0f0f8] shrink-0">
          {course.thumbnailUrl ? (
            <img
              src={course.thumbnailUrl}
              alt={course.title}
              className="w-full h-full object-cover transition-transform duration-350 group-hover:scale-105"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: placeholderBg }}
            >
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-md border"
                style={{ color: colors.text, borderColor: colors.border, background: colors.bg }}
              >
                {CATEGORY_LABELS[course.category]}
              </span>
            </div>
          )}

          {/* Category Badge */}
          <div className="absolute top-2.5 left-2.5">
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-md border"
              style={{ color: colors.text, borderColor: colors.border, background: colors.bg }}
            >
              {CATEGORY_LABELS[course.category]}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1 gap-3">
          <h3 className="font-semibold text-sm leading-snug line-clamp-2 text-[#18181b] group-hover:text-black transition-colors duration-150">
            {course.title}
          </h3>

          {course.description && (
            <p className="text-xs text-[#9898a8] line-clamp-2 leading-relaxed">{course.description}</p>
          )}

          {instructorId ? (
            <Link
              href={`/instructor/${instructorId}`}
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-[#6b6b7b] hover:text-[#e9a000] transition-colors duration-150 w-fit"
            >
              {instructorName}
            </Link>
          ) : (
            <p className="text-xs text-[#6b6b7b]">{instructorName}</p>
          )}

          <div className="mt-auto pt-3 border-t border-[#e2e2ea] flex items-center justify-between">
            {enrollCount !== undefined && (
              <div className="flex items-center gap-1 text-[#9898a8]">
                <UsersIcon size={13} />
                <span className="text-xs">{(enrollCount ?? 0).toLocaleString()}명</span>
              </div>
            )}
            <p className="text-sm font-bold text-[#e9a000] ml-auto">
              {(course.price ?? 0) === 0 ? '무료' : `₩${(course.price ?? 0).toLocaleString()}`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
