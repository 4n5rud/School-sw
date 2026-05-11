'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/context/AuthContext';
import { authService } from '@/lib/api/authService';
import { LoginRequest } from '@/lib/api/types';
import { SpinnerIcon, AlertCircleIcon } from '@/components/Icons';

export default function LoginPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [formData, setFormData] = useState<LoginRequest>({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await authService.login(formData);
      refreshUser();
      const user = authService.getUser();
      if (user?.role === 'TEACHER') {
        router.push('/teacher/dashboard');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || '이메일 또는 비밀번호를 확인해주세요');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f4f8]">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm animate-fade-in-up">
          {/* Card */}
          <div className="bg-[#ffffff] border border-[#e2e2ea] rounded-2xl p-8 space-y-6 shadow-sm">
            {/* Header */}
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-[#18181b] tracking-tight">로그인</h1>
              <p className="text-sm text-[#9898a8]">계속하려면 로그인하세요</p>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#fee2e2] border border-[#fecaca] animate-fade-in">
                <AlertCircleIcon size={16} className="text-[#ef4444] mt-0.5 shrink-0" />
                <p className="text-sm text-[#f87171]">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-medium text-[#6b6b7b]">
                  이메일
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 rounded-xl bg-[#ffffff] border border-[#e2e2ea] text-[#18181b] placeholder-[#9898a8] text-sm focus:outline-none focus:border-[#e9a000] focus:ring-1 focus:ring-[#e9a000] transition-all duration-200"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-[#6b6b7b]">
                  비밀번호
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl bg-[#ffffff] border border-[#e2e2ea] text-[#18181b] placeholder-[#9898a8] text-sm focus:outline-none focus:border-[#e9a000] focus:ring-1 focus:ring-[#e9a000] transition-all duration-200"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#e9a000] text-[#0a0a0d] font-semibold text-sm hover:bg-[#cc8e00] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <SpinnerIcon size={16} />
                    로그인 중...
                  </>
                ) : '로그인'}
              </button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#e2e2ea]" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-[#ffffff] px-3 text-xs text-[#9898a8]">또는</span>
              </div>
            </div>

            <p className="text-center text-sm text-[#9898a8]">
              계정이 없으신가요?{' '}
              <Link
                href="/auth/signup"
                className="text-[#e9a000] font-medium hover:text-[#cc8e00] transition-colors duration-150"
              >
                회원가입
              </Link>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
