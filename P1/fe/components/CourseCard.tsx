'use client';

import Link from 'next/link';
import { Course } from '@/lib/types';

interface CourseCardProps {
  course: Course;
}

export default function CourseCard({ course }: CourseCardProps) {
  return (
    <Link href={`/courses/${course.id}`}>
      <div className="bg-[#1a1a1a] rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden cursor-pointer h-full border border-gray-800 hover:border-gray-700">
        {/* Thumbnail */}
        <div className="w-full h-40 bg-gradient-to-br from-gray-800 to-gray-900 relative flex items-center justify-center">
          <span className="text-[#ffffff] text-xs font-semibold px-3 py-1 bg-black/60 rounded">
            {course.category === 'DOMESTIC_STOCK' ? '📈 국내주식' : course.category === 'OVERSEAS_STOCK' ? '🌍 해외주식' : course.category === 'CRYPTO' ? '🪙 암호화폐' : course.category === 'NFT' ? '🎨 NFT' : course.category === 'ETF' ? '📊 ETF' : '⚡ 선물투자'}
          </span>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Title */}
          <h3 className="font-bold text-base line-clamp-2 text-[#ffffff] group-hover:text-gray-300">
            {course.title}
          </h3>

          {/* Instructor */}
          <p className="text-sm text-gray-400">{course.instructor}</p>

          {/* Rating */}
          <div className="flex items-center gap-2">
            <span className="text-yellow-500 text-sm">★</span>
            <span className="font-semibold text-sm text-[#ffffff]">{course.rating}</span>
            <span className="text-gray-500 text-xs">({course.totalEnrollments}명)</span>
          </div>

          {/* Price */}
          <p className="text-lg font-bold text-[#ffffff]">
            ₩{course.price.toLocaleString()}
          </p>
        </div>
      </div>
    </Link>
  );
}
