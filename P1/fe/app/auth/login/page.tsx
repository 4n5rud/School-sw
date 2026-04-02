'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/context/AuthContext';
import { authService } from '@/lib/api/authService';
import { LoginRequest } from '@/lib/api/types';

export default function LoginPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await authService.login(formData);
      refreshUser();
      router.push('/');
    } catch (err: any) {
      setError(err.message || '로그인 실패');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#000000] flex items-center justify-center py-12">
        <div className="w-full max-w-md">
          <div className="bg-[#1a1a1a] rounded-lg shadow-lg p-8 border border-gray-800">
            <h1 className="text-3xl font-bold text-[#ffffff] mb-8 text-center">로그인</h1>

            {error && (
              <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  이메일
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 bg-[#2a2a2a] border border-gray-700 rounded-lg text-[#ffffff] focus:outline-none focus:ring-2 focus:ring-[#ffffff]"
                  placeholder="your@email.com"
                />
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  비밀번호
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 bg-[#2a2a2a] border border-gray-700 rounded-lg text-[#ffffff] focus:outline-none focus:ring-2 focus:ring-[#ffffff]"
                  placeholder="••••••••"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#ffffff] text-[#000000] py-2 rounded-lg font-semibold hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '로그인 중...' : '로그인'}
              </button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-4">
              <div className="flex-1 h-px bg-gray-700"></div>
              <span className="text-gray-500 text-sm">또는</span>
              <div className="flex-1 h-px bg-gray-700"></div>
            </div>

            {/* Sign Up Link */}
            <div className="text-center">
              <p className="text-gray-400 mb-4">
                계정이 없으신가요?{' '}
                <Link
                  href="/auth/signup"
                  className="text-[#ffffff] font-semibold hover:text-gray-300 transition"
                >
                  회원가입
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
