'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/context/AuthContext';
import { authService } from '@/lib/api/authService';
import { SignUpRequest } from '@/lib/api/types';
import { SpinnerIcon, AlertCircleIcon, CheckCircleIcon } from '@/components/Icons';

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

type FormErrors = {
  email?: string;
  emailCheck?: string;
  password?: string;
  confirmPassword?: string;
  nickname?: string;
  submit?: string;
};

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
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [emailChecked, setEmailChecked] = useState(false);
  const [isEmailAvailable, setIsEmailAvailable] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  const setFieldError = (field: keyof FormErrors, msg: string) =>
    setErrors((prev) => ({ ...prev, [field]: msg }));

  const clearFieldError = (field: keyof FormErrors) =>
    setErrors((prev) => ({ ...prev, [field]: undefined }));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    clearFieldError(name as keyof FormErrors);
    if (name === 'email') {
      setEmailChecked(false);
      setIsEmailAvailable(false);
    }
  };

  const handleCheckEmail = async () => {
    if (!formData.email) {
      setFieldError('email', '이메일을 입력해주세요');
      return;
    }
    setIsCheckingEmail(true);
    try {
      const available = await authService.checkEmailAvailability(formData.email);
      setIsEmailAvailable(available);
      setEmailChecked(true);
      if (!available) {
        setFieldError('emailCheck', '이미 사용 중인 이메일입니다');
      } else {
        clearFieldError('emailCheck');
      }
    } catch (err: any) {
      setFieldError('emailCheck', err.message || '이메일 확인 실패');
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.email) newErrors.email = '이메일은 필수입니다';
    if (!formData.password) {
      newErrors.password = '비밀번호는 필수입니다';
    } else if (!PASSWORD_REGEX.test(formData.password)) {
      newErrors.password = '8자 이상, 영문·숫자·특수문자(@$!%*#?&)를 포함해야 합니다';
    }
    if (formData.password !== confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다';
    }
    if (!formData.nickname) newErrors.nickname = '닉네임은 필수입니다';
    if (!emailChecked || !isEmailAvailable) {
      newErrors.emailCheck = '이메일 중복 확인을 완료해주세요';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      await authService.signup(formData);
      refreshUser();
      router.push('/');
    } catch (err: any) {
      setFieldError('submit', err.message || '회원가입에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f4f8]">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm animate-fade-in-up">
          <div className="bg-[#ffffff] border border-[#e2e2ea] rounded-2xl p-8 space-y-6 shadow-sm">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-[#18181b] tracking-tight">회원가입</h1>
              <p className="text-sm text-[#9898a8]">StockClass와 함께 투자를 시작하세요</p>
            </div>

            {errors.submit && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#fee2e2] border border-[#fecaca] animate-fade-in">
                <AlertCircleIcon size={16} className="text-[#ef4444] mt-0.5 shrink-0" />
                <p className="text-sm text-[#f87171]">{errors.submit}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-sm font-medium text-[#6b6b7b]">
                  이메일
                  {emailChecked && isEmailAvailable && (
                    <CheckCircleIcon size={14} className="text-[#22c55e]" />
                  )}
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={emailChecked && isEmailAvailable}
                    placeholder="your@email.com"
                    className="flex-1 px-4 py-3 rounded-xl bg-[#ffffff] border border-[#e2e2ea] text-[#18181b] placeholder-[#9898a8] text-sm focus:outline-none focus:border-[#e9a000] focus:ring-1 focus:ring-[#e9a000] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={handleCheckEmail}
                    disabled={!formData.email || (emailChecked && isEmailAvailable) || isCheckingEmail}
                    className="px-3.5 py-3 rounded-xl bg-[#f0f0f8] border border-[#e2e2ea] text-sm font-medium text-[#6b6b7b] hover:text-[#18181b] hover:border-[#d0d0dc] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                  >
                    {isCheckingEmail ? <SpinnerIcon size={15} /> : '확인'}
                  </button>
                </div>
                {errors.email && <p className="text-xs text-[#f87171]">{errors.email}</p>}
                {errors.emailCheck && <p className="text-xs text-[#f87171]">{errors.emailCheck}</p>}
                {emailChecked && isEmailAvailable && (
                  <p className="text-xs text-[#22c55e]">사용 가능한 이메일입니다</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#6b6b7b]">비밀번호</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl bg-[#ffffff] border border-[#e2e2ea] text-[#18181b] placeholder-[#9898a8] text-sm focus:outline-none focus:border-[#e9a000] focus:ring-1 focus:ring-[#e9a000] transition-all duration-200"
                />
                {errors.password && <p className="text-xs text-[#f87171]">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#6b6b7b]">비밀번호 확인</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    clearFieldError('confirmPassword');
                  }}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl bg-[#ffffff] border border-[#e2e2ea] text-[#18181b] placeholder-[#9898a8] text-sm focus:outline-none focus:border-[#e9a000] focus:ring-1 focus:ring-[#e9a000] transition-all duration-200"
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-[#f87171]">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Nickname */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#6b6b7b]">닉네임</label>
                <input
                  type="text"
                  name="nickname"
                  value={formData.nickname}
                  onChange={handleChange}
                  placeholder="닉네임 입력 (2~30자)"
                  className="w-full px-4 py-3 rounded-xl bg-[#ffffff] border border-[#e2e2ea] text-[#18181b] placeholder-[#9898a8] text-sm focus:outline-none focus:border-[#e9a000] focus:ring-1 focus:ring-[#e9a000] transition-all duration-200"
                />
                {errors.nickname && <p className="text-xs text-[#f87171]">{errors.nickname}</p>}
              </div>

              {/* Role */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#6b6b7b]">역할</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['STUDENT', 'TEACHER'] as const).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, role }))}
                      className={`py-3 rounded-xl text-sm font-medium border transition-all duration-150 ${
                        formData.role === role
                          ? 'bg-[#e9a000] text-[#0a0a0d] border-[#e9a000]'
                          : 'bg-[#f0f0f8] text-[#6b6b7b] border-[#e2e2ea] hover:border-[#d0d0dc] hover:text-[#18181b]'
                      }`}
                    >
                      {role === 'STUDENT' ? '수강생' : '강사'}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#e9a000] text-[#0a0a0d] font-semibold text-sm hover:bg-[#cc8e00] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <SpinnerIcon size={16} />
                    가입 중...
                  </>
                ) : '회원가입'}
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
              이미 계정이 있으신가요?{' '}
              <Link
                href="/auth/login"
                className="text-[#e9a000] font-medium hover:text-[#cc8e00] transition-colors duration-150"
              >
                로그인
              </Link>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
