'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { teacherService, courseService } from '@/lib/api';
import { CategoryType, CATEGORY_LABELS, CourseUpdateRequest } from '@/lib/api/types';
import { ChevronLeftIcon, SpinnerIcon, AlertCircleIcon, UploadIcon, CheckCircleIcon, ImageIcon } from '@/components/Icons';

const CATEGORIES: CategoryType[] = ['DOMESTIC_STOCK', 'OVERSEAS_STOCK', 'CRYPTO', 'NFT', 'ETF', 'FUTURES'];

export default function EditCoursePage() {
  const { id } = useParams();
  const courseId = parseInt(id as string);
  const router = useRouter();
  const { user } = useAuth();

  const [form, setForm] = useState<CourseUpdateRequest>({
    title: '',
    description: '',
    category: 'DOMESTIC_STOCK',
    price: 0,
    thumbnailUrl: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thumbState, setThumbState] = useState<'idle' | 'uploading' | 'confirming' | 'done' | 'error'>('idle');
  const [thumbMsg, setThumbMsg] = useState('');
  const thumbRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const course = await courseService.getCourseById(courseId);
        setForm({
          title: course.title,
          description: course.description,
          category: course.category,
          price: course.price,
          thumbnailUrl: course.thumbnailUrl || '',
        });
      } catch (err: any) {
        setError(err.message || '강의를 불러오는데 실패했습니다');
      } finally {
        setIsLoading(false);
      }
    };
    if (!isNaN(courseId)) load();
  }, [courseId]);

  const handleThumbnailFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setThumbState('error');
      setThumbMsg('JPG, PNG, WebP 형식만 가능합니다');
      return;
    }

    let uploadUrl: string;
    let objectKey: string;
    try {
      setThumbState('uploading');
      setThumbMsg('① URL 발급 중...');
      const res = await teacherService.getThumbnailPresignedUrl({
        courseId,
        filename: file.name,
        contentType: file.type,
      });
      uploadUrl = res.uploadUrl;
      objectKey = res.objectKey;
    } catch (err: any) {
      setThumbState('error');
      setThumbMsg(`URL 발급 실패: ${err.message || '서버 오류'}`);
      if (thumbRef.current) thumbRef.current.value = '';
      return;
    }

    try {
      setThumbMsg('② 업로드 중...');
      const r2Res = await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      if (!r2Res.ok) throw new Error(`R2 응답 ${r2Res.status}`);
    } catch (err: any) {
      setThumbState('error');
      setThumbMsg(`업로드 실패: ${err.message || 'network error'}`);
      if (thumbRef.current) thumbRef.current.value = '';
      return;
    }

    try {
      setThumbState('confirming');
      setThumbMsg('③ 확인 중...');
      const confirmed = await teacherService.confirmThumbnailUpload({ courseId, objectKey });
      setForm((prev) => ({ ...prev, thumbnailUrl: confirmed.thumbnailUrl }));
      setThumbState('done');
      setThumbMsg('');
    } catch (err: any) {
      setThumbState('error');
      setThumbMsg(`확인 실패: ${err.message || '서버 오류'}`);
    }

    if (thumbRef.current) thumbRef.current.value = '';
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
    try {
      setIsSubmitting(true);
      setError(null);
      await teacherService.updateCourse(courseId, {
        ...form,
        thumbnailUrl: form.thumbnailUrl?.trim() || undefined,
      });
      router.push('/teacher/courses');
    } catch (err: any) {
      setError(err.message || '강의 수정에 실패했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f4f4f8]">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <SpinnerIcon size={32} className="text-[#e9a000]" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f4f8]">
      <Header />
      <main className="flex-1">
        <div className="max-w-2xl mx-auto px-4 py-10">
          <nav className="flex items-center gap-2 text-sm text-[#9898a8] mb-8">
            <Link href="/teacher/courses" className="hover:text-[#6b6b7b] transition-colors duration-150">
              내 강의
            </Link>
            <ChevronLeftIcon size={14} className="rotate-180" />
            <span className="text-[#6b6b7b]">강의 수정</span>
          </nav>

          <h1 className="text-2xl font-bold text-[#18181b] mb-8">강의 수정</h1>

          {error && (
            <div className="flex items-center gap-2.5 p-4 rounded-xl bg-[#fee2e2] border border-[#fecaca] mb-6">
              <AlertCircleIcon size={16} className="text-[#ef4444] shrink-0" />
              <p className="text-sm text-[#f87171]">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#6b6b7b] mb-2">
                강의 제목 <span className="text-[#ef4444]">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                maxLength={100}
                className="w-full px-4 py-3 rounded-xl bg-[#f0f0f8] border border-[#e2e2ea] text-[#18181b] placeholder-[#9898a8] text-sm focus:outline-none focus:border-[#e9a000] focus:ring-1 focus:ring-[#e9a000] transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#6b6b7b] mb-2">
                강의 설명 <span className="text-[#ef4444]">*</span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={5}
                maxLength={1000}
                className="w-full px-4 py-3 rounded-xl bg-[#f0f0f8] border border-[#e2e2ea] text-[#18181b] placeholder-[#9898a8] text-sm focus:outline-none focus:border-[#e9a000] focus:ring-1 focus:ring-[#e9a000] transition-all duration-200 resize-none"
              />
            </div>

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
            </div>

            <div>
              <label className="block text-sm font-medium text-[#6b6b7b] mb-3">썸네일 (선택)</label>
              <div className="flex items-center gap-4">
                <div className="w-28 h-16 rounded-xl overflow-hidden bg-[#f0f0f8] border border-[#e2e2ea] shrink-0 flex items-center justify-center">
                  {form.thumbnailUrl ? (
                    <img src={form.thumbnailUrl} alt="썸네일 미리보기" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={22} className="text-[#9898a8]" />
                  )}
                </div>
                <div className="flex flex-col gap-2 min-w-0">
                  <input
                    ref={thumbRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleThumbnailFile}
                    className="hidden"
                    id="edit-thumbnail-upload"
                  />
                  <label
                    htmlFor="edit-thumbnail-upload"
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-all duration-150 ${
                      thumbState === 'uploading' || thumbState === 'confirming'
                        ? 'bg-[#f0f0f8] text-[#9898a8] cursor-not-allowed'
                        : thumbState === 'error'
                        ? 'bg-[#fee2e2] border border-[#fecaca] text-[#f87171] hover:bg-[#fecaca]'
                        : 'bg-[#f0f0f8] border border-[#e2e2ea] text-[#6b6b7b] hover:text-[#18181b] hover:border-[#d0d0dc]'
                    }`}
                    onClick={(e) => { if (thumbState === 'uploading' || thumbState === 'confirming') e.preventDefault(); }}
                  >
                    {thumbState === 'uploading' || thumbState === 'confirming' ? (
                      <><SpinnerIcon size={14} />{thumbMsg}</>
                    ) : thumbState === 'error' ? (
                      <><UploadIcon size={14} />다시 시도</>
                    ) : (
                      <><UploadIcon size={14} />{form.thumbnailUrl ? '이미지 변경' : '이미지 업로드'}</>
                    )}
                  </label>
                  {thumbState === 'done' && (
                    <span className="text-sm text-[#4ade80] flex items-center gap-1.5">
                      <CheckCircleIcon size={14} /> 업로드 완료
                    </span>
                  )}
                  {thumbState === 'error' && (
                    <p className="text-xs text-[#f87171]">{thumbMsg}</p>
                  )}
                  <p className="text-xs text-[#9898a8]">JPG · PNG · WebP</p>
                </div>
              </div>
            </div>

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
                {isSubmitting ? <><SpinnerIcon size={16} />저장 중...</> : '저장하기'}
              </button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
