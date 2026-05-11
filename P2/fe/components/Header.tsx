'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { MenuIcon, XIcon, HomeIcon, BookOpenIcon, UserIcon, LogOutIcon, BarChartIcon, SettingsIcon, HeartIcon, CreditCardIcon } from '@/components/Icons';

export default function Header() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    router.push('/');
  };

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[#e2e2ea]">
      <nav className="max-w-7xl mx-auto px-4 h-15 flex items-center justify-between" style={{ height: '60px' }}>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-0.5 shrink-0">
          <span className="text-xl font-bold tracking-tight text-[#e9a000]">Stock</span>
          <span className="text-xl font-bold tracking-tight text-[#18181b]">Class</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-[#6b6b7b] hover:text-[#18181b] hover:bg-[#f0f0f8] transition-all duration-150"
          >
            <HomeIcon size={16} />
            홈
          </Link>
          {user?.role === 'STUDENT' && (
            <>
              <Link
                href="/my-courses"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-[#6b6b7b] hover:text-[#18181b] hover:bg-[#f0f0f8] transition-all duration-150"
              >
                <BookOpenIcon size={16} />
                내 강의실
              </Link>
              <Link
                href="/wishlist"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-[#6b6b7b] hover:text-[#18181b] hover:bg-[#f0f0f8] transition-all duration-150"
              >
                <HeartIcon size={16} />
                찜 목록
              </Link>
              <Link
                href="/payments"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-[#6b6b7b] hover:text-[#18181b] hover:bg-[#f0f0f8] transition-all duration-150"
              >
                <CreditCardIcon size={16} />
                결제 내역
              </Link>
            </>
          )}
          {user?.role === 'TEACHER' && (
            <>
              <Link
                href="/teacher/dashboard"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-[#6b6b7b] hover:text-[#18181b] hover:bg-[#f0f0f8] transition-all duration-150"
              >
                <BarChartIcon size={16} />
                대시보드
              </Link>
              <Link
                href="/teacher/courses"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-[#6b6b7b] hover:text-[#18181b] hover:bg-[#f0f0f8] transition-all duration-150"
              >
                <SettingsIcon size={16} />
                강의 관리
              </Link>
            </>
          )}
        </div>

        {/* Desktop Auth */}
        <div className="hidden md:flex items-center gap-2">
          {!isLoading && (
            <>
              {user ? (
                <div className="flex items-center gap-3">
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#f0f0f8] border border-[#e2e2ea] hover:border-[#e9a000] transition-all duration-150"
                  >
                    <div className="w-6 h-6 rounded-full bg-[#e9a000] flex items-center justify-center text-[#0a0a0d] text-xs font-bold">
                      {user.nickname.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-[#18181b]">{user.nickname}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-[#6b6b7b] hover:text-[#18181b] hover:bg-[#f0f0f8] transition-all duration-150"
                  >
                    <LogOutIcon size={16} />
                    로그아웃
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/auth/login"
                    className="px-4 py-2 rounded-lg text-sm font-medium text-[#6b6b7b] hover:text-[#18181b] hover:bg-[#f0f0f8] transition-all duration-150"
                  >
                    로그인
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#e9a000] text-[#0a0a0d] hover:bg-[#cc8e00] transition-all duration-150"
                  >
                    시작하기
                  </Link>
                </div>
              )}
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden p-2 rounded-lg text-[#6b6b7b] hover:text-[#18181b] hover:bg-[#f0f0f8] transition-all duration-150"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="메뉴 열기"
        >
          {isMenuOpen ? <XIcon size={22} /> : <MenuIcon size={22} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-[#e2e2ea] animate-slide-down">
          <div className="px-4 py-4 space-y-1">
            <Link
              href="/"
              onClick={closeMenu}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-[#6b6b7b] hover:text-[#18181b] hover:bg-[#f0f0f8] transition-all duration-150"
            >
              <HomeIcon size={17} />
              홈
            </Link>
            {user?.role === 'STUDENT' && (
              <>
                <Link
                  href="/my-courses"
                  onClick={closeMenu}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-[#6b6b7b] hover:text-[#18181b] hover:bg-[#f0f0f8] transition-all duration-150"
                >
                  <BookOpenIcon size={17} />
                  내 강의실
                </Link>
                <Link
                  href="/wishlist"
                  onClick={closeMenu}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-[#6b6b7b] hover:text-[#18181b] hover:bg-[#f0f0f8] transition-all duration-150"
                >
                  <HeartIcon size={17} />
                  찜 목록
                </Link>
                <Link
                  href="/payments"
                  onClick={closeMenu}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-[#6b6b7b] hover:text-[#18181b] hover:bg-[#f0f0f8] transition-all duration-150"
                >
                  <CreditCardIcon size={17} />
                  결제 내역
                </Link>
                <Link
                  href="/profile"
                  onClick={closeMenu}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-[#6b6b7b] hover:text-[#18181b] hover:bg-[#f0f0f8] transition-all duration-150"
                >
                  <UserIcon size={17} />
                  내 프로필
                </Link>
              </>
            )}
            {user?.role === 'TEACHER' && (
              <>
                <Link
                  href="/teacher/dashboard"
                  onClick={closeMenu}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-[#6b6b7b] hover:text-[#18181b] hover:bg-[#f0f0f8] transition-all duration-150"
                >
                  <BarChartIcon size={17} />
                  대시보드
                </Link>
                <Link
                  href="/teacher/courses"
                  onClick={closeMenu}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-[#6b6b7b] hover:text-[#18181b] hover:bg-[#f0f0f8] transition-all duration-150"
                >
                  <SettingsIcon size={17} />
                  강의 관리
                </Link>
              </>
            )}
          </div>

          {!isLoading && (
            <div className="px-4 pb-4 pt-2 border-t border-[#e2e2ea] space-y-2">
              {user ? (
                <>
                  <Link
                    href="/profile"
                    onClick={closeMenu}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-[#f0f0f8] transition-all duration-150"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#e9a000] flex items-center justify-center text-[#0a0a0d] text-sm font-bold">
                      {user.nickname.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-[#18181b]">{user.nickname}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-[#6b6b7b] hover:text-[#18181b] hover:bg-[#f0f0f8] transition-all duration-150"
                  >
                    <LogOutIcon size={17} />
                    로그아웃
                  </button>
                </>
              ) : (
                <div className="space-y-2">
                  <Link
                    href="/auth/login"
                    onClick={closeMenu}
                    className="block w-full text-center px-4 py-2.5 rounded-lg text-sm font-medium text-[#18181b] bg-[#f0f0f8] border border-[#e2e2ea] hover:bg-[#e8e8f2] transition-all duration-150"
                  >
                    로그인
                  </Link>
                  <Link
                    href="/auth/signup"
                    onClick={closeMenu}
                    className="block w-full text-center px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#e9a000] text-[#0a0a0d] hover:bg-[#cc8e00] transition-all duration-150"
                  >
                    시작하기
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
