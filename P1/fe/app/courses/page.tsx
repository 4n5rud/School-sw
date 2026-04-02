'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CourseCard from '@/components/CourseCard';
import { mockCourses } from '@/lib/mockData';

type CategoryType = 'ALL' | 'DOMESTIC_STOCK' | 'OVERSEAS_STOCK' | 'CRYPTO' | 'NFT' | 'ETF' | 'FUTURES';

export default function CoursesPage() {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('ALL');

  const categories = [
    { id: 'all', name: '전체', label: 'ALL' as CategoryType },
    { id: 'domestic_stock', name: '국내 주식', label: 'DOMESTIC_STOCK' as CategoryType },
    { id: 'overseas_stock', name: '해외 주식', label: 'OVERSEAS_STOCK' as CategoryType },
    { id: 'crypto', name: '암호화폐', label: 'CRYPTO' as CategoryType },
    { id: 'nft', name: 'NFT', label: 'NFT' as CategoryType },
    { id: 'etf', name: 'ETF', label: 'ETF' as CategoryType },
    { id: 'futures', name: '선물투자', label: 'FUTURES' as CategoryType },
  ];

  const filteredCourses = mockCourses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      course.instructor.toLowerCase().includes(searchKeyword.toLowerCase());
    const matchesCategory =
      selectedCategory === 'ALL' || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#000000]">
        {/* Search Section */}
        <section className="bg-[#0a0a0a] border-b border-gray-900 py-8">
          <div className="max-w-7xl mx-auto px-4 space-y-6">
            <h1 className="text-3xl font-bold text-[#ffffff]">강의 탐색</h1>

            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="강의명, 강사명으로 검색해보세요..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffffff] bg-[#1a1a1a] text-[#ffffff] placeholder-gray-500"
              />
              <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-[#ffffff]">
                search
              </button>
            </div>

            {/* Category Filter */}
            <div className="flex gap-3 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.label)}
                  className={`px-6 py-2 rounded-full font-medium transition ${
                    selectedCategory === cat.label
                      ? 'bg-[#ffffff] text-[#000000]'
                      : 'bg-gray-800 text-[#ffffff] hover:bg-gray-700'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Results */}
        <section className="bg-[#000000] max-w-7xl mx-auto px-4 py-12">
          <div className="space-y-8">
            <p className="text-gray-400">
              검색 결과: <span className="font-semibold text-[#ffffff]">{filteredCourses.length}</span>개의 강의
            </p>

            {filteredCourses.length > 0 ? (
              <div className="grid md:grid-cols-4 sm:grid-cols-2 grid-cols-1 gap-6">
                {filteredCourses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-2xl text-gray-500 mb-4">검색 결과가 없습니다</p>
                <p className="text-gray-400">다른 검색어를 시도해보세요</p>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
