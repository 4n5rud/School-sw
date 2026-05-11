'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/context/AuthContext';
import { SpinnerIcon, AlertCircleIcon, CreditCardIcon } from '@/components/Icons';

interface Payment {
  id: number;
  orderId: string;
  courseId: number;
  courseTitle: string;
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
  paymentMethod?: string;
  paidAt?: string;
  createdAt: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  COMPLETED:  { label: '결제완료', color: '#4ade80', bg: '#dcfce7' },
  PENDING:    { label: '대기중',   color: '#fbbf24', bg: '#fef3c7' },
  CANCELLED:  { label: '취소',     color: '#f87171', bg: '#fee2e2' },
  REFUNDED:   { label: '환불',     color: '#c084fc', bg: '#f3e8ff' },
};

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export default function PaymentsPage() {
  const router = useRouter();
  const { isLoggedIn, isLoading: authLoading } = useAuth();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push('/auth/login');
    }
  }, [authLoading, isLoggedIn, router]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const load = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        const res = await fetch(`${BASE_URL}/payments`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('결제 내역을 불러오지 못했습니다');
        const body = await res.json();
        const data = body.data ?? [];
        setPayments(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [isLoggedIn]);

  if (authLoading || isLoading) {
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

  if (error) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-[#f4f4f8] flex items-center justify-center px-4">
          <div className="text-center">
            <AlertCircleIcon size={36} className="text-[#ef4444] mx-auto mb-3" />
            <p className="text-sm text-[#9898a8]">{error}</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const totalAmount = payments
    .filter((p) => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + (p.amount ?? 0), 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f4f8]">
      <Header />

      <main className="flex-1 py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8 animate-fade-in">
            <h1 className="text-xl font-bold text-[#18181b]">결제 내역</h1>
            <p className="text-sm text-[#9898a8] mt-1">총 {payments.length}건 · 누적 결제 ₩{totalAmount.toLocaleString()}</p>
          </div>

          {payments.length === 0 ? (
            <div className="text-center py-20 text-[#9898a8] animate-fade-in">
              <CreditCardIcon size={40} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm">결제 내역이 없습니다</p>
              <Link
                href="/"
                className="inline-block mt-4 text-sm text-[#e9a000] hover:text-[#cc8e00] transition-colors duration-150"
              >
                강의 둘러보기
              </Link>
            </div>
          ) : (
            <div className="space-y-3 animate-fade-in-up">
              {payments.map((payment) => {
                const st = STATUS_LABELS[payment.status] ?? STATUS_LABELS.PENDING;
                return (
                  <div
                    key={payment.id}
                    className="bg-[#ffffff] border border-[#e2e2ea] rounded-xl p-5 flex items-start gap-4 shadow-sm"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#f0f0f8] border border-[#e2e2ea] flex items-center justify-center shrink-0">
                      <CreditCardIcon size={18} className="text-[#6b6b7b]" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            href={`/courses/${payment.courseId}`}
                            className="text-sm font-semibold text-[#18181b] hover:text-[#e9a000] transition-colors duration-150 line-clamp-1"
                          >
                            {payment.courseTitle}
                          </Link>
                          <p className="text-xs text-[#9898a8] mt-0.5">
                            주문번호: {payment.orderId}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-base font-bold text-[#e9a000]">
                            {(payment.amount ?? 0) === 0 ? '무료' : `₩${(payment.amount ?? 0).toLocaleString()}`}
                          </p>
                          <span
                            className="inline-block text-xs font-semibold px-2 py-0.5 rounded mt-1"
                            style={{ color: st.color, background: st.bg }}
                          >
                            {st.label}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-2 text-xs text-[#9898a8]">
                        {payment.paymentMethod && (
                          <span>{payment.paymentMethod === 'CARD' ? '신용/체크카드' : '계좌이체'}</span>
                        )}
                        <span>
                          {new Date(payment.paidAt ?? payment.createdAt).toLocaleDateString('ko-KR', {
                            year: 'numeric', month: 'long', day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
