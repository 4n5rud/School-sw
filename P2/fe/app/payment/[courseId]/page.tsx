'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { courseService, enrollmentService } from '@/lib/api';
import { Course, CATEGORY_LABELS, CategoryType } from '@/lib/api/types';
import { useAuth } from '@/lib/context/AuthContext';
import {
  ChevronLeftIcon, SpinnerIcon, AlertCircleIcon, CheckCircleIcon, BookOpenIcon,
} from '@/components/Icons';

const CATEGORY_COLORS: Record<CategoryType, { text: string; bg: string; border: string }> = {
  DOMESTIC_STOCK: { text: '#60a5fa', bg: '#dbeafe', border: '#bfdbfe' },
  OVERSEAS_STOCK: { text: '#2dd4bf', bg: '#ccfbf1', border: '#99f6e4' },
  CRYPTO:         { text: '#fbbf24', bg: '#fef3c7', border: '#fde68a' },
  NFT:            { text: '#c084fc', bg: '#f3e8ff', border: '#e9d5ff' },
  ETF:            { text: '#4ade80', bg: '#dcfce7', border: '#bbf7d0' },
  FUTURES:        { text: '#f87171', bg: '#fee2e2', border: '#fecaca' },
};

type PaymentMethod = 'CARD' | 'TRANSFER';

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: string; desc: string }[] = [
  { id: 'CARD',     label: '신용/체크카드', icon: '💳', desc: '모든 카드사 지원' },
  { id: 'TRANSFER', label: '계좌이체',       icon: '🏦', desc: '실시간 계좌이체' },
];

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = parseInt(params.courseId as string);
  const { user, isLoggedIn } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('CARD');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentDone, setPaymentDone] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/auth/login');
      return;
    }
    const load = async () => {
      try {
        setIsLoading(true);
        const data = await courseService.getCourseById(courseId);
        setCourse(data);
      } catch (err: any) {
        setError(err.message || '강의 정보를 불러오는데 실패했습니다');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [courseId, isLoggedIn, router]);

  const handlePayment = async () => {
    if (!agreedTerms) {
      setPaymentError('이용약관에 동의해주세요');
      return;
    }
    setIsProcessing(true);
    setPaymentError('');
    try {
      const isFree = (course?.price ?? 0) === 0;

      if (isFree) {
        // Free course: direct enrollment
        await enrollmentService.enrollCourse(courseId);
      } else {
        // Paid: call payments API then enroll
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/payments`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ courseId, paymentMethod: selectedMethod }),
          }
        );
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || '결제에 실패했습니다');
        }
        // After successful payment, enroll
        try {
          await enrollmentService.enrollCourse(courseId);
        } catch {
          // may already be enrolled after payment
        }
      }

      setPaymentDone(true);
      setTimeout(() => {
        router.push(`/learning/${courseId}`);
      }, 2000);
    } catch (err: any) {
      setPaymentError(err.message || '결제 처리 중 오류가 발생했습니다');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-[#f4f4f8] flex items-center justify-center">
          <SpinnerIcon size={36} className="text-[#e9a000]" />
        </main>
        <Footer />
      </>
    );
  }

  if (error || !course) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-[#f4f4f8] flex items-center justify-center px-4">
          <div className="text-center animate-fade-in">
            <AlertCircleIcon size={40} className="text-[#ef4444] mx-auto mb-4" />
            <h1 className="text-lg font-semibold text-[#18181b] mb-2">강의를 찾을 수 없습니다</h1>
            <p className="text-sm text-[#9898a8] mb-6">{error}</p>
            <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e9a000] text-[#0a0a0d] text-sm font-semibold hover:bg-[#cc8e00] transition-all duration-150">
              <ChevronLeftIcon size={16} />홈으로
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (paymentDone) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-[#f4f4f8] flex items-center justify-center px-4">
          <div className="text-center animate-fade-in space-y-4">
            <div className="w-20 h-20 rounded-full bg-[#dcfce7] border border-[#bbf7d0] flex items-center justify-center mx-auto">
              <CheckCircleIcon size={40} className="text-[#4ade80]" />
            </div>
            <h1 className="text-xl font-bold text-[#18181b]">
              {(course.price ?? 0) === 0 ? '수강신청이 완료되었습니다!' : '결제가 완료되었습니다!'}
            </h1>
            <p className="text-sm text-[#6b6b7b]">잠시 후 강의 페이지로 이동합니다...</p>
            <SpinnerIcon size={20} className="text-[#e9a000] mx-auto" />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const isFree = (course.price ?? 0) === 0;
  const catColors = CATEGORY_COLORS[course.category];
  const instructorName = course.instructor?.nickname ?? course.instructorNickname ?? '—';

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f4f8]">
      <Header />

      <main className="flex-1 py-12 px-4">
        {/* Breadcrumb */}
        <nav className="max-w-3xl mx-auto flex items-center gap-2 text-sm text-[#9898a8] mb-8 animate-fade-in">
          <Link href={`/courses/${courseId}`} className="hover:text-[#6b6b7b] transition-colors duration-150 flex items-center gap-1">
            <ChevronLeftIcon size={14} />
            강의 상세
          </Link>
          <ChevronLeftIcon size={14} className="rotate-180" />
          <span className="text-[#6b6b7b]">결제</span>
        </nav>

        <div className="max-w-3xl mx-auto grid md:grid-cols-5 gap-6 animate-fade-in-up">
          {/* Left: Payment Form */}
          <div className="md:col-span-3 space-y-5">
            <div>
              <h1 className="text-xl font-bold text-[#18181b]">
                {isFree ? '무료 수강신청' : '결제하기'}
              </h1>
              <p className="text-sm text-[#9898a8] mt-1">
                {isFree ? '무료 강의를 바로 수강할 수 있습니다' : '안전한 결제로 강의를 시작하세요'}
              </p>
            </div>

            {/* Payment method selector — only for paid */}
            {!isFree && (
              <div className="bg-[#ffffff] border border-[#e2e2ea] rounded-xl p-5 space-y-3 shadow-sm">
                <p className="text-sm font-semibold text-[#18181b]">결제 수단</p>
                <div className="space-y-2">
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMethod(m.id)}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all duration-150 ${
                        selectedMethod === m.id
                          ? 'border-[#e9a000] bg-[#f0f0f8]'
                          : 'border-[#e2e2ea] bg-[#f8f8fc] hover:border-[#d0d0dc]'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        selectedMethod === m.id ? 'border-[#e9a000]' : 'border-[#9898a8]'
                      }`}>
                        {selectedMethod === m.id && (
                          <div className="w-2 h-2 rounded-full bg-[#e9a000]" />
                        )}
                      </div>
                      <span className="text-lg">{m.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#18181b]">{m.label}</p>
                        <p className="text-xs text-[#9898a8]">{m.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Purchaser info */}
            <div className="bg-[#ffffff] border border-[#e2e2ea] rounded-xl p-5 space-y-3 shadow-sm">
              <p className="text-sm font-semibold text-[#18181b]">주문자 정보</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#9898a8]">이름</span>
                  <span className="text-[#18181b]">{user?.nickname}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9898a8]">이메일</span>
                  <span className="text-[#18181b]">{user?.email}</span>
                </div>
              </div>
            </div>

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="mt-0.5 relative">
                <input
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-150 ${
                  agreedTerms ? 'bg-[#e9a000] border-[#e9a000]' : 'border-[#9898a8] group-hover:border-[#6b6b7b]'
                }`}>
                  {agreedTerms && (
                    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#0a0a0d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-sm text-[#6b6b7b]">
                이용약관 및 개인정보 처리방침에 동의합니다. 디지털 콘텐츠의 특성상 수강 시작 후에는 환불이 제한될 수 있습니다.
              </span>
            </label>

            {/* Error */}
            {paymentError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#fee2e2] border border-[#fecaca] text-[#f87171] text-sm">
                <AlertCircleIcon size={15} />
                {paymentError}
              </div>
            )}

            {/* Submit */}
            <button
              type="button"
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-[#e9a000] text-[#0a0a0d] font-bold text-base hover:bg-[#cc8e00] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
            >
              {isProcessing ? (
                <>
                  <SpinnerIcon size={18} />
                  처리 중...
                </>
              ) : isFree ? (
                <>
                  <BookOpenIcon size={18} />
                  무료 수강신청
                </>
              ) : (
                `₩${(course.price ?? 0).toLocaleString()} 결제하기`
              )}
            </button>
          </div>

          {/* Right: Order Summary */}
          <div className="md:col-span-2">
            <div className="bg-[#ffffff] border border-[#e2e2ea] rounded-xl p-5 space-y-4 sticky top-[76px] shadow-sm">
              <p className="text-sm font-semibold text-[#18181b]">주문 요약</p>

              {/* Course thumbnail */}
              <div className="flex gap-3">
                <div className="w-20 h-14 rounded-lg overflow-hidden bg-[#f0f0f8] border border-[#e2e2ea] shrink-0">
                  {course.thumbnailUrl ? (
                    <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: catColors.bg }}>
                      <span className="text-xs font-semibold" style={{ color: catColors.text }}>
                        {CATEGORY_LABELS[course.category]}
                      </span>
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#18181b] line-clamp-2 leading-snug">{course.title}</p>
                  <p className="text-xs text-[#9898a8] mt-0.5">{instructorName}</p>
                  <span
                    className="inline-block mt-1 text-xs font-semibold px-1.5 py-0.5 rounded border"
                    style={{ color: catColors.text, borderColor: catColors.border, background: catColors.bg }}
                  >
                    {CATEGORY_LABELS[course.category]}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-[#e2e2ea] space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#9898a8]">강의 가격</span>
                  <span className="text-[#18181b]">
                    {isFree ? '무료' : `₩${(course.price ?? 0).toLocaleString()}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#9898a8]">할인</span>
                  <span className="text-[#4ade80]">-₩0</span>
                </div>
              </div>

              <div className="pt-4 border-t border-[#e2e2ea] flex justify-between items-center">
                <span className="text-sm font-semibold text-[#18181b]">총 결제금액</span>
                <span className="text-xl font-bold text-[#e9a000]">
                  {isFree ? '무료' : `₩${(course.price ?? 0).toLocaleString()}`}
                </span>
              </div>

              {!isFree && (
                <p className="text-xs text-[#9898a8] text-center">
                  결제 완료 후 즉시 수강이 시작됩니다
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
