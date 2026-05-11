'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { courseService } from '@/lib/api';
import { Course } from '@/lib/api/types';
import { useAuth } from '@/lib/context/AuthContext';
import { SpinnerIcon, AlertCircleIcon, ChevronLeftIcon, AwardIcon } from '@/components/Icons';

function PrintIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function formatCompletionDate(dateStr?: string) {
  const d = dateStr ? new Date(dateStr) : new Date();
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function CertificatePage() {
  const params = useParams();
  const courseId = parseInt(params.courseId as string);
  const { user, isLoggedIn } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completionDate, setCompletionDate] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const data = await courseService.getCourseById(courseId);
        setCourse(data);
        // Try to get enrollment completion date
        try {
          const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/enrollments/my?page=0&size=100`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (res.ok) {
            const d = await res.json();
            const list = d?.data?.content ?? d?.data ?? d?.content ?? [];
            const enrollment = list.find((e: any) => e.courseId === courseId);
            if (enrollment?.completedAt) {
              setCompletionDate(formatCompletionDate(enrollment.completedAt));
            } else {
              setCompletionDate(formatCompletionDate());
            }
          } else {
            setCompletionDate(formatCompletionDate());
          }
        } catch {
          setCompletionDate(formatCompletionDate());
        }
      } catch (err: any) {
        setError(err.message || '강의 정보를 불러오는데 실패했습니다');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [courseId]);

  const handleDownload = () => {
    window.print();
  };

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
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
            <h1 className="text-lg font-semibold text-[#18181b] mb-2">수료증을 불러올 수 없습니다</h1>
            <p className="text-sm text-[#9898a8] mb-6">{error}</p>
            <Link href="/my-courses" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e9a000] text-[#0a0a0d] text-sm font-semibold hover:bg-[#cc8e00] transition-all duration-150">
              <ChevronLeftIcon size={16} />내 강의실로
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const studentName = user?.nickname ?? '수강생';

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f4f8]">
      <Header />

      <main className="flex-1 py-12 px-4">
        {/* Breadcrumb */}
        <nav className="max-w-3xl mx-auto flex items-center gap-2 text-sm text-[#9898a8] mb-8 animate-fade-in print:hidden">
          <Link href="/my-courses" className="hover:text-[#6b6b7b] transition-colors duration-150 flex items-center gap-1">
            <ChevronLeftIcon size={14} />
            내 강의실
          </Link>
          <ChevronLeftIcon size={14} className="rotate-180" />
          <span className="text-[#6b6b7b]">수료증</span>
        </nav>

        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up">
          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 print:hidden">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#e2e2ea] text-sm text-[#6b6b7b] hover:text-[#18181b] hover:border-[#d0d0dc] hover:bg-[#f0f0f8] transition-all duration-150"
            >
              <ShareIcon />
              {copied ? '복사됨!' : '공유하기'}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#e9a000] text-[#0a0a0d] text-sm font-semibold hover:bg-[#cc8e00] transition-all duration-150"
            >
              <PrintIcon />
              다운로드
            </button>
          </div>

          {/* Certificate Card */}
          <div
            id="certificate"
            className="relative bg-[#ffffff] rounded-2xl overflow-hidden"
            style={{
              border: '2px solid #e9a000',
              boxShadow: '0 0 60px rgba(233,160,0,0.15), 0 0 0 6px rgba(233,160,0,0.08)',
            }}
          >
            {/* Decorative corner ornaments */}
            <div className="absolute top-4 left-4 w-10 h-10 opacity-30" aria-hidden="true">
              <svg viewBox="0 0 40 40" fill="none">
                <path d="M2 2 L2 16 M2 2 L16 2" stroke="#e9a000" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div className="absolute top-4 right-4 w-10 h-10 opacity-30" aria-hidden="true">
              <svg viewBox="0 0 40 40" fill="none">
                <path d="M38 2 L38 16 M38 2 L24 2" stroke="#e9a000" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div className="absolute bottom-4 left-4 w-10 h-10 opacity-30" aria-hidden="true">
              <svg viewBox="0 0 40 40" fill="none">
                <path d="M2 38 L2 24 M2 38 L16 38" stroke="#e9a000" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div className="absolute bottom-4 right-4 w-10 h-10 opacity-30" aria-hidden="true">
              <svg viewBox="0 0 40 40" fill="none">
                <path d="M38 38 L38 24 M38 38 L24 38" stroke="#e9a000" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>

            {/* Inner gold border */}
            <div className="absolute inset-3 rounded-xl border border-[#e9a000] opacity-20 pointer-events-none" aria-hidden="true" />

            {/* Content */}
            <div className="relative px-10 py-14 text-center space-y-8">
              {/* Logo / Brand */}
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-lg bg-[#e9a000] flex items-center justify-center">
                      <span className="text-[#0a0a0d] font-bold text-xs">S</span>
                    </div>
                    <span className="text-lg font-bold text-[#e9a000] tracking-wide">StockClass</span>
                  </div>
                </div>
                <div className="h-px bg-gradient-to-r from-transparent via-[#e9a000] to-transparent opacity-40" />
              </div>

              {/* Certificate title */}
              <div className="space-y-1">
                <p className="text-xs font-semibold tracking-[0.3em] text-[#6b6b7b] uppercase">Certificate of Completion</p>
                <h1 className="text-3xl font-bold text-[#18181b]">수 료 증</h1>
              </div>

              {/* Trophy icon */}
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-[#f0f0f8] border-2 border-[#e9a000] flex items-center justify-center" style={{ boxShadow: '0 0 24px rgba(233,160,0,0.25)' }}>
                  <AwardIcon size={40} className="text-[#e9a000]" />
                </div>
              </div>

              {/* Recipient */}
              <div className="space-y-2">
                <p className="text-sm text-[#9898a8]">이 수료증은</p>
                <p className="text-4xl font-bold text-[#18181b]" style={{ textShadow: '0 0 30px rgba(242,242,245,0.15)' }}>
                  {studentName}
                </p>
                <p className="text-sm text-[#6b6b7b]">님에게 드립니다</p>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4 max-w-xs mx-auto">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#e9a000] opacity-30" />
                <svg width={16} height={16} viewBox="0 0 24 24" fill="#e9a000" opacity="0.6" aria-hidden="true">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[#e9a000] opacity-30" />
              </div>

              {/* Course info */}
              <div className="space-y-2 max-w-lg mx-auto">
                <p className="text-sm text-[#9898a8]">아래 강의 과정을 성공적으로 완료하였음을 증명합니다</p>
                <div className="bg-[#f0f0f8] border border-[#e2e2ea] rounded-xl px-6 py-4">
                  <p className="text-xl font-bold text-[#e9a000] leading-snug">{course.title}</p>
                  <p className="text-sm text-[#9898a8] mt-1">
                    강사: {course.instructor?.nickname ?? course.instructorNickname ?? '—'}
                  </p>
                </div>
              </div>

              {/* Date */}
              <div className="space-y-1">
                <p className="text-sm text-[#9898a8]">수료일</p>
                <p className="text-base font-semibold text-[#6b6b7b]">{completionDate}</p>
              </div>

              {/* Footer divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-[#e9a000] to-transparent opacity-20" />

              {/* Signature area */}
              <div className="flex items-center justify-center gap-8">
                <div className="text-center">
                  <div className="h-8 flex items-end justify-center mb-1">
                    <span className="text-lg font-bold text-[#e9a000]" style={{ fontFamily: 'serif', fontStyle: 'italic' }}>StockClass</span>
                  </div>
                  <div className="h-px w-32 bg-[#e2e2ea]" />
                  <p className="text-xs text-[#9898a8] mt-1">StockClass 플랫폼</p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 print:hidden">
            <Link
              href={`/courses/${courseId}`}
              className="text-sm text-[#6b6b7b] hover:text-[#18181b] transition-colors duration-150"
            >
              강의 페이지로
            </Link>
            <span className="text-[#e2e2ea]">·</span>
            <Link
              href="/my-courses"
              className="text-sm text-[#6b6b7b] hover:text-[#18181b] transition-colors duration-150"
            >
              내 강의실로
            </Link>
          </div>
        </div>
      </main>

      <Footer />

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body { background: white !important; }
          header, footer, nav, .print\\:hidden { display: none !important; }
          #certificate {
            border-color: #b8860b !important;
            box-shadow: none !important;
            background: white !important;
            color: #1a1a1a !important;
          }
        }
      `}</style>
    </div>
  );
}
