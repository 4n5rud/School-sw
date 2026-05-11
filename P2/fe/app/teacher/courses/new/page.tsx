'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { teacherService } from '@/lib/api';
import { CategoryType, CATEGORY_LABELS, CourseCreateRequest } from '@/lib/api/types';
import { ChevronLeftIcon, SpinnerIcon, AlertCircleIcon, UploadIcon, ImageIcon } from '@/components/Icons';

const CATEGORIES: CategoryType[] = ['DOMESTIC_STOCK', 'OVERSEAS_STOCK', 'CRYPTO', 'NFT', 'ETF', 'FUTURES'];

export default function NewCoursePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tokenInfo, setTokenInfo] = useState<{ role: string; hasToken: boolean } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      const userStr = localStorage.getItem('user');
      let role = '없음';
      try { role = userStr ? JSON.parse(userStr).role : '없음'; } catch {}
      setTokenInfo({ role, hasToken: !!token });
      console.log('[NewCourse] 인증 상태:', { hasToken: !!token, tokenLen: token?.length, role });
    }
  }, []);
  const [form, setForm] = useState<CourseCreateRequest>({
    title: '',
    description: '',
    category: 'DOMESTIC_STOCK',
    price: 0,
  });
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [thumbPreview, setThumbPreview] = useState<string | null>(null);
  const [thumbState, setThumbState] = useState<'idle' | 'uploading' | 'confirming' | 'done' | 'error'>('idle');
  const [thumbMsg, setThumbMsg] = useState('');
  const thumbRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitLabel, setSubmitLabel] = useState('강의 생성하기');
  const [error, setError] = useState<string | null>(null);

  if (user && user.role !== 'TEACHER') {
    return (
      <div className="min-h-screen flex flex-col bg-[#f4f4f8]">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <AlertCircleIcon size={40} className="text-[#ef4444] mx-auto mb-4" />
            <p className="text-[#18181b] font-semibold mb-2">강사 권한이 필요합니다</p>
            <Link href="/" className="text-[#e9a000] text-sm hover:text-[#cc8e00]">홈으로</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleThumbFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setThumbState('error');
      setThumbMsg('JPG, PNG, WebP 형식만 가능합니다');
      if (thumbRef.current) thumbRef.current.value = '';
      return;
    }
    setThumbFile(file);
    setThumbState('idle');
    setThumbMsg('');
    const url = URL.createObjectURL(file);
    if (thumbPreview) URL.revokeObjectURL(thumbPreview);
    setThumbPreview(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || form.title.length < 3) {
      setError('강의 제목은 3자 이상 입력해주세요');
      return;
    }
    if (!form.description.trim() || form.description.length < 10) {
      setError('강의 설명은 10자 이상 입력해주세요');
      return;
    }
    if (form.price < 0) {
      setError('가격은 0 이상이어야 합니다');
      return;
    }
    try {
      setIsSubmitting(true);
      setError(null);

      setSubmitLabel('강의 생성 중...');
      const created = await teacherService.createCourse(form);

      if (thumbFile) {
        let uploadUrl: string;
        let objectKey: string;
        try {
          setSubmitLabel('썸네일 URL 발급 중...');
          setThumbState('uploading');
          const res = await teacherService.getThumbnailPresignedUrl({
            courseId: created.id,
            filename: thumbFile.name,
            contentType: thumbFile.type,
          });
          uploadUrl = res.uploadUrl;
          objectKey = res.objectKey;
        } catch (err: any) {
          setThumbState('error');
          setThumbMsg(`URL 발급 실패: ${err.message || '서버 오류'}`);
          router.push(`/teacher/courses/${created.id}/manage`);
          return;
        }

        try {
          setSubmitLabel('썸네일 업로드 중...');
          const r2Res = await fetch(uploadUrl, {
            method: 'PUT',
            body: thumbFile,
            headers: { 'Content-Type': thumbFile.type },
          });
          if (!r2Res.ok) throw new Error(`R2 응답 ${r2Res.status}`);
        } catch (err: any) {
          setThumbState('error');
          setThumbMsg(`업로드 실패: ${err.message || 'network error'}`);
          router.push(`/teacher/courses/${created.id}/manage`);
          return;
        }

        try {
          setSubmitLabel('썸네일 확인 중...');
          setThumbState('confirming');
          await teacherService.confirmThumbnailUpload({ courseId: created.id, objectKey });
          setThumbState('done');
        } catch (err: any) {
          setThumbState('error');
          setThumbMsg(`확인 실패: ${err.message || '서버 오류'}`);
          router.push(`/teacher/courses/${created.id}/manage`);
          return;
        }
      }

      router.push(`/teacher/courses/${created.id}/manage`);
    } catch (err: any) {
      setError(err.message || '강의 생성에 실패했습니다');
    } finally {
      setIsSubmitting(false);
      setSubmitLabel('강의 생성하기');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f4f8]">
      <Header />
      <main className="flex-1">
        <div className="max-w-2xl mx-auto px-4 py-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-[#9898a8] mb-8">
            <Link href="/teacher/courses" className="hover:text-[#6b6b7b] transition-colors duration-150">
              내 강의
            </Link>
            <ChevronLeftIcon size={14} className="rotate-180" />
            <span className="text-[#6b6b7b]">새 강의</span>
          </nav>

          <h1 className="text-2xl font-bold text-[#18181b] mb-8">새 강의 만들기</h1>

          {/* 디버그 패널 — 개발 중에만 표시 */}
          {tokenInfo && (
            <div className={`flex items-center gap-3 p-3 rounded-xl text-xs mb-4 border ${
              tokenInfo.hasToken && tokenInfo.role === 'TEACHER'
                ? 'bg-[#dcfce7] border-[#bbf7d0] text-[#4ade80]'
                : 'bg-[#fef3c7] border-[#fde68a] text-[#fbbf24]'
            }`}>
              <span>토큰: {tokenInfo.hasToken ? '✓ 있음' : '✗ 없음'}</span>
              <span>|</span>
              <span>역할: <strong>{tokenInfo.role}</strong></span>
              {tokenInfo.role !== 'TEACHER' && (
                <span className="ml-1">— 강사 계정으로 로그인하세요</span>
              )}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2.5 p-4 rounded-xl bg-[#fee2e2] border border-[#fecaca] mb-6">
              <AlertCircleIcon size={16} className="text-[#ef4444] shrink-0" />
              <p className="text-sm text-[#f87171]">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-[#6b6b7b] mb-2">
                강의 제목 <span className="text-[#ef4444]">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="예: 주식 기초 완성 (3~100자)"
                maxLength={100}
                className="w-full px-4 py-3 rounded-xl bg-[#f0f0f8] border border-[#e2e2ea] text-[#18181b] placeholder-[#9898a8] text-sm focus:outline-none focus:border-[#e9a000] focus:ring-1 focus:ring-[#e9a000] transition-all duration-200"
              />
              <p className="text-xs text-[#9898a8] mt-1 text-right">{form.title.length}/100</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-[#6b6b7b] mb-2">
                강의 설명 <span className="text-[#ef4444]">*</span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="강의에 대한 상세 설명을 입력하세요 (10~1000자)"
                rows={5}
                maxLength={1000}
                className="w-full px-4 py-3 rounded-xl bg-[#f0f0f8] border border-[#e2e2ea] text-[#18181b] placeholder-[#9898a8] text-sm focus:outline-none focus:border-[#e9a000] focus:ring-1 focus:ring-[#e9a000] transition-all duration-200 resize-none"
              />
              <p className="text-xs text-[#9898a8] mt-1 text-right">{form.description.length}/1000</p>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-[#6b6b7b] mb-2">
                카테고리 <span className="text-[#ef4444]">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setForm({ ...form, category: cat })}
                    className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                      form.category === cat
                        ? 'bg-[#e9a000] text-[#0a0a0d]'
                        : 'bg-[#f0f0f8] border border-[#e2e2ea] text-[#6b6b7b] hover:text-[#18181b] hover:border-[#d0d0dc]'
                    }`}
                  >
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-[#6b6b7b] mb-2">
                가격 <span className="text-[#ef4444]">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9898a8] text-sm">₩</span>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Math.max(0, parseInt(e.target.value) || 0) })}
                  min={0}
                  max={10000000}
                  className="w-full pl-8 pr-4 py-3 rounded-xl bg-[#f0f0f8] border border-[#e2e2ea] text-[#18181b] text-sm focus:outline-none focus:border-[#e9a000] focus:ring-1 focus:ring-[#e9a000] transition-all duration-200"
                />
              </div>
              <p className="text-xs text-[#9898a8] mt-1">0원 입력 시 무료 강의로 등록됩니다</p>
            </div>

            {/* Thumbnail Upload */}
            <div>
              <label className="block text-sm font-medium text-[#6b6b7b] mb-3">썸네일 (선택)</label>
              <div className="flex items-center gap-4">
                <div className="w-28 h-16 rounded-xl overflow-hidden bg-[#f0f0f8] border border-[#e2e2ea] shrink-0 flex items-center justify-center">
                  {thumbPreview ? (
                    <img src={thumbPreview} alt="썸네일 미리보기" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={22} className="text-[#9898a8]" />
                  )}
                </div>
                <div className="flex flex-col gap-2 min-w-0">
                  <input
                    ref={thumbRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleThumbFile}
                    className="hidden"
                    id="new-thumbnail-upload"
                  />
                  <label
                    htmlFor="new-thumbnail-upload"
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-all duration-150 ${
                      thumbState === 'error'
                        ? 'bg-[#fee2e2] border border-[#fecaca] text-[#f87171] hover:bg-[#fecaca]'
                        : 'bg-[#f0f0f8] border border-[#e2e2ea] text-[#6b6b7b] hover:text-[#18181b] hover:border-[#d0d0dc]'
                    }`}
                  >
                    <UploadIcon size={14} />
                    {thumbPreview ? '이미지 변경' : '이미지 업로드'}
                  </label>
                  {thumbState === 'error' && (
                    <p className="text-xs text-[#f87171]">{thumbMsg}</p>
                  )}
                  {thumbPreview && thumbState !== 'error' && (
                    <span className="text-xs text-[#9898a8]">
                      {thumbFile?.name}
                    </span>
                  )}
                  <p className="text-xs text-[#9898a8]">JPG · PNG · WebP</p>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex items-center gap-3 pt-2">
              <Link
                href="/teacher/courses"
                className="flex-1 py-3 rounded-xl bg-[#f0f0f8] border border-[#e2e2ea] text-[#6b6b7b] text-sm font-medium text-center hover:bg-[#e8e8f2] hover:text-[#18181b] transition-all duration-150"
              >
                취소
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#e9a000] text-[#0a0a0d] text-sm font-semibold hover:bg-[#cc8e00] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
              >
                {isSubmitting ? (
                  <>
                    <SpinnerIcon size={16} />
                    {submitLabel}
                  </>
                ) : (
                  '강의 생성하기'
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
