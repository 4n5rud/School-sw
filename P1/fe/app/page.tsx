'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CourseCard from '@/components/CourseCard';
import { courseService } from '@/lib/api';
import { Course, PaginatedResponse } from '@/lib/api/types';

type CategoryType = 'ALL' | 'DOMESTIC_STOCK' | 'OVERSEAS_STOCK' | 'CRYPTO' | 'NFT' | 'ETF' | 'FUTURES';

export default function Home() {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('ALL');
  const [courses, setCourses] = useState<Course[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const PAGE_SIZE = 12;

  // 검색/필터 변경 시 API 호출
  useEffect(() => {
    const loadCourses = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setCurrentPage(0); // 검색 시 첫 페이지로 리셋

        let response: PaginatedResponse<Course>;

        if (searchKeyword.trim()) {
          // 검색 적용 (카테고리와 함께 검색 가능)
          const categoryParam = selectedCategory !== 'ALL' ? selectedCategory : undefined;
          response = await courseService.searchCourses(
            searchKeyword,
            categoryParam,
            0,
            PAGE_SIZE
          );
        } else if (selectedCategory !== 'ALL') {
          // 카테고리 필터만 적용
          response = await courseService.getCoursesByCategory(
            selectedCategory,
            0,
            PAGE_SIZE
          );
        } else {
          // 전체 조회
          response = await courseService.getAllCourses(0, PAGE_SIZE);
        }

        setCourses(response.content);
        setTotalPages(response.totalPages || 1);
        setTotalElements(response.totalElements || 0);
      } catch (err: any) {
        console.error('강의 목록 조회 실패:', err);
        setError(err.message || '강의를 불러오는데 실패했습니다');
      } finally {
        setIsLoading(false);
      }
    };

    loadCourses();
  }, [searchKeyword, selectedCategory]);

  // 페이지 변경 시 API 호출
  useEffect(() => {
    if (currentPage === 0) return; // 초기 로드는 위의 useEffect에서 처리

    const loadPage = async () => {
      try {
        setIsLoading(true);
        setError(null);

        let response: PaginatedResponse<Course>;

        if (searchKeyword.trim()) {
          // 검색 적용 (카테고리와 함께 검색 가능)
          const categoryParam = selectedCategory !== 'ALL' ? selectedCategory : undefined;
          response = await courseService.searchCourses(
            searchKeyword,
            categoryParam,
            currentPage,
            PAGE_SIZE
          );
        } else if (selectedCategory !== 'ALL') {
          // 카테고리 필터만 적용
          response = await courseService.getCoursesByCategory(
            selectedCategory,
            currentPage,
            PAGE_SIZE
          );
        } else {
          response = await courseService.getAllCourses(currentPage, PAGE_SIZE);
        }

        setCourses(response.content);
        setTotalPages(response.totalPages || 1);
        setTotalElements(response.totalElements || 0);
      } catch (err: any) {
        console.error('페이지 로드 실패:', err);
        setError(err.message || '페이지를 불러오는데 실패했습니다');
      } finally {
        setIsLoading(false);
      }
    };

    loadPage();
  }, [currentPage]);

  const categories = [
    { id: 'all', name: '전체', icon: 'apps', color: 'bg-gray-700' },
    { id: 'domestic_stock', name: '국내 주식', icon: 'trending-up', color: 'bg-blue-600' },
    { id: 'overseas_stock', name: '해외 주식', icon: 'globe', color: 'bg-teal-600' },
    { id: 'crypto', name: '암호화폐', icon: 'coins', color: 'bg-yellow-600' },
    { id: 'nft', name: 'NFT', icon: 'palette', color: 'bg-purple-600' },
    { id: 'etf', name: 'ETF', icon: 'chart-histogram', color: 'bg-green-600' },
    { id: 'futures', name: '선물투자', icon: 'lightning', color: 'bg-red-600' },
  ];

  const handleCategoryClick = (categoryId: string) => {
    if (categoryId === 'all') {
      setSelectedCategory('ALL');
    } else if (categoryId === 'domestic_stock') {
      setSelectedCategory('DOMESTIC_STOCK');
    } else if (categoryId === 'overseas_stock') {
      setSelectedCategory('OVERSEAS_STOCK');
    } else if (categoryId === 'crypto') {
      setSelectedCategory('CRYPTO');
    } else if (categoryId === 'nft') {
      setSelectedCategory('NFT');
    } else if (categoryId === 'etf') {
      setSelectedCategory('ETF');
    } else if (categoryId === 'futures') {
      setSelectedCategory('FUTURES');
    }
    // 카테고리 변경 시 첫 페이지로 이동
    setCurrentPage(0);
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#000000]">
        {/* Categories Grid */}
        <section className="bg-[#0a0a0a] border-b border-gray-900 py-8">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-4 md:grid-cols-7 gap-4">
              {categories.map((category) => (
                <button
                  key={category.id}
                  className="flex flex-col items-center gap-2 group cursor-pointer"
                  onClick={() => handleCategoryClick(category.id)}
                >
                  <div className={`w-16 h-16 rounded-lg ${category.color} flex items-center justify-center text-white text-2xl group-hover:shadow-lg transition-shadow`}>
                    {category.icon === 'apps' && '⊞'}
                    {category.icon === 'trending-up' && '📈'}
                    {category.icon === 'globe' && '🌍'}
                    {category.icon === 'coins' && '🪙'}
                    {category.icon === 'palette' && '🎨'}
                    {category.icon === 'chart-histogram' && '📊'}
                    {category.icon === 'lightning' && '⚡'}
                  </div>
                  <span className="text-xs md:text-sm text-[#ffffff] font-medium text-center">{category.name}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Search Section */}
        <section className="bg-[#0a0a0a] border-b border-gray-900 py-8">
          <div className="max-w-7xl mx-auto px-4 space-y-6">
            <h1 className="text-3xl font-bold text-[#ffffff]">강의 목록</h1>

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
          </div>
        </section>

        {/* Results */}
        <section className="bg-[#000000] max-w-7xl mx-auto px-4 py-12">
          <div className="space-y-8">
            {isLoading ? (
              <div className="text-center py-20">
                <p className="text-xl text-gray-400">강의를 불러오는 중입니다...</p>
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <p className="text-2xl text-red-400 mb-4">오류가 발생했습니다</p>
                <p className="text-gray-500">{error}</p>
              </div>
            ) : (
              <>
                <p className="text-gray-400">
                  검색 결과: <span className="font-semibold text-[#ffffff]">{totalElements}</span>개의 강의
                </p>

                {courses.length > 0 ? (
                  <>
                    <div className="grid md:grid-cols-4 sm:grid-cols-2 grid-cols-1 gap-6">
                      {courses.map((course) => (
                        <CourseCard key={course.id} course={course} />
                      ))}
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex items-center justify-center gap-4 pt-8 border-t border-gray-800">
                      <button
                        onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                        disabled={currentPage === 0}
                        className={`px-6 py-2 rounded-lg font-medium transition ${
                          currentPage === 0
                            ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                            : 'bg-[#ffffff] text-[#000000] hover:bg-gray-200'
                        }`}
                      >
                        이전
                      </button>

                      <span className="text-gray-400">
                        <span className="font-semibold text-[#ffffff]">{currentPage + 1}</span>
                        <span> / </span>
                        <span className="font-semibold text-[#ffffff]">{totalPages}</span>
                      </span>

                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                        disabled={currentPage === totalPages - 1}
                        className={`px-6 py-2 rounded-lg font-medium transition ${
                          currentPage === totalPages - 1
                            ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                            : 'bg-[#ffffff] text-[#000000] hover:bg-gray-200'
                        }`}
                      >
                        다음
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-20">
                    <p className="text-2xl text-gray-400 mb-4">검색 결과가 없습니다</p>
                    <p className="text-gray-500">다른 검색어를 시도해보세요</p>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
