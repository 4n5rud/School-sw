'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';

export default function Header() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    router.push('/');
  };

  const handleLoginRedirect = () => {
    router.push('/auth/login');
  };

  const handleSignupRedirect = () => {
    router.push('/auth/signup');
  };

  return (
    <header className="sticky top-0 z-50 bg-[#000000] border-b border-gray-800 shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold text-[#ffffff]">
<span className="text-[#FFD700]">Stock</span><span className="text-[#ffffff]">Class</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex gap-8 items-center">
          <Link
            href="/"
            className="text-[#ffffff] hover:text-gray-400 font-medium transition"
          >
            홈
          </Link>
          {user && (
            <Link
              href="/my-courses"
              className="text-[#ffffff] hover:text-gray-400 font-medium transition"
            >
              내 강의실
            </Link>
          )}

          {/* Auth Section */}
          {!isLoading && (
            <>
              {user ? (
                <div className="flex items-center gap-4">
                  <span className="text-gray-300 text-sm">{user.nickname}</span>
                  <button
                    onClick={handleLogout}
                    className="bg-gray-700 text-[#ffffff] px-6 py-2 rounded-lg hover:bg-gray-600 transition font-medium"
                  >
                    로그아웃
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleLoginRedirect}
                    className="bg-[#ffffff] text-[#000000] px-6 py-2 rounded-lg hover:bg-gray-200 transition font-medium"
                  >
                    로그인
                  </button>
                  <button
                    onClick={handleSignupRedirect}
                    className="bg-gray-700 text-[#ffffff] px-6 py-2 rounded-lg hover:bg-gray-600 transition font-medium"
                  >
                    가입
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-[#ffffff]"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-[#1a1a1a] border-t border-gray-800 p-4 space-y-3">
          <Link
            href="/"
            className="block text-[#ffffff] hover:text-gray-400 font-medium py-2"
            onClick={() => setIsMenuOpen(false)}
          >
            홈
          </Link>
          {user && (
            <Link
              href="/my-courses"
              className="block text-[#ffffff] hover:text-gray-400 font-medium py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              내 강의실
            </Link>
          )}

          {/* Mobile Auth Section */}
          {!isLoading && (
            <div className="pt-2 border-t border-gray-700 space-y-2">
              {user ? (
                <>
                  <p className="text-gray-300 text-sm px-2">{user.nickname}</p>
                  <button
                    onClick={handleLogout}
                    className="w-full bg-gray-700 text-[#ffffff] px-4 py-2 rounded-lg hover:bg-gray-600 transition font-medium"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleLoginRedirect}
                    className="w-full bg-[#ffffff] text-[#000000] px-4 py-2 rounded-lg hover:bg-gray-200 transition font-medium"
                  >
                    로그인
                  </button>
                  <button
                    onClick={handleSignupRedirect}
                    className="w-full bg-gray-700 text-[#ffffff] px-4 py-2 rounded-lg hover:bg-gray-600 transition font-medium"
                  >
                    회원가입
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
