'use client';

import { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CourseCard from '@/components/CourseCard';
import {
  SearchIcon, GridIcon, TrendingUpIcon, GlobeIcon,
  DiamondIcon, BarChartIcon, ZapIcon, ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon,
} from '@/components/Icons';
import { courseService } from '@/lib/api';
import { Course, CategoryType, PaginatedResponse } from '@/lib/api/types';

type FilterCategory = 'ALL' | CategoryType;

type SortOption = 'latest' | 'popular' | 'price_asc' | 'price_desc' | 'free';

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: 'latest',     label: '최신순' },
  { id: 'popular',    label: '인기순' },
  { id: 'price_asc',  label: '가격 낮은순' },
  { id: 'price_desc', label: '가격 높은순' },
  { id: 'free',       label: '무료만' },
];

function sortCourses(courses: Course[], sort: SortOption): Course[] {
  const list = [...courses];
  switch (sort) {
    case 'popular':
      return list.sort((a, b) => ((b.studentCount ?? b.enrollmentCount ?? 0) - (a.studentCount ?? a.enrollmentCount ?? 0)));
    case 'price_asc':
      return list.filter((c) => c.price > 0).sort((a, b) => a.price - b.price);
    case 'price_desc':
      return list.sort((a, b) => b.price - a.price);
    case 'free':
      return list.filter((c) => c.price === 0);
    case 'latest':
    default:
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

const CATEGORIES: { id: FilterCategory; label: string; Icon: React.ComponentType<any> }[] = [
  { id: 'ALL',            label: '전체',     Icon: GridIcon },
  { id: 'DOMESTIC_STOCK', label: '국내 주식', Icon: TrendingUpIcon },
  { id: 'OVERSEAS_STOCK', label: '해외 주식', Icon: GlobeIcon },
  { id: 'CRYPTO',         label: '암호화폐',  Icon: DiamondIcon },
  { id: 'NFT',            label: 'NFT',      Icon: DiamondIcon },
  { id: 'ETF',            label: 'ETF',       Icon: BarChartIcon },
  { id: 'FUTURES',        label: '선물투자',  Icon: ZapIcon },
];

const PAGE_SIZE = 12;

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-[#e2e2ea] overflow-hidden">
      <div className="aspect-video skeleton" />
      <div className="p-4 space-y-3">
        <div className="h-4 skeleton rounded w-full" />
        <div className="h-4 skeleton rounded w-3/4" />
        <div className="h-3 skeleton rounded w-1/3 mt-1" />
        <div className="pt-3 border-t border-[#e2e2ea] flex justify-between">
          <div className="h-3 skeleton rounded w-16" />
          <div className="h-4 skeleton rounded w-20" />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [pendingKeyword, setPendingKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('ALL');
  const [sortOption, setSortOption] = useState<SortOption>('latest');
  const [courses, setCourses] = useState<Course[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const fetchCourses = async (keyword: string, category: FilterCategory, page: number) => {
    setIsLoading(true);
    setError(null);
    try {
      let response: PaginatedResponse<Course>;
      if (keyword.trim()) {
        response = await courseService.searchCourses(
          keyword,
          category !== 'ALL' ? category : undefined,
          page,
          PAGE_SIZE
        );
      } else if (category !== 'ALL') {
        response = await courseService.getCoursesByCategory(category, page, PAGE_SIZE);
      } else {
        response = await courseService.getAllCourses(page, PAGE_SIZE);
      }
      setCourses(response.content);
      setTotalPages(response.totalPages ?? 1);
      setTotalElements(response.totalElements ?? 0);
    } catch (err: any) {
      setError(err.message || '강의를 불러오는데 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(0);
    fetchCourses(searchKeyword, selectedCategory, 0);
  }, [searchKeyword, selectedCategory]);

  useEffect(() => {
    fetchCourses(searchKeyword, selectedCategory, currentPage);
  }, [currentPage]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchKeyword(pendingKeyword);
  };

  const handleCategoryClick = (cat: FilterCategory) => {
    setSelectedCategory(cat);
    setCurrentPage(0);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f4f8]">
      <Header />

      <main className="flex-1">
        {/* Hero / Search Section */}
        <section className="bg-white border-b border-[#e2e2ea] py-10 px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6 animate-fade-in-up">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-bold text-[#18181b] tracking-tight">
                전문가에게 배우는 <span className="text-[#e9a000]">투자 강의</span>
              </h1>
              <p className="text-[#6b6b7b] text-base">
                국내외 주식, 암호화폐, ETF까지 — 모든 강의를 한 곳에서
              </p>
            </div>

            <form onSubmit={handleSearch} className="relative">
              <SearchIcon
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9898a8] pointer-events-none"
              />
              <input
                ref={searchRef}
                type="text"
                placeholder="강의명, 강사명으로 검색..."
                value={pendingKeyword}
                onChange={(e) => setPendingKeyword(e.target.value)}
                className="w-full pl-11 pr-28 py-3.5 rounded-xl bg-[#f8f8fc] border border-[#e2e2ea] text-[#18181b] placeholder-[#9898a8] text-sm focus:outline-none focus:border-[#e9a000] focus:ring-1 focus:ring-[#e9a000] transition-all duration-200"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-lg bg-[#e9a000] text-[#0a0a0d] text-sm font-semibold hover:bg-[#cc8e00] transition-all duration-150"
              >
                검색
              </button>
            </form>
          </div>
        </section>

        {/* Category Filter */}
        <section className="bg-white border-b border-[#e2e2ea] px-4 py-3">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {CATEGORIES.map(({ id, label, Icon }) => {
                const isActive = selectedCategory === id;
                return (
                  <button
                    key={id}
                    onClick={() => handleCategoryClick(id)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-150 shrink-0 ${
                      isActive
                        ? 'bg-[#e9a000] text-[#0a0a0d]'
                        : 'text-[#6b6b7b] bg-[#f0f0f8] border border-[#e2e2ea] hover:text-[#18181b] hover:border-[#d0d0dc]'
                    }`}
                  >
                    <Icon size={15} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Course Grid */}
        <section className="max-w-7xl mx-auto px-4 py-10">
          {/* Header row */}
          <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
            <div>
              {!isLoading && !error && (
                <p className="text-sm text-[#9898a8]">
                  강의 <span className="font-semibold text-[#18181b]">{(totalElements ?? 0).toLocaleString()}</span>개
                  {searchKeyword && (
                    <span className="ml-1">
                      — <span className="text-[#6b6b7b]">'{searchKeyword}'</span> 검색 결과
                    </span>
                  )}
                </p>
              )}
            </div>
            {/* Sort dropdown */}
            <div className="relative shrink-0">
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="appearance-none pl-3 pr-8 py-2 rounded-lg bg-white border border-[#e2e2ea] text-[#6b6b7b] text-sm focus:outline-none focus:border-[#e9a000] hover:border-[#d0d0dc] transition-all duration-150 cursor-pointer"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDownIcon
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9898a8] pointer-events-none"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
              <div className="w-14 h-14 rounded-full bg-[#fee2e2] border border-[#fecaca] flex items-center justify-center mb-4">
                <span className="text-[#ef4444] text-2xl">!</span>
              </div>
              <p className="text-[#18181b] font-medium mb-1">오류가 발생했습니다</p>
              <p className="text-sm text-[#9898a8]">{error}</p>
              <button
                onClick={() => fetchCourses(searchKeyword, selectedCategory, currentPage)}
                className="mt-5 px-5 py-2.5 rounded-lg bg-[#f0f0f8] border border-[#e2e2ea] text-sm text-[#18181b] hover:bg-[#e8e8f2] transition-all duration-150"
              >
                다시 시도
              </button>
            </div>
          ) : courses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
              <div className="w-14 h-14 rounded-full bg-[#f0f0f8] border border-[#e2e2ea] flex items-center justify-center mb-4">
                <SearchIcon size={24} className="text-[#9898a8]" />
              </div>
              <p className="text-[#18181b] font-medium mb-1">강의를 찾을 수 없습니다</p>
              <p className="text-sm text-[#9898a8]">다른 검색어나 카테고리를 시도해보세요</p>
              <button
                onClick={() => {
                  setSearchKeyword('');
                  setPendingKeyword('');
                  setSelectedCategory('ALL');
                }}
                className="mt-5 px-5 py-2.5 rounded-lg bg-[#f0f0f8] border border-[#e2e2ea] text-sm text-[#18181b] hover:bg-[#e8e8f2] transition-all duration-150"
              >
                전체 보기
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {sortCourses(courses, sortOption).map((course, i) => (
                  <CourseCard key={course.id} course={course} index={i} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-12 animate-fade-in">
                  <button
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-[#e2e2ea] text-[#6b6b7b] bg-white hover:bg-[#f0f0f8] hover:text-[#18181b] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
                  >
                    <ChevronLeftIcon size={16} />
                    이전
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                      let page = i;
                      if (totalPages > 7) {
                        if (currentPage < 4) {
                          page = i;
                        } else if (currentPage > totalPages - 5) {
                          page = totalPages - 7 + i;
                        } else {
                          page = currentPage - 3 + i;
                        }
                      }
                      const isActive = page === currentPage;
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-9 h-9 rounded-lg text-sm font-medium transition-all duration-150 ${
                            isActive
                              ? 'bg-[#e9a000] text-[#0a0a0d]'
                              : 'text-[#6b6b7b] hover:bg-[#f0f0f8] hover:text-[#18181b]'
                          }`}
                        >
                          {page + 1}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                    disabled={currentPage >= totalPages - 1}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-[#e2e2ea] text-[#6b6b7b] bg-white hover:bg-[#f0f0f8] hover:text-[#18181b] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
                  >
                    다음
                    <ChevronRightIcon size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
