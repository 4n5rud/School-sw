'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { apiClient } from '@/lib/api/client';
import { WishlistItem } from '@/lib/api/types';
import { SpinnerIcon, AlertCircleIcon, BookOpenIcon } from '@/components/Icons';

// Heart icon (filled) for remove action
function HeartFilledIcon({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function WishlistCard({
  item,
  onRemove,
  removing,
}: {
  item: WishlistItem;
  onRemove: (courseId: number) => void;
  removing: boolean;
}) {
  return (
    <div className="relative group bg-[#ffffff] border border-[#e2e2ea] rounded-xl overflow-hidden hover:border-[#d0d0dc] hover:shadow-lg transition-all duration-200 flex flex-col">
      {/* Remove button */}
      <button
        onClick={() => onRemove(item.courseId)}
        disabled={removing}
        title="찜 해제"
        className="absolute top-2.5 right-2.5 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-[#ffffff]/80 backdrop-blur-sm border border-[#e2e2ea] text-[#e9a000] hover:text-[#ef4444] hover:border-[#fecaca] hover:bg-[#fee2e2] transition-all duration-150"
      >
        {removing ? <SpinnerIcon size={14} className="text-[#e9a000]" /> : <HeartFilledIcon size={14} />}
      </button>

      {/* Thumbnail */}
      <Link href={`/courses/${item.courseId}`} className="block aspect-video overflow-hidden bg-[#f0f0f8] shrink-0">
        {item.courseThumbnailUrl ? (
          <img
            src={item.courseThumbnailUrl}
            alt={item.courseTitle}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpenIcon size={28} className="text-[#d0d0dc]" />
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 gap-2">
        <Link href={`/courses/${item.courseId}`}>
          <h3 className="font-semibold text-sm leading-snug line-clamp-2 text-[#18181b] hover:text-[#e9a000] transition-colors duration-150">
            {item.courseTitle}
          </h3>
        </Link>
        {item.instructorNickname && (
          <p className="text-xs text-[#9898a8]">{item.instructorNickname}</p>
        )}
        <p className="mt-auto text-base font-bold text-[#e9a000]">
          {(item.coursePrice ?? 0) === 0 ? '무료' : `₩${(item.coursePrice ?? 0).toLocaleString()}`}
        </p>
      </div>
    </div>
  );
}

export default function WishlistPage() {
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingIds, setRemovingIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) {
      setIsLoading(false);
      return;
    }
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await apiClient.getMyWishlist();
        const data = (response as any).data ?? response;
        const list: WishlistItem[] = Array.isArray(data) ? data : (data?.content ?? []);
        setItems(list);
      } catch (err: any) {
        setError(err.message || '찜 목록을 불러오는데 실패했습니다');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [authLoading, isLoggedIn]);

  const handleRemove = async (courseId: number) => {
    setRemovingIds((prev) => new Set(prev).add(courseId));
    try {
      await apiClient.toggleWishlist(courseId);
      setItems((prev) => prev.filter((item) => item.courseId !== courseId));
    } catch (err: any) {
      setError(err.message || '찜 해제에 실패했습니다');
    } finally {
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(courseId);
        return next;
      });
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f4f4f8]">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <SpinnerIcon size={32} className="text-[#e9a000]" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f4f4f8]">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-[#f0f0f8] border border-[#e2e2ea] flex items-center justify-center mx-auto mb-5">
              <HeartFilledIcon size={28} className="text-[#9898a8]" />
            </div>
            <h2 className="text-lg font-semibold text-[#18181b] mb-2">로그인이 필요합니다</h2>
            <p className="text-sm text-[#9898a8] mb-6">찜 목록을 보려면 로그인하세요</p>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#e9a000] text-[#0a0a0d] font-semibold text-sm hover:bg-[#cc8e00] transition-all duration-150"
            >
              로그인하기
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f4f8]">
      <Header />

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
          {/* Header */}
          <div className="animate-fade-in-up">
            <div className="flex items-center gap-2.5 mb-1">
              <HeartFilledIcon size={22} className="text-[#e9a000]" />
              <h1 className="text-2xl font-bold text-[#18181b] tracking-tight">내 찜 목록</h1>
            </div>
            {!error && (
              <p className="text-sm text-[#9898a8] mt-1">
                찜한 강의{' '}
                <span className="font-semibold text-[#18181b]">{items.length}</span>개
              </p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2.5 p-4 rounded-xl bg-[#fee2e2] border border-[#fecaca]">
              <AlertCircleIcon size={16} className="text-[#ef4444] shrink-0" />
              <p className="text-sm text-[#f87171]">{error}</p>
            </div>
          )}

          {/* Empty state */}
          {!error && items.length === 0 && (
            <div className="bg-[#ffffff] border border-[#e2e2ea] rounded-xl p-16 text-center animate-fade-in shadow-sm">
              <div className="w-16 h-16 rounded-full bg-[#f0f0f8] border border-[#e2e2ea] flex items-center justify-center mx-auto mb-4">
                <HeartFilledIcon size={28} className="text-[#d0d0dc]" />
              </div>
              <p className="text-[#18181b] font-medium mb-1">찜한 강의가 없습니다</p>
              <p className="text-sm text-[#9898a8] mb-5">
                관심 있는 강의를 찜해두면 여기에 표시됩니다
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#f0f0f8] border border-[#e2e2ea] text-sm text-[#18181b] hover:bg-[#e8e8f2] hover:border-[#d0d0dc] transition-all duration-150"
              >
                <BookOpenIcon size={15} />
                강의 탐색하기
              </Link>
            </div>
          )}

          {/* Grid */}
          {!error && items.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 animate-fade-in">
              {items.map((item) => (
                <WishlistCard
                  key={item.id}
                  item={item}
                  onRemove={handleRemove}
                  removing={removingIds.has(item.courseId)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
