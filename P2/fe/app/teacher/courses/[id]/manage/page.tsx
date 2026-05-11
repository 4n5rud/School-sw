'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { teacherService, sectionService, courseService } from '@/lib/api';
import { Course, Section, Lecture } from '@/lib/api/types';
import {
  ChevronLeftIcon, ChevronDownIcon, ChevronRightIcon, PlusIcon, EditIcon,
  TrashIcon, SpinnerIcon, AlertCircleIcon, CheckCircleIcon, UploadIcon, BookOpenIcon, ImageIcon,
} from '@/components/Icons';

function formatDuration(secs?: number | null): string {
  if (!secs) return '—';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

type UploadState = { status: 'idle' | 'uploading' | 'confirming' | 'done' | 'error'; message?: string };

function LectureUploadRow({ lecture, onUploaded }: { lecture: Lecture; onUploaded: (updated: Lecture) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>({ status: 'idle' });
  const [tab, setTab] = useState<'file' | 'url'>('file');
  const [urlInput, setUrlInput] = useState('');
  const [isSavingUrl, setIsSavingUrl] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      setState({ status: 'error', message: '동영상 파일만 업로드 가능합니다' });
      return;
    }
    if (file.size > 5 * 1024 * 1024 * 1024) {
      setState({ status: 'error', message: '파일 크기는 5GB 이하여야 합니다' });
      return;
    }

    // ── STEP 1: presigned URL 발급 ──
    let uploadUrl: string;
    let objectKey: string;
    try {
      setState({ status: 'uploading', message: '① URL 발급 중...' });
      const res = await teacherService.getVideoPresignedUrl({
        lectureId: lecture.id,
        filename: file.name,
        contentType: file.type,
        fileSize: file.size,
      });
      uploadUrl = res.uploadUrl;
      objectKey = res.objectKey;
    } catch (err: any) {
      setState({ status: 'error', message: `① URL 발급 실패: ${err.message || '서버 오류'}` });
      if (fileRef.current) fileRef.current.value = '';
      return;
    }

    // ── STEP 2: R2 직접 업로드 ──
    try {
      setState({ status: 'uploading', message: '② R2 업로드 중...' });
      const r2Headers: HeadersInit = {};
      if (uploadUrl.includes('content-type') || uploadUrl.includes('Content-Type')) {
        r2Headers['Content-Type'] = file.type;
      }
      const r2Res = await fetch(uploadUrl, { method: 'PUT', body: file, headers: r2Headers });
      if (!r2Res.ok) {
        const text = await r2Res.text().catch(() => '');
        throw new Error(`R2 응답 ${r2Res.status}: ${text.slice(0, 100)}`);
      }
    } catch (err: any) {
      setState({ status: 'error', message: `② R2 업로드 실패: ${err.message || 'network error'}` });
      if (fileRef.current) fileRef.current.value = '';
      return;
    }

    // ── STEP 3: 업로드 완료 확인 ──
    try {
      setState({ status: 'confirming', message: '③ 업로드 확인 중...' });
      const confirmed = await teacherService.confirmVideoUpload({ lectureId: lecture.id, objectKey });
      setState({ status: 'done' });
      onUploaded({ ...lecture, videoUrl: confirmed.videoUrl, uploadStatus: 'CONFIRMED' });
    } catch (err: any) {
      setState({ status: 'error', message: `③ 완료 확인 실패: ${err.message || '서버 오류'}` });
    }

    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSaveUrl = async () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    try { new URL(trimmed); } catch {
      setUrlError('올바른 URL 형식이 아닙니다');
      return;
    }
    try {
      setIsSavingUrl(true);
      setUrlError(null);
      await teacherService.updateLecture(lecture.id, {
        title: lecture.title,
        sortOrder: lecture.sortOrder,
        videoUrl: trimmed,
      });
      onUploaded({ ...lecture, videoUrl: trimmed, uploadStatus: 'CONFIRMED' });
      setUrlInput('');
    } catch (err: any) {
      setUrlError(err.message || 'URL 저장에 실패했습니다');
    } finally {
      setIsSavingUrl(false);
    }
  };

  const isConfirmed = lecture.uploadStatus === 'CONFIRMED' && lecture.videoUrl;

  if (isConfirmed) {
    return (
      <div className="mt-2 flex items-center gap-2 text-xs text-[#4ade80]">
        <CheckCircleIcon size={13} />
        <span>영상 등록 완료 ({formatDuration(lecture.playTime)})</span>
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-1.5">
      {/* Tab switcher */}
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => setTab('file')}
          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150 ${
            tab === 'file' ? 'bg-[#e8e8f2] text-[#18181b]' : 'text-[#9898a8] hover:text-[#6b6b7b]'
          }`}
        >
          파일 업로드
        </button>
        <button
          type="button"
          onClick={() => setTab('url')}
          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150 ${
            tab === 'url' ? 'bg-[#e8e8f2] text-[#18181b]' : 'text-[#9898a8] hover:text-[#6b6b7b]'
          }`}
        >
          URL 입력
        </button>
      </div>

      {tab === 'file' ? (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="video/mp4,video/webm"
              onChange={handleFile}
              className="hidden"
              id={`upload-${lecture.id}`}
            />
            <label
              htmlFor={`upload-${lecture.id}`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all duration-150 ${
                state.status === 'uploading' || state.status === 'confirming'
                  ? 'bg-[#f0f0f8] text-[#9898a8] cursor-not-allowed'
                  : state.status === 'error'
                  ? 'bg-[#fee2e2] border border-[#fecaca] text-[#f87171] hover:bg-[#fecaca]'
                  : 'bg-[#f0f0f8] border border-[#e2e2ea] text-[#6b6b7b] hover:text-[#18181b] hover:border-[#d0d0dc]'
              }`}
              onClick={(e) => {
                if (state.status === 'uploading' || state.status === 'confirming') e.preventDefault();
              }}
            >
              {state.status === 'uploading' || state.status === 'confirming' ? (
                <><SpinnerIcon size={12} />{state.message}</>
              ) : state.status === 'error' ? (
                <><UploadIcon size={12} />다시 시도</>
              ) : (
                <><UploadIcon size={12} />영상 업로드</>
              )}
            </label>
            {state.status === 'done' && (
              <span className="text-xs text-[#4ade80] flex items-center gap-1">
                <CheckCircleIcon size={12} /> 완료
              </span>
            )}
          </div>
          {state.status === 'error' && (
            <p className="text-xs text-[#f87171] bg-[#fee2e2] border border-[#fecaca] rounded-lg px-2 py-1.5 leading-relaxed">
              {state.message}
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => { setUrlInput(e.target.value); setUrlError(null); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveUrl(); }}
              placeholder="https://youtube.com/watch?v=... 또는 동영상 URL"
              className="flex-1 px-3 py-1.5 rounded-lg bg-[#f4f4f8] border border-[#e2e2ea] text-xs text-[#18181b] placeholder-[#9898a8] focus:outline-none focus:border-[#e9a000] min-w-0"
            />
            <button
              type="button"
              onClick={handleSaveUrl}
              disabled={isSavingUrl || !urlInput.trim()}
              className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#e9a000] text-[#0a0a0d] text-xs font-semibold hover:bg-[#cc8e00] disabled:opacity-50 transition-all duration-150"
            >
              {isSavingUrl ? <SpinnerIcon size={12} /> : '저장'}
            </button>
          </div>
          {urlError && (
            <p className="text-xs text-[#f87171] bg-[#fee2e2] border border-[#fecaca] rounded-lg px-2 py-1.5">
              {urlError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ThumbnailUploadSection({ course, onUploaded }: { course: Course; onUploaded: (url: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>({ status: 'idle' });

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setState({ status: 'error', message: 'JPG, PNG, WebP 형식만 가능합니다' });
      return;
    }

    let uploadUrl: string;
    let objectKey: string;
    try {
      setState({ status: 'uploading', message: '① URL 발급 중...' });
      const res = await teacherService.getThumbnailPresignedUrl({
        courseId: course.id,
        filename: file.name,
        contentType: file.type,
      });
      uploadUrl = res.uploadUrl;
      objectKey = res.objectKey;
    } catch (err: any) {
      setState({ status: 'error', message: `URL 발급 실패: ${err.message || '서버 오류'}` });
      if (fileRef.current) fileRef.current.value = '';
      return;
    }

    try {
      setState({ status: 'uploading', message: '② 업로드 중...' });
      const r2Res = await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      if (!r2Res.ok) throw new Error(`R2 응답 ${r2Res.status}`);
    } catch (err: any) {
      setState({ status: 'error', message: `업로드 실패: ${err.message || 'network error'}` });
      if (fileRef.current) fileRef.current.value = '';
      return;
    }

    try {
      setState({ status: 'confirming', message: '③ 확인 중...' });
      const confirmed = await teacherService.confirmThumbnailUpload({ courseId: course.id, objectKey });
      setState({ status: 'done' });
      onUploaded(confirmed.thumbnailUrl);
    } catch (err: any) {
      setState({ status: 'error', message: `확인 실패: ${err.message || '서버 오류'}` });
    }

    if (fileRef.current) fileRef.current.value = '';
  };

  const isBusy = state.status === 'uploading' || state.status === 'confirming';

  return (
    <div className="flex items-center gap-4">
      <div className="w-24 h-14 rounded-lg overflow-hidden bg-[#f0f0f8] border border-[#e2e2ea] shrink-0 flex items-center justify-center">
        {course.thumbnailUrl ? (
          <img src={course.thumbnailUrl} alt="썸네일" className="w-full h-full object-cover" />
        ) : (
          <ImageIcon size={20} className="text-[#9898a8]" />
        )}
      </div>
      <div className="flex flex-col gap-1.5 min-w-0">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFile}
          className="hidden"
          id="thumbnail-upload"
        />
        <label
          htmlFor="thumbnail-upload"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all duration-150 ${
            isBusy
              ? 'bg-[#f0f0f8] text-[#9898a8] cursor-not-allowed'
              : state.status === 'error'
              ? 'bg-[#fee2e2] border border-[#fecaca] text-[#f87171] hover:bg-[#fecaca]'
              : 'bg-[#f0f0f8] border border-[#e2e2ea] text-[#6b6b7b] hover:text-[#18181b] hover:border-[#d0d0dc]'
          }`}
          onClick={(e) => { if (isBusy) e.preventDefault(); }}
        >
          {isBusy ? (
            <><SpinnerIcon size={12} />{state.message}</>
          ) : state.status === 'error' ? (
            <><UploadIcon size={12} />다시 시도</>
          ) : (
            <><UploadIcon size={12} />{course.thumbnailUrl ? '썸네일 변경' : '썸네일 등록'}</>
          )}
        </label>
        {state.status === 'done' && (
          <span className="text-xs text-[#4ade80] flex items-center gap-1">
            <CheckCircleIcon size={12} /> 등록 완료
          </span>
        )}
        {state.status === 'error' && (
          <p className="text-xs text-[#f87171]">{state.message}</p>
        )}
        <p className="text-xs text-[#9898a8]">JPG · PNG · WebP</p>
      </div>
    </div>
  );
}

function SectionBlock({
  section,
  onSectionUpdated,
  onSectionDeleted,
  onLectureAdded,
  onLectureUpdated,
  onLectureDeleted,
}: {
  section: Section;
  onSectionUpdated: (s: Section) => void;
  onSectionDeleted: (id: number) => void;
  onLectureAdded: (sectionId: number, lec: Lecture) => void;
  onLectureUpdated: (sectionId: number, lec: Lecture) => void;
  onLectureDeleted: (sectionId: number, lectureId: number) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(section.title);
  const [isSavingSection, setIsSavingSection] = useState(false);
  const [isDeletingSection, setIsDeletingSection] = useState(false);
  const [showAddLecture, setShowAddLecture] = useState(false);
  const [newLectureTitle, setNewLectureTitle] = useState('');
  const [isAddingLecture, setIsAddingLecture] = useState(false);
  const [editingLectureId, setEditingLectureId] = useState<number | null>(null);
  const [editLectureTitle, setEditLectureTitle] = useState('');
  const [deletingLectureId, setDeletingLectureId] = useState<number | null>(null);

  const handleSaveSection = async () => {
    if (!editTitle.trim()) return;
    try {
      setIsSavingSection(true);
      const updated = await teacherService.updateSection(section.id, editTitle.trim());
      onSectionUpdated({ ...section, title: updated.title });
      setEditing(false);
    } catch (err: any) {
      alert(err.message || '섹션 수정에 실패했습니다');
    } finally {
      setIsSavingSection(false);
    }
  };

  const handleDeleteSection = async () => {
    if (!confirm(`"${section.title}" 섹션을 삭제하시겠습니까?\n모든 영상이 함께 삭제됩니다.`)) return;
    try {
      setIsDeletingSection(true);
      await teacherService.deleteSection(section.id);
      onSectionDeleted(section.id);
    } catch (err: any) {
      alert(err.message || '섹션 삭제에 실패했습니다');
      setIsDeletingSection(false);
    }
  };

  const handleAddLecture = async () => {
    if (!newLectureTitle.trim()) return;
    try {
      setIsAddingLecture(true);
      const nextOrder = (section.lectures?.length || 0) + 1;
      const lec = await teacherService.addLecture(section.id, {
        title: newLectureTitle.trim(),
        sortOrder: nextOrder,
      });
      onLectureAdded(section.id, lec);
      setNewLectureTitle('');
      setShowAddLecture(false);
    } catch (err: any) {
      alert(err.message || '강의 추가에 실패했습니다');
    } finally {
      setIsAddingLecture(false);
    }
  };

  const handleSaveLecture = async (lectureId: number, sortOrder: number) => {
    if (!editLectureTitle.trim()) return;
    try {
      const updated = await teacherService.updateLecture(lectureId, {
        title: editLectureTitle.trim(),
        sortOrder,
      });
      onLectureUpdated(section.id, updated);
      setEditingLectureId(null);
    } catch (err: any) {
      alert(err.message || '강의 수정에 실패했습니다');
    }
  };

  const handleDeleteLecture = async (lectureId: number) => {
    if (!confirm('이 강의 유닛을 삭제하시겠습니까?')) return;
    try {
      setDeletingLectureId(lectureId);
      await teacherService.deleteLecture(lectureId);
      onLectureDeleted(section.id, lectureId);
    } catch (err: any) {
      alert(err.message || '강의 삭제에 실패했습니다');
    } finally {
      setDeletingLectureId(null);
    }
  };

  return (
    <div className="bg-[#ffffff] border border-[#e2e2ea] rounded-xl overflow-hidden">
      {/* Section Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-[#f8f8fc]">
        <button onClick={() => setExpanded(!expanded)} className="p-0.5 text-[#9898a8] hover:text-[#6b6b7b] transition-colors duration-150">
          {expanded ? <ChevronDownIcon size={16} /> : <ChevronRightIcon size={16} />}
        </button>

        {editing ? (
          <div className="flex-1 flex items-center gap-2">
            <input
              autoFocus
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveSection(); if (e.key === 'Escape') setEditing(false); }}
              className="flex-1 px-3 py-1.5 rounded-lg bg-[#f4f4f8] border border-[#e9a000] text-sm text-[#18181b] focus:outline-none"
            />
            <button
              onClick={handleSaveSection}
              disabled={isSavingSection}
              className="px-3 py-1.5 rounded-lg bg-[#e9a000] text-[#0a0a0d] text-xs font-semibold hover:bg-[#cc8e00] disabled:opacity-50 transition-all duration-150"
            >
              {isSavingSection ? <SpinnerIcon size={13} /> : '저장'}
            </button>
            <button onClick={() => { setEditing(false); setEditTitle(section.title); }} className="px-3 py-1.5 rounded-lg bg-[#f0f0f8] border border-[#e2e2ea] text-xs text-[#6b6b7b] hover:text-[#18181b] transition-all duration-150">
              취소
            </button>
          </div>
        ) : (
          <span className="flex-1 font-semibold text-[#18181b] text-sm">{section.title}</span>
        )}

        <span className="text-xs text-[#9898a8] shrink-0">{section.lectures?.length || 0}개</span>

        {!editing && (
          <div className="flex items-center gap-1">
            <button onClick={() => { setEditing(true); setEditTitle(section.title); }} className="p-1.5 rounded-lg text-[#9898a8] hover:text-[#6b6b7b] hover:bg-[#e8e8f2] transition-all duration-150">
              <EditIcon size={14} />
            </button>
            <button onClick={handleDeleteSection} disabled={isDeletingSection} className="p-1.5 rounded-lg text-[#9898a8] hover:text-[#ef4444] hover:bg-[#fee2e2] disabled:opacity-50 transition-all duration-150">
              {isDeletingSection ? <SpinnerIcon size={14} /> : <TrashIcon size={14} />}
            </button>
          </div>
        )}
      </div>

      {/* Lectures */}
      {expanded && (
        <div className="p-3 space-y-2">
          {section.lectures?.map((lec) => (
            <div key={lec.id} className="bg-[#f0f0f8] border border-[#e2e2ea] rounded-xl p-3">
              {editingLectureId === lec.id ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={editLectureTitle}
                    onChange={(e) => setEditLectureTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveLecture(lec.id, lec.sortOrder); if (e.key === 'Escape') setEditingLectureId(null); }}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-[#f4f4f8] border border-[#e9a000] text-sm text-[#18181b] focus:outline-none"
                  />
                  <button onClick={() => handleSaveLecture(lec.id, lec.sortOrder)} className="px-3 py-1.5 rounded-lg bg-[#e9a000] text-[#0a0a0d] text-xs font-semibold hover:bg-[#cc8e00] transition-all duration-150">
                    저장
                  </button>
                  <button onClick={() => setEditingLectureId(null)} className="px-3 py-1.5 rounded-lg bg-[#ffffff] border border-[#e2e2ea] text-xs text-[#6b6b7b] transition-all duration-150">
                    취소
                  </button>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#9898a8] shrink-0">{lec.sortOrder}.</span>
                      <p className="text-sm text-[#18181b] line-clamp-1">{lec.title}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded-md shrink-0 ${
                        lec.uploadStatus === 'CONFIRMED' ? 'bg-[#dcfce7] text-[#4ade80]'
                        : lec.uploadStatus === 'PENDING' ? 'bg-[#f0f0f8] text-[#9898a8]'
                        : 'bg-[#fee2e2] text-[#f87171]'
                      }`}>
                        {lec.uploadStatus === 'CONFIRMED' ? '완료' : lec.uploadStatus === 'PENDING' ? '대기' : '실패'}
                      </span>
                    </div>
                    <LectureUploadRow
                      lecture={lec}
                      onUploaded={(updated) => onLectureUpdated(section.id, updated)}
                    />
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => { setEditingLectureId(lec.id); setEditLectureTitle(lec.title); }} className="p-1.5 rounded-lg text-[#9898a8] hover:text-[#6b6b7b] hover:bg-[#e8e8f2] transition-all duration-150">
                      <EditIcon size={13} />
                    </button>
                    <button onClick={() => handleDeleteLecture(lec.id)} disabled={deletingLectureId === lec.id} className="p-1.5 rounded-lg text-[#9898a8] hover:text-[#ef4444] hover:bg-[#fee2e2] disabled:opacity-50 transition-all duration-150">
                      {deletingLectureId === lec.id ? <SpinnerIcon size={13} /> : <TrashIcon size={13} />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Add lecture */}
          {showAddLecture ? (
            <div className="flex items-center gap-2 p-3 bg-[#f0f0f8] border border-[#e9a000]/30 rounded-xl">
              <input
                autoFocus
                value={newLectureTitle}
                onChange={(e) => setNewLectureTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddLecture(); if (e.key === 'Escape') { setShowAddLecture(false); setNewLectureTitle(''); } }}
                placeholder="강의 유닛 제목 (예: 1-1. 주식이란?)"
                className="flex-1 px-3 py-1.5 rounded-lg bg-[#f4f4f8] border border-[#e2e2ea] text-sm text-[#18181b] placeholder-[#9898a8] focus:outline-none focus:border-[#e9a000]"
              />
              <button
                onClick={handleAddLecture}
                disabled={isAddingLecture || !newLectureTitle.trim()}
                className="px-3 py-1.5 rounded-lg bg-[#e9a000] text-[#0a0a0d] text-xs font-semibold hover:bg-[#cc8e00] disabled:opacity-50 transition-all duration-150"
              >
                {isAddingLecture ? <SpinnerIcon size={13} /> : '추가'}
              </button>
              <button onClick={() => { setShowAddLecture(false); setNewLectureTitle(''); }} className="px-3 py-1.5 rounded-lg bg-[#ffffff] border border-[#e2e2ea] text-xs text-[#6b6b7b] transition-all duration-150">
                취소
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAddLecture(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-[#e2e2ea] text-[#9898a8] text-sm hover:border-[#d0d0dc] hover:text-[#6b6b7b] transition-all duration-150"
            >
              <PlusIcon size={14} />
              강의 유닛 추가
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function ManageCoursePage() {
  const { id } = useParams();
  const courseId = parseInt(id as string);
  const { user, isLoading: authLoading } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [showAddSection, setShowAddSection] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    const load = async () => {
      try {
        const [courseData, sectionsData] = await Promise.all([
          courseService.getCourseById(courseId),
          sectionService.getSectionsByCourse(courseId),
        ]);
        setCourse(courseData);
        setSections(sectionsData || []);
      } catch (err: any) {
        setError(err.message || '데이터를 불러오는데 실패했습니다');
      } finally {
        setIsLoading(false);
      }
    };
    if (!isNaN(courseId)) load();
  }, [courseId, authLoading]);

  const handleAddSection = async () => {
    if (!newSectionTitle.trim()) return;
    try {
      setIsAddingSection(true);
      const s = await teacherService.addSection(courseId, newSectionTitle.trim());
      setSections((prev) => [...prev, { ...s, lectures: [] }]);
      setNewSectionTitle('');
      setShowAddSection(false);
    } catch (err: any) {
      alert(err.message || '섹션 추가에 실패했습니다');
    } finally {
      setIsAddingSection(false);
    }
  };

  const handleSectionUpdated = (updated: Section) =>
    setSections((prev) => prev.map((s) => (s.id === updated.id ? { ...s, title: updated.title } : s)));

  const handleSectionDeleted = (id: number) =>
    setSections((prev) => prev.filter((s) => s.id !== id));

  const handleLectureAdded = (sectionId: number, lec: Lecture) =>
    setSections((prev) =>
      prev.map((s) => s.id === sectionId ? { ...s, lectures: [...(s.lectures || []), lec] } : s)
    );

  const handleLectureUpdated = (sectionId: number, lec: Lecture) =>
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, lectures: (s.lectures || []).map((l) => (l.id === lec.id ? lec : l)) } : s
      )
    );

  const handleLectureDeleted = (sectionId: number, lectureId: number) =>
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, lectures: (s.lectures || []).filter((l) => l.id !== lectureId) } : s
      )
    );

  if (authLoading || isLoading) {
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

  if (error || !course) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f4f4f8]">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <AlertCircleIcon size={40} className="text-[#ef4444] mx-auto mb-4" />
            <p className="text-[#18181b] font-semibold mb-2">{error || '강의를 찾을 수 없습니다'}</p>
            <Link href="/teacher/courses" className="text-sm text-[#e9a000] hover:text-[#cc8e00]">강의 목록으로</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const totalLectures = sections.reduce((sum, s) => sum + (s.lectures?.length || 0), 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f4f8]">
      <Header />
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
          {/* Header */}
          <div>
            <nav className="flex items-center gap-2 text-sm text-[#9898a8] mb-4">
              <Link href="/teacher/courses" className="hover:text-[#6b6b7b] transition-colors duration-150">내 강의</Link>
              <ChevronLeftIcon size={14} className="rotate-180" />
              <span className="text-[#6b6b7b] line-clamp-1">{course.title}</span>
            </nav>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-bold text-[#18181b]">{course.title}</h1>
                <p className="text-sm text-[#9898a8] mt-1">
                  {sections.length}개 섹션 · {totalLectures}개 강의
                </p>
              </div>
              <Link
                href={`/teacher/courses/${courseId}/edit`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#f0f0f8] border border-[#e2e2ea] text-sm text-[#6b6b7b] hover:text-[#18181b] hover:bg-[#e8e8f2] transition-all duration-150"
              >
                <EditIcon size={14} />
                강의 수정
              </Link>
            </div>
          </div>

          {/* Thumbnail */}
          <div className="bg-[#ffffff] border border-[#e2e2ea] rounded-xl p-4">
            <p className="text-xs font-semibold text-[#9898a8] uppercase tracking-wider mb-3">강의 썸네일</p>
            <ThumbnailUploadSection
              course={course}
              onUploaded={(url) => setCourse((prev) => prev ? { ...prev, thumbnailUrl: url } : prev)}
            />
          </div>

          {/* Sections */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[#18181b]">섹션 · 강의 관리</h2>

            {sections.length === 0 && (
              <div className="bg-[#ffffff] border border-[#e2e2ea] rounded-xl p-10 text-center">
                <BookOpenIcon size={36} className="text-[#e2e2ea] mx-auto mb-3" />
                <p className="text-sm text-[#9898a8]">섹션을 추가해 강의 콘텐츠를 구성하세요</p>
              </div>
            )}

            {sections.map((s) => (
              <SectionBlock
                key={s.id}
                section={s}
                onSectionUpdated={handleSectionUpdated}
                onSectionDeleted={handleSectionDeleted}
                onLectureAdded={handleLectureAdded}
                onLectureUpdated={handleLectureUpdated}
                onLectureDeleted={handleLectureDeleted}
              />
            ))}

            {/* Add Section */}
            {showAddSection ? (
              <div className="flex items-center gap-2 p-4 bg-[#ffffff] border border-[#e9a000]/30 rounded-xl">
                <input
                  autoFocus
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddSection(); if (e.key === 'Escape') { setShowAddSection(false); setNewSectionTitle(''); } }}
                  placeholder="섹션 제목 (예: 1단원: 주식의 기초)"
                  className="flex-1 px-3 py-2 rounded-lg bg-[#f0f0f8] border border-[#e2e2ea] text-sm text-[#18181b] placeholder-[#9898a8] focus:outline-none focus:border-[#e9a000]"
                />
                <button
                  onClick={handleAddSection}
                  disabled={isAddingSection || !newSectionTitle.trim()}
                  className="px-4 py-2 rounded-lg bg-[#e9a000] text-[#0a0a0d] text-sm font-semibold hover:bg-[#cc8e00] disabled:opacity-50 transition-all duration-150"
                >
                  {isAddingSection ? <SpinnerIcon size={15} /> : '추가'}
                </button>
                <button onClick={() => { setShowAddSection(false); setNewSectionTitle(''); }} className="px-4 py-2 rounded-lg bg-[#f0f0f8] border border-[#e2e2ea] text-sm text-[#6b6b7b] transition-all duration-150">
                  취소
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAddSection(true)}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-dashed border-[#e2e2ea] text-[#9898a8] text-sm font-medium hover:border-[#e9a000]/50 hover:text-[#6b6b7b] transition-all duration-150"
              >
                <PlusIcon size={16} />
                섹션 추가
              </button>
            )}
          </div>

          {/* Quick nav */}
          <div className="flex items-center justify-between pt-4 border-t border-[#e2e2ea]">
            <Link href="/teacher/courses" className="text-sm text-[#9898a8] hover:text-[#6b6b7b] transition-colors duration-150">
              ← 강의 목록
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href={`/teacher/courses/${courseId}/questions`}
                className="text-sm text-[#6b6b7b] hover:text-[#18181b] transition-colors duration-150"
              >
                Q&A 관리
              </Link>
              <Link
                href={`/teacher/courses/${courseId}/students`}
                className="text-sm text-[#e9a000] hover:text-[#cc8e00] transition-colors duration-150"
              >
                수강생 보기 →
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
