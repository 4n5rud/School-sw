'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { courseService, enrollmentService } from '@/lib/api';
import { apiClient } from '@/lib/api/client';
import { Course, CATEGORY_LABELS, CategoryType } from '@/lib/api/types';
import { useAuth } from '@/lib/context/AuthContext';
import {
  UsersIcon, TagIcon, ChevronLeftIcon, BookOpenIcon,
  SpinnerIcon, AlertCircleIcon, CheckCircleIcon, ChevronDownIcon, ChevronUpIcon,
} from '@/components/Icons';

const CATEGORY_COLORS: Record<CategoryType, { text: string; bg: string; border: string }> = {
  DOMESTIC_STOCK: { text: '#60a5fa', bg: '#dbeafe', border: '#bfdbfe' },
  OVERSEAS_STOCK: { text: '#2dd4bf', bg: '#ccfbf1', border: '#99f6e4' },
  CRYPTO:         { text: '#fbbf24', bg: '#fef3c7', border: '#fde68a' },
  NFT:            { text: '#c084fc', bg: '#f3e8ff', border: '#e9d5ff' },
  ETF:            { text: '#4ade80', bg: '#dcfce7', border: '#bbf7d0' },
  FUTURES:        { text: '#f87171', bg: '#fee2e2', border: '#fecaca' },
};

// ── Types ──────────────────────────────────────────────────────────────────
interface Review {
  id: number;
  reviewerNickname: string;
  rating: number;
  content: string;
  createdAt: string;
}

interface ReviewSummary {
  averageRating: number;
  totalCount: number;
  distribution: Record<string, number>; // "5": 10, "4": 5, ...
}

interface Question {
  id: number;
  title: string;
  content: string;
  authorNickname: string;
  createdAt: string;
  isAnswered: boolean;
  answer?: string;
  answeredAt?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function StarDisplay({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} width={size} height={size} viewBox="0 0 24 24" fill={s <= rating ? '#e9a000' : 'none'} stroke={s <= Math.round(rating) ? '#e9a000' : '#9898a8'} strokeWidth="1.5" aria-hidden="true">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </span>
  );
}

function StarSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <span className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110"
        >
          <svg width={24} height={24} viewBox="0 0 24 24" fill={s <= (hovered || value) ? '#e9a000' : 'none'} stroke={s <= (hovered || value) ? '#e9a000' : '#9898a8'} strokeWidth="1.5" aria-hidden="true">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>
      ))}
    </span>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill={filled ? '#e9a000' : 'none'} stroke={filled ? '#e9a000' : '#6b6b7b'} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
}

function SkeletonDetail() {
  return (
    <div className="min-h-screen bg-[#f4f4f8]">
      <div className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="aspect-video skeleton rounded-2xl" />
          <div className="space-y-3">
            <div className="h-8 skeleton rounded-xl w-3/4" />
            <div className="h-4 skeleton rounded w-full" />
            <div className="h-4 skeleton rounded w-2/3" />
          </div>
        </div>
        <div className="h-64 skeleton rounded-2xl" />
      </div>
    </div>
  );
}

// ── Review Section ─────────────────────────────────────────────────────────
function ReviewSection({
  courseId,
  isLoggedIn,
  isEnrolled,
  userRole,
}: {
  courseId: number;
  isLoggedIn: boolean;
  isEnrolled: boolean;
  userRole?: string;
}) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [formRating, setFormRating] = useState(5);
  const [formContent, setFormContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');

  const loadReviews = useCallback(async () => {
    try {
      setIsLoading(true);
      const [reviewsRes, summaryRes] = await Promise.allSettled([
        (apiClient as any).makeRequestPublic?.(`/courses/${courseId}/reviews`) ??
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/courses/${courseId}/reviews`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}` },
          }).then((r) => r.json()),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/courses/${courseId}/reviews/summary`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}` },
        }).then((r) => r.json()),
      ]);

      if (reviewsRes.status === 'fulfilled') {
        const d = reviewsRes.value;
        const list: Review[] = d?.data?.content ?? d?.data ?? d?.content ?? (Array.isArray(d) ? d : []);
        setReviews(list);
        if (isLoggedIn) {
          const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
          if (token) {
            // find my review from list by checking current user
            // We rely on the server returning it among reviews; we'll detect via a separate attempt
          }
        }
      }
      if (summaryRes.status === 'fulfilled') {
        const d = summaryRes.value;
        const sd = d?.data ?? d;
        setSummary({
          averageRating: sd?.averageRating ?? 0,
          totalCount: sd?.totalCount ?? sd?.reviewCount ?? 0,
          distribution: sd?.ratingDistribution ?? sd?.distribution ?? sd?.ratingCounts ?? {},
        });
      }
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, [courseId, isLoggedIn]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formContent.length < 10) {
      setSubmitMsg('리뷰는 최소 10자 이상 작성해주세요');
      return;
    }
    setSubmitting(true);
    setSubmitMsg('');
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const method = myReview ? 'PUT' : 'POST';
      const url = myReview
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/courses/${courseId}/reviews/${myReview.id}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/courses/${courseId}/reviews`;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rating: formRating, content: formContent }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || '리뷰 등록에 실패했습니다');
      }
      setSubmitMsg('리뷰가 등록되었습니다');
      setShowForm(false);
      loadReviews();
    } catch (err: any) {
      setSubmitMsg(err.message || '리뷰 등록에 실패했습니다');
    } finally {
      setSubmitting(false);
    }
  };

  const canWriteReview = isLoggedIn && isEnrolled && userRole === 'STUDENT';

  const maxCount = summary
    ? Math.max(1, ...Object.values(summary.distribution))
    : 1;

  return (
    <section className="bg-[#ffffff] border border-[#e2e2ea] rounded-xl p-5 space-y-5">
      <h2 className="text-base font-semibold text-[#18181b]">수강생 리뷰</h2>

      {/* Summary */}
      {summary && (
        <div className="flex flex-col sm:flex-row gap-5 pb-5 border-b border-[#e2e2ea]">
          <div className="flex flex-col items-center justify-center gap-1 min-w-[100px]">
            <span className="text-4xl font-bold text-[#e9a000]">
              {summary.averageRating.toFixed(1)}
            </span>
            <StarDisplay rating={Math.round(summary.averageRating)} size={18} />
            <span className="text-xs text-[#9898a8]">{summary.totalCount}개 리뷰</span>
          </div>

          <div className="flex-1 space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = summary.distribution[String(star)] ?? (summary.distribution as any)[star] ?? 0;
              const pct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-xs text-[#9898a8]">
                  <span className="w-4 text-right">{star}</span>
                  <svg width={12} height={12} viewBox="0 0 24 24" fill="#e9a000" stroke="#e9a000" strokeWidth="1.5" aria-hidden="true">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  <div className="flex-1 bg-[#f0f0f8] rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-[#e9a000] rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Write / Edit form */}
      {canWriteReview && (
        <div>
          {!showForm ? (
            <button
              onClick={() => {
                if (myReview) {
                  setFormRating(myReview.rating);
                  setFormContent(myReview.content);
                }
                setShowForm(true);
              }}
              className="text-sm px-4 py-2 rounded-lg border border-[#e2e2ea] text-[#e9a000] hover:bg-[#f0f0f8] transition-all duration-150"
            >
              {myReview ? '리뷰 수정' : '리뷰 작성'}
            </button>
          ) : (
            <form onSubmit={handleSubmitReview} className="space-y-3 p-4 bg-[#f0f0f8] rounded-xl border border-[#e2e2ea]">
              <p className="text-sm font-medium text-[#18181b]">{myReview ? '리뷰 수정' : '리뷰 작성'}</p>
              <StarSelector value={formRating} onChange={setFormRating} />
              <textarea
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                placeholder="강의에 대한 솔직한 리뷰를 남겨주세요 (최소 10자)"
                rows={3}
                className="w-full bg-[#ffffff] border border-[#e2e2ea] rounded-lg px-3 py-2 text-sm text-[#18181b] placeholder-[#9898a8] resize-none focus:outline-none focus:border-[#e9a000] transition-colors duration-150"
              />
              {submitMsg && (
                <p className={`text-xs ${submitMsg.includes('등록') ? 'text-[#4ade80]' : 'text-[#f87171]'}`}>{submitMsg}</p>
              )}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#e9a000] text-[#0a0a0d] text-sm font-semibold hover:bg-[#cc8e00] disabled:opacity-50 transition-all duration-150"
                >
                  {submitting && <SpinnerIcon size={14} />}
                  {myReview ? '수정 완료' : '등록'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setSubmitMsg(''); }}
                  className="px-4 py-2 rounded-lg border border-[#e2e2ea] text-[#6b6b7b] text-sm hover:bg-[#f0f0f8] transition-all duration-150"
                >
                  취소
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Review list */}
      {isLoading ? (
        <div className="flex justify-center py-6">
          <SpinnerIcon size={24} className="text-[#e9a000]" />
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-[#9898a8] text-center py-6">아직 리뷰가 없습니다</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-[#f0f0f8] border border-[#e2e2ea] flex items-center justify-center text-xs font-bold text-[#e9a000] shrink-0">
                {(r.reviewerNickname ?? '?').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-[#18181b]">{r.reviewerNickname}</span>
                  <StarDisplay rating={r.rating} size={13} />
                  <span className="text-xs text-[#9898a8]">{formatDate(r.createdAt)}</span>
                </div>
                <p className="text-sm text-[#6b6b7b] mt-1 leading-relaxed">{r.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ── Q&A Section ────────────────────────────────────────────────────────────
function QnASection({
  courseId,
  isLoggedIn,
  isEnrolled,
}: {
  courseId: number;
  isLoggedIn: boolean;
  isEnrolled: boolean;
}) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');

  const loadQuestions = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/courses/${courseId}/questions`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (!res.ok) throw new Error();
      const d = await res.json();
      const list: Question[] = d?.data?.content ?? d?.data ?? d?.content ?? (Array.isArray(d) ? d : []);
      setQuestions(list);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) {
      setSubmitMsg('제목과 내용을 모두 입력해주세요');
      return;
    }
    setSubmitting(true);
    setSubmitMsg('');
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/courses/${courseId}/questions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ title: formTitle, content: formContent }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || '질문 등록에 실패했습니다');
      }
      setSubmitMsg('질문이 등록되었습니다');
      setFormTitle('');
      setFormContent('');
      setShowForm(false);
      loadQuestions();
    } catch (err: any) {
      setSubmitMsg(err.message || '질문 등록에 실패했습니다');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="bg-[#ffffff] border border-[#e2e2ea] rounded-xl p-5 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-[#18181b]">Q&amp;A</h2>
        {isLoggedIn && isEnrolled && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="text-sm px-4 py-2 rounded-lg border border-[#e2e2ea] text-[#e9a000] hover:bg-[#f0f0f8] transition-all duration-150"
          >
            질문하기
          </button>
        )}
      </div>

      {/* Question form */}
      {showForm && (
        <form onSubmit={handleSubmitQuestion} className="space-y-3 p-4 bg-[#f0f0f8] rounded-xl border border-[#e2e2ea]">
          <p className="text-sm font-medium text-[#18181b]">질문 작성</p>
          <input
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            placeholder="질문 제목"
            className="w-full bg-[#ffffff] border border-[#e2e2ea] rounded-lg px-3 py-2 text-sm text-[#18181b] placeholder-[#9898a8] focus:outline-none focus:border-[#e9a000] transition-colors duration-150"
          />
          <textarea
            value={formContent}
            onChange={(e) => setFormContent(e.target.value)}
            placeholder="질문 내용을 자세히 작성해주세요"
            rows={4}
            className="w-full bg-[#ffffff] border border-[#e2e2ea] rounded-lg px-3 py-2 text-sm text-[#18181b] placeholder-[#9898a8] resize-none focus:outline-none focus:border-[#e9a000] transition-colors duration-150"
          />
          {submitMsg && (
            <p className={`text-xs ${submitMsg.includes('등록') ? 'text-[#4ade80]' : 'text-[#f87171]'}`}>{submitMsg}</p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#e9a000] text-[#0a0a0d] text-sm font-semibold hover:bg-[#cc8e00] disabled:opacity-50 transition-all duration-150"
            >
              {submitting && <SpinnerIcon size={14} />}
              등록
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setSubmitMsg(''); }}
              className="px-4 py-2 rounded-lg border border-[#e2e2ea] text-[#6b6b7b] text-sm hover:bg-[#f0f0f8] transition-all duration-150"
            >
              취소
            </button>
          </div>
        </form>
      )}

      {/* Question list */}
      {isLoading ? (
        <div className="flex justify-center py-6">
          <SpinnerIcon size={24} className="text-[#e9a000]" />
        </div>
      ) : questions.length === 0 ? (
        <p className="text-sm text-[#9898a8] text-center py-6">아직 질문이 없습니다</p>
      ) : (
        <div className="space-y-2">
          {questions.map((q) => (
            <div key={q.id} className="border border-[#e2e2ea] rounded-xl overflow-hidden">
              <button
                type="button"
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-[#f0f0f8] transition-colors duration-150"
                onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded ${
                      q.isAnswered
                        ? 'bg-[#dcfce7] text-[#4ade80] border border-[#bbf7d0]'
                        : 'bg-[#fee2e2] text-[#f87171] border border-[#fecaca]'
                    }`}
                  >
                    {q.isAnswered ? '답변완료' : '대기중'}
                  </span>
                  <span className="text-sm font-medium text-[#18181b] line-clamp-1">{q.title}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-[#9898a8] hidden sm:block">{formatDate(q.createdAt)}</span>
                  {expandedId === q.id ? (
                    <ChevronUpIcon size={15} className="text-[#9898a8]" />
                  ) : (
                    <ChevronDownIcon size={15} className="text-[#9898a8]" />
                  )}
                </div>
              </button>

              {expandedId === q.id && (
                <div className="px-4 pb-4 space-y-3 border-t border-[#e2e2ea]">
                  <div className="pt-3">
                    <p className="text-xs text-[#9898a8] mb-1">{q.authorNickname} · {formatDate(q.createdAt)}</p>
                    <p className="text-sm text-[#6b6b7b] leading-relaxed whitespace-pre-wrap">{q.content}</p>
                  </div>
                  {q.isAnswered && q.answer && (
                    <div className="bg-[#f0f0f8] border border-[#e2e2ea] rounded-lg p-3">
                      <p className="text-xs font-semibold text-[#e9a000] mb-1.5">강사 답변</p>
                      <p className="text-sm text-[#6b6b7b] leading-relaxed whitespace-pre-wrap">{q.answer}</p>
                      {q.answeredAt && (
                        <p className="text-xs text-[#9898a8] mt-1">{formatDate(q.answeredAt)}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function CourseDetailPage() {
  const params = useParams();
  const courseId = parseInt(params.id as string);
  const { user, isLoggedIn } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollMessage, setEnrollMessage] = useState('');

  // Wishlist
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const data = await courseService.getCourseById(courseId);
        setCourse(data);

        if (isLoggedIn) {
          const enrollments = await enrollmentService.getMyEnrollments(0, 100);
          let list: any[] = [];
          if ((enrollments as any).data?.content) list = (enrollments as any).data.content;
          else if ((enrollments as any).content) list = (enrollments as any).content;
          else if (Array.isArray(enrollments)) list = enrollments as any[];
          setIsEnrolled(list.some((e: any) =>
            Number(e.courseId) === courseId || Number(e.course?.id) === courseId
          ));

          // Wishlist status — load full wishlist and check membership
          try {
            const wRes = await apiClient.getMyWishlist();
            const wList: any[] = (wRes as any).data ?? wRes ?? [];
            const actualList = Array.isArray(wList) ? wList : (wList?.content ?? []);
            setIsWishlisted(actualList.some((item: any) => Number(item.courseId) === courseId));
          } catch {
            // silent
          }
        }
      } catch (err: any) {
        setError(err.message || '강의를 불러오는데 실패했습니다');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [courseId, isLoggedIn]);

  const handleEnroll = async () => {
    if (!isLoggedIn) {
      window.location.href = '/auth/login';
      return;
    }
    try {
      setIsEnrolling(true);
      await enrollmentService.enrollCourse(courseId);
      setIsEnrolled(true);
      setEnrollMessage('수강 등록이 완료되었습니다');
    } catch (err: any) {
      setEnrollMessage(err.message || '수강신청에 실패했습니다');
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!isLoggedIn) {
      window.location.href = '/auth/login';
      return;
    }
    setWishlistLoading(true);
    // Optimistic toggle immediately
    setIsWishlisted((prev) => !prev);
    try {
      const token = localStorage.getItem('accessToken');
      const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
      const res = await fetch(`${BASE}/wishlist/${courseId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        // Revert optimistic update on failure
        setIsWishlisted((prev) => !prev);
        return;
      }
      // Re-confirm status via full wishlist
      try {
        const wRes = await apiClient.getMyWishlist();
        const wList: any[] = (wRes as any).data ?? wRes ?? [];
        const actualList = Array.isArray(wList) ? wList : (wList?.content ?? []);
        setIsWishlisted(actualList.some((item: any) => Number(item.courseId) === courseId));
      } catch {
        // keep optimistic state
      }
    } catch {
      // Revert optimistic update on network error
      setIsWishlisted((prev) => !prev);
    } finally {
      setWishlistLoading(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <SkeletonDetail />
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
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e9a000] text-[#0a0a0d] text-sm font-semibold hover:bg-[#cc8e00] transition-all duration-150"
            >
              <ChevronLeftIcon size={16} />
              홈으로
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const catColors = CATEGORY_COLORS[course.category];
  const instructorName = course.instructor?.nickname ?? course.instructorNickname ?? '—';
  const instructorId = course.instructor?.id ?? course.instructorId;
  const enrollCount = course.studentCount ?? course.enrollmentCount;
  const isTeacher = user?.role === 'TEACHER';

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f4f8]">
      <Header />

      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-[#9898a8] mb-8 animate-fade-in">
            <Link href="/" className="hover:text-[#6b6b7b] transition-colors duration-150">홈</Link>
            <ChevronLeftIcon size={14} className="rotate-180" />
            <span className="text-[#6b6b7b] line-clamp-1">{course.title}</span>
          </nav>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="md:col-span-2 space-y-6 animate-fade-in-up">
              {/* Thumbnail */}
              <div className="aspect-video rounded-2xl overflow-hidden bg-[#ffffff] border border-[#e2e2ea]">
                {course.thumbnailUrl ? (
                  <img
                    src={course.thumbnailUrl}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ background: catColors.bg }}
                  >
                    <span
                      className="text-lg font-semibold px-4 py-2 rounded-xl border"
                      style={{ color: catColors.text, borderColor: catColors.border }}
                    >
                      {CATEGORY_LABELS[course.category]}
                    </span>
                  </div>
                )}
              </div>

              {/* Title & Meta */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg border"
                    style={{ color: catColors.text, borderColor: catColors.border, background: catColors.bg }}
                  >
                    {CATEGORY_LABELS[course.category]}
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-[#18181b] leading-tight">
                  {course.title}
                </h1>
                <p className="text-[#6b6b7b] leading-relaxed">{course.description}</p>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {enrollCount !== undefined && (
                  <div className="bg-[#ffffff] border border-[#e2e2ea] rounded-xl p-4">
                    <p className="text-xs text-[#9898a8] mb-1">수강생</p>
                    <p className="text-xl font-bold text-[#18181b]">
                      {(enrollCount ?? 0).toLocaleString()}
                    </p>
                  </div>
                )}
                <div className="bg-[#ffffff] border border-[#e2e2ea] rounded-xl p-4">
                  <p className="text-xs text-[#9898a8] mb-1">카테고리</p>
                  <p className="text-sm font-semibold" style={{ color: catColors.text }}>
                    {CATEGORY_LABELS[course.category]}
                  </p>
                </div>
                <div className="bg-[#ffffff] border border-[#e2e2ea] rounded-xl p-4">
                  <p className="text-xs text-[#9898a8] mb-1">가격</p>
                  <p className="text-xl font-bold text-[#e9a000]">
                    {(course.price ?? 0) === 0 ? '무료' : `₩${(course.price ?? 0).toLocaleString()}`}
                  </p>
                </div>
              </div>

              {/* Instructor */}
              <div className="bg-[#ffffff] border border-[#e2e2ea] rounded-xl p-5">
                <p className="text-xs font-semibold text-[#9898a8] uppercase tracking-wider mb-3">강사</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#e9a000] flex items-center justify-center text-[#0a0a0d] text-sm font-bold shrink-0">
                    {instructorName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#18181b]">{instructorName}</p>
                    <p className="text-xs text-[#9898a8]">전문 강사</p>
                  </div>
                  {instructorId && (
                    <Link
                      href={`/instructor/${instructorId}`}
                      className="text-xs px-3 py-1.5 rounded-lg border border-[#e2e2ea] text-[#6b6b7b] hover:text-[#18181b] hover:border-[#d0d0dc] transition-all duration-150 shrink-0"
                    >
                      프로필 보기
                    </Link>
                  )}
                </div>
              </div>

              {/* Reviews */}
              <ReviewSection
                courseId={courseId}
                isLoggedIn={isLoggedIn}
                isEnrolled={isEnrolled}
                userRole={user?.role}
              />

              {/* Q&A */}
              <QnASection
                courseId={courseId}
                isLoggedIn={isLoggedIn}
                isEnrolled={isEnrolled}
              />
            </div>

            {/* Right Column: Action Panel */}
            <div className="animate-fade-in-up stagger-2">
              <div className="bg-[#ffffff] border border-[#e2e2ea] rounded-2xl p-6 sticky top-[76px] space-y-5">
                {/* Price */}
                <div className="text-center pb-4 border-b border-[#e2e2ea]">
                  <p className="text-xs text-[#9898a8] mb-1">강의 가격</p>
                  <p className="text-3xl font-bold text-[#e9a000]">
                    {(course.price ?? 0) === 0 ? '무료' : `₩${(course.price ?? 0).toLocaleString()}`}
                  </p>
                </div>

                {/* Wishlist button */}
                {!isTeacher && (
                  <button
                    onClick={handleToggleWishlist}
                    disabled={wishlistLoading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#e2e2ea] text-sm font-medium text-[#6b6b7b] hover:border-[#d0d0dc] hover:bg-[#f0f0f8] disabled:opacity-50 transition-all duration-150"
                  >
                    {wishlistLoading ? (
                      <SpinnerIcon size={16} />
                    ) : (
                      <HeartIcon filled={isWishlisted} />
                    )}
                    <span style={{ color: isWishlisted ? '#e9a000' : undefined }}>
                      {isWishlisted ? '찜 취소' : '찜하기'}
                    </span>
                  </button>
                )}

                {/* Enroll message */}
                {enrollMessage && (
                  <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${
                    isEnrolled
                      ? 'bg-[#dcfce7] border border-[#bbf7d0] text-[#4ade80]'
                      : 'bg-[#fee2e2] border border-[#fecaca] text-[#f87171]'
                  }`}>
                    {isEnrolled
                      ? <CheckCircleIcon size={15} />
                      : <AlertCircleIcon size={15} />
                    }
                    {enrollMessage}
                  </div>
                )}

                {/* Actions */}
                {isTeacher ? (
                  <div className="py-3 px-4 rounded-xl bg-[#f0f0f8] border border-[#e2e2ea] text-center">
                    <p className="text-xs text-[#9898a8]">강사 계정은 수강신청이 불가합니다</p>
                  </div>
                ) : isEnrolled ? (
                  <div className="space-y-3">
                    <Link
                      href={`/learning/${courseId}`}
                      className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-[#e9a000] text-[#0a0a0d] font-semibold text-sm hover:bg-[#cc8e00] transition-all duration-150"
                    >
                      <BookOpenIcon size={16} />
                      학습하기
                    </Link>
                    <p className="text-center text-xs text-[#9898a8]">수강 중인 강의입니다</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(course.price ?? 0) > 0 ? (
                      <Link
                        href={`/payment/${courseId}`}
                        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-[#e9a000] text-[#0a0a0d] font-semibold text-sm hover:bg-[#cc8e00] transition-all duration-150"
                      >
                        결제하고 수강하기
                      </Link>
                    ) : (
                      <button
                        onClick={handleEnroll}
                        disabled={isEnrolling}
                        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-[#f0f0f8] border border-[#e2e2ea] text-[#18181b] font-semibold text-sm hover:bg-[#e8e8f2] hover:border-[#d0d0dc] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isEnrolling ? (
                          <>
                            <SpinnerIcon size={16} />
                            처리 중...
                          </>
                        ) : '무료 수강신청'}
                      </button>
                    )}
                    <p className="text-center text-xs text-[#9898a8]">
                      {isLoggedIn ? '수강신청 후 즉시 학습 가능합니다' : '로그인 후 수강신청이 가능합니다'}
                    </p>
                  </div>
                )}

                {/* Info */}
                <div className="pt-4 border-t border-[#e2e2ea] space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#9898a8]">카테고리</span>
                    <span style={{ color: catColors.text }}>{CATEGORY_LABELS[course.category]}</span>
                  </div>
                  {enrollCount !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#9898a8]">수강생</span>
                      <span className="text-[#18181b]">{(enrollCount ?? 0).toLocaleString()}명</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-[#9898a8]">강사</span>
                    <span className="text-[#18181b]">{instructorName}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
