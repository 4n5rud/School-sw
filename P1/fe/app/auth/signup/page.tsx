'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/context/AuthContext';
import { authService } from '@/lib/api/authService';
import { SignUpRequest } from '@/lib/api/types';

export default function SignUpPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [formData, setFormData] = useState<SignUpRequest>({
    email: '',
    password: '',
    nickname: '',
    role: 'STUDENT',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [emailChecked, setEmailChecked] = useState(false);
  const [isEmailAvailable, setIsEmailAvailable] = useState(false);

  const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = '이메일은 필수입니다';
    }

    if (!formData.password) {
      newErrors.password = '비밀번호는 필수입니다';
    } else if (!PASSWORD_REGEX.test(formData.password)) {
      newErrors.password = '비밀번호는 8자 이상이며, 영문, 숫자, 특수문자를 포함해야 합니다';
    }

    if (formData.password !== confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다';
    }

    if (!formData.nickname) {
      newErrors.nickname = '닉네임은 필수입니다';
    }

    if (!emailChecked || !isEmailAvailable) {
      newErrors.emailCheck = '이메일 중복 확인을 해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleCheckEmail = async () => {
    if (!formData.email) {
      setErrors((prev) => ({
        ...prev,
        email: '이메일을 입력해주세요',
      }));
      return;
    }

    try {
      const available = await authService.checkEmailAvailability(formData.email);
      if (available) {
        setIsEmailAvailable(true);
        setEmailChecked(true);
        setErrors((prev) => ({
          ...prev,
          emailCheck: '',
        }));
      } else {
        setIsEmailAvailable(false);
        setErrors((prev) => ({
          ...prev,
          emailCheck: '이미 사용 중인 이메일입니다',
        }));
      }
    } catch (err: any) {
      setErrors((prev) => ({
        ...prev,
        emailCheck: err.message || '이메일 확인 실패',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      await authService.signup(formData);
      refreshUser();
      router.push('/');
    } catch (err: any) {
      setErrors((prev) => ({
        ...prev,
        submit: err.message || '회원가입 실패',
      }));
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
            <h1 className="text-3xl font-bold text-[#ffffff] mb-8 text-center">회원가입</h1>

            {errors.submit && (
              <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg">
                <p className="text-red-400 text-sm">{errors.submit}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input with Check Button */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  이메일 {emailChecked && isEmailAvailable && <span className="text-green-400">✓</span>}
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={emailChecked && isEmailAvailable}
                    className="flex-1 px-4 py-2 bg-[#2a2a2a] border border-gray-700 rounded-lg text-[#ffffff] focus:outline-none focus:ring-2 focus:ring-[#ffffff] disabled:opacity-50"
                    placeholder="your@email.com"
                  />
                  <button
                    type="button"
                    onClick={handleCheckEmail}
                    disabled={!formData.email || (emailChecked && isEmailAvailable)}
                    className="px-4 py-2 bg-gray-700 text-[#ffffff] rounded-lg hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    확인
                  </button>
                </div>
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                {errors.emailCheck && <p className="text-red-400 text-xs mt-1">{errors.emailCheck}</p>}
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
                  className="w-full px-4 py-2 bg-[#2a2a2a] border border-gray-700 rounded-lg text-[#ffffff] focus:outline-none focus:ring-2 focus:ring-[#ffffff]"
                  placeholder="••••••••"
                />
                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
              </div>

              {/* Password Confirm Input */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  비밀번호 확인
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-[#2a2a2a] border border-gray-700 rounded-lg text-[#ffffff] focus:outline-none focus:ring-2 focus:ring-[#ffffff]"
                  placeholder="••••••••"
                />
                {errors.confirmPassword && (
                  <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Nickname Input */}
              <div>
                <label htmlFor="nickname" className="block text-sm font-medium text-gray-300 mb-2">
                  닉네임
                </label>
                <input
                  type="text"
                  id="nickname"
                  name="nickname"
                  value={formData.nickname}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-[#2a2a2a] border border-gray-700 rounded-lg text-[#ffffff] focus:outline-none focus:ring-2 focus:ring-[#ffffff]"
                  placeholder="닉네임 입력"
                />
                {errors.nickname && <p className="text-red-400 text-xs mt-1">{errors.nickname}</p>}
              </div>

              {/* Role Select */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-300 mb-2">
                  역할
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-[#2a2a2a] border border-gray-700 rounded-lg text-[#ffffff] focus:outline-none focus:ring-2 focus:ring-[#ffffff]"
                >
                  <option value="STUDENT">학생</option>
                  <option value="TEACHER">강사</option>
                </select>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || (emailChecked && !isEmailAvailable)}
                className="w-full bg-[#ffffff] text-[#000000] py-2 rounded-lg font-semibold hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '회원가입 중...' : '회원가입'}
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-gray-400">
                이미 계정이 있으신가요?{' '}
                <Link
                  href="/auth/login"
                  className="text-[#ffffff] font-semibold hover:text-gray-300 transition"
                >
                  로그인
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
