'use client';

import Link from 'next/link';
import { Course } from '@/lib/api/types';

interface CourseCardProps {
  course: Course;
}

export default function CourseCard({ course }: CourseCardProps) {
  return (
    <Link href={`/courses/${course.id}`}>
      <div className="bg-[#1a1a1a] rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden cursor-pointer h-full border border-gray-800 hover:border-gray-700">
        {/* Thumbnail */}
        <div className="w-full h-40 bg-gradient-to-br from-gray-800 to-gray-900 relative flex items-center justify-center">
          {course.thumbnailUrl ? (
            <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
          ) : (
            <span className="text-[#ffffff] text-xs font-semibold px-3 py-1 bg-black/60 rounded">
              {course.category === 'DOMESTIC_STOCK' ? '📈 국내주식' : course.category === 'OVERSEAS_STOCK' ? '🌍 해외주식' : course.category === 'CRYPTO' ? '🪙 암호화폐' : course.category === 'NFT' ? '🎨 NFT' : course.category === 'ETF' ? '📊 ETF' : '⚡ 선물투자'}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Title */}
          <h3 className="font-bold text-base line-clamp-2 text-[#ffffff] group-hover:text-gray-300">
            {course.title}
          </h3>

          {/* Instructor */}
          <p className="text-sm text-gray-400">{course.instructor.nickname}</p>

          {/* Student Count */}
          <div className="flex items-center gap-2">
            <span className="text-blue-500 text-sm">👥</span>
            <span className="text-sm text-gray-400">{course.studentCount}명 수강중</span>
          </div>

          {/* Price */}
          <p className="text-lg font-bold text-[#FFD700] border-t border-gray-700 pt-3">
            ₩{course.price.toLocaleString()}
          </p>
        </div>
      </div>
    </Link>
  );
}
