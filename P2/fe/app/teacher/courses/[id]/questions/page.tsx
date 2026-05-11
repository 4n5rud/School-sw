'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/context/AuthContext';
import { ChevronLeftIcon, SpinnerIcon, AlertCircleIcon, CheckCircleIcon } from '@/components/Icons';

interface Question {
  id: number;
  memberId: number;
  memberNickname: string;
  title: string;
  content: string;
  answer?: string;
  answeredAt?: string;
  isResolved: boolean;
  createdAt: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
}

export default function TeacherQuestionsPage() {
  const params = useParams();
  const courseId = parseInt(params.id as string);
  const { user } = useAuth();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [answerTexts, setAnswerTexts] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState<Record<number, boolean>>({});
  const [successIds, setSuccessIds] = useState<Set<number>>(new Set());

  const loadQuestions = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${BASE_URL}/courses/${courseId}/questions?size=50`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('질문 목록을 불러오지 못했습니다');
      const body = await res.json();
      const content = body.data?.content ?? body.data ?? [];
      setQuestions(Array.isArray(content) ? content : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadQuestions(); }, [courseId]);

  const handleAnswer = async (questionId: number) => {
    const text = (answerTexts[questionId] ?? '').trim();
    if (!text) return;

    setSubmitting((prev) => ({ ...prev, [questionId]: true }));
    try {
      const res = await fetch(`${BASE_URL}/courses/${courseId}/questions/${questionId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ answer: text }),
      });
      if (!res.ok) throw new Error('답변 등록에 실패했습니다');

      setSuccessIds((prev) => new Set([...prev, questionId]));
      setAnswerTexts((prev) => ({ ...prev, [questionId]: '' }));
      await loadQuestions();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting((prev) => ({ ...prev, [questionId]: false }));
    }
  };

  const unanswered = questions.filter((q) => !q.answer);
  const answered = questions.filter((q) => q.answer);

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

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f4f8]">
      <Header />

      <main className="flex-1 py-10 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-[#9898a8] mb-6 animate-fade-in">
            <Link href="/teacher/courses" className="hover:text-[#6b6b7b] transition-colors duration-150">
              내 강의
            </Link>
            <ChevronLeftIcon size={14} className="rotate-180" />
            <Link href={`/teacher/courses/${courseId}/manage`} className="hover:text-[#6b6b7b] transition-colors duration-150">
              강의 관리
            </Link>
            <ChevronLeftIcon size={14} className="rotate-180" />
            <span className="text-[#6b6b7b]">Q&A 관리</span>
          </nav>

          <div className="mb-8 animate-fade-in">
            <h1 className="text-xl font-bold text-[#18181b]">Q&A 관리</h1>
            <p className="text-sm text-[#9898a8] mt-1">
              미답변 {unanswered.length}개 · 답변 완료 {answered.length}개
            </p>
          </div>

          {questions.length === 0 ? (
            <div className="text-center py-20 text-[#9898a8] animate-fade-in">
              <p className="text-sm">아직 등록된 질문이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in-up">
              {/* Unanswered */}
              {unanswered.length > 0 && (
                <section>
                  <h2 className="text-sm font-semibold text-[#f87171] mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#f87171]" />
                    미답변 ({unanswered.length})
                  </h2>
                  <div className="space-y-3">
                    {unanswered.map((q) => (
                      <QuestionCard
                        key={q.id}
                        question={q}
                        expanded={expandedId === q.id}
                        onToggle={() => setExpandedId(expandedId === q.id ? null : q.id)}
                        answerText={answerTexts[q.id] ?? ''}
                        onAnswerChange={(t) => setAnswerTexts((prev) => ({ ...prev, [q.id]: t }))}
                        onSubmit={() => handleAnswer(q.id)}
                        isSubmitting={submitting[q.id] ?? false}
                        isSuccess={successIds.has(q.id)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Answered */}
              {answered.length > 0 && (
                <section>
                  <h2 className="text-sm font-semibold text-[#4ade80] mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#4ade80]" />
                    답변 완료 ({answered.length})
                  </h2>
                  <div className="space-y-3">
                    {answered.map((q) => (
                      <QuestionCard
                        key={q.id}
                        question={q}
                        expanded={expandedId === q.id}
                        onToggle={() => setExpandedId(expandedId === q.id ? null : q.id)}
                        answerText={answerTexts[q.id] ?? ''}
                        onAnswerChange={(t) => setAnswerTexts((prev) => ({ ...prev, [q.id]: t }))}
                        onSubmit={() => handleAnswer(q.id)}
                        isSubmitting={submitting[q.id] ?? false}
                        isSuccess={successIds.has(q.id)}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

interface QuestionCardProps {
  question: Question;
  expanded: boolean;
  onToggle: () => void;
  answerText: string;
  onAnswerChange: (t: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  isSuccess: boolean;
}

function QuestionCard({
  question, expanded, onToggle,
  answerText, onAnswerChange, onSubmit,
  isSubmitting, isSuccess,
}: QuestionCardProps) {
  const hasAnswer = !!question.answer;

  return (
    <div className="bg-[#ffffff] border border-[#e2e2ea] rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-[#f8f8fc] transition-colors duration-150"
      >
        <span className={`mt-0.5 text-xs font-semibold px-2 py-0.5 rounded shrink-0 ${
          hasAnswer ? 'bg-[#dcfce7] text-[#4ade80]' : 'bg-[#fee2e2] text-[#f87171]'
        }`}>
          {hasAnswer ? '답변완료' : '미답변'}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#18181b] line-clamp-1">{question.title}</p>
          <p className="text-xs text-[#9898a8] mt-0.5">{question.memberNickname} · {new Date(question.createdAt).toLocaleDateString('ko-KR')}</p>
        </div>
        <ChevronLeftIcon size={16} className={`text-[#9898a8] shrink-0 transition-transform duration-150 ${expanded ? 'rotate-90' : '-rotate-90'}`} />
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-[#e2e2ea]">
          {/* Question content */}
          <div className="pt-4">
            <p className="text-xs text-[#9898a8] font-semibold mb-1.5">질문 내용</p>
            <p className="text-sm text-[#2d2d3a] whitespace-pre-wrap leading-relaxed">{question.content}</p>
          </div>

          {/* Existing answer */}
          {hasAnswer && (
            <div className="bg-[#dcfce7] border border-[#bbf7d0] rounded-lg p-3">
              <p className="text-xs text-[#4ade80] font-semibold mb-1.5">내 답변</p>
              <p className="text-sm text-[#2d2d3a] whitespace-pre-wrap leading-relaxed">{question.answer}</p>
              {question.answeredAt && (
                <p className="text-xs text-[#9898a8] mt-2">{new Date(question.answeredAt).toLocaleDateString('ko-KR')}</p>
              )}
            </div>
          )}

          {/* Answer form */}
          <div className="space-y-2">
            <p className="text-xs text-[#9898a8] font-semibold">{hasAnswer ? '답변 수정' : '답변 작성'}</p>
            <textarea
              value={answerText}
              onChange={(e) => onAnswerChange(e.target.value)}
              placeholder={hasAnswer ? question.answer : '답변을 입력하세요...'}
              rows={4}
              className="w-full bg-[#f0f0f8] border border-[#e2e2ea] rounded-lg px-3 py-2.5 text-sm text-[#18181b] placeholder-[#9898a8] focus:outline-none focus:border-[#e9a000] resize-none transition-colors duration-150"
            />
            <div className="flex items-center justify-end gap-2">
              {isSuccess && (
                <span className="flex items-center gap-1 text-xs text-[#4ade80]">
                  <CheckCircleIcon size={13} />
                  답변이 등록되었습니다
                </span>
              )}
              <button
                type="button"
                onClick={onSubmit}
                disabled={isSubmitting || !answerText.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#e9a000] text-[#0a0a0d] text-sm font-semibold hover:bg-[#cc8e00] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
              >
                {isSubmitting ? <SpinnerIcon size={14} /> : null}
                {hasAnswer ? '수정하기' : '답변 등록'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
