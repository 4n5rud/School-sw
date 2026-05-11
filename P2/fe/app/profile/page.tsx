'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  UserIcon, SettingsIcon, AlertCircleIcon, CheckCircleIcon, SpinnerIcon, EyeIcon, EyeOffIcon,
} from '@/components/Icons';

type Tab = 'profile' | 'password' | 'settings';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || `오류가 발생했습니다 (${response.status})`);
  }
  return data;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoggedIn, isLoading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>('profile');

  // Profile tab state
  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password tab state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Settings tab state
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.replace('/auth/login');
    }
    if (user) {
      setNickname(user.nickname ?? '');
    }
  }, [authLoading, isLoggedIn, user]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setProfileError('닉네임을 입력해주세요');
      return;
    }
    setProfileLoading(true);
    setProfileError('');
    setProfileSuccess('');
    try {
      await apiRequest('/members/me', {
        method: 'PUT',
        body: JSON.stringify({ nickname: nickname.trim(), bio: bio.trim() || undefined }),
      });
      setProfileSuccess('프로필이 저장되었습니다');
      setTimeout(() => setProfileSuccess(''), 3000);
    } catch (err: any) {
      setProfileError(err.message || '저장에 실패했습니다');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('모든 항목을 입력해주세요');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('새 비밀번호는 8자 이상이어야 합니다');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('새 비밀번호가 일치하지 않습니다');
      return;
    }
    setPasswordLoading(true);
    setPasswordError('');
    setPasswordSuccess('');
    try {
      await apiRequest('/members/me/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setPasswordSuccess('비밀번호가 변경되었습니다');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (err: any) {
      setPasswordError(err.message || '비밀번호 변경에 실패했습니다');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== '탈퇴') {
      setDeleteError('"탈퇴"를 정확히 입력해주세요');
      return;
    }
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await apiRequest('/members/me', { method: 'DELETE' });
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      router.replace('/');
    } catch (err: any) {
      setDeleteError(err.message || '회원 탈퇴에 실패했습니다');
      setDeleteLoading(false);
    }
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: 'profile', label: '프로필 수정' },
    { id: 'password', label: '비밀번호 변경' },
    { id: 'settings', label: '계정 설정' },
  ];

  if (authLoading) {
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
        <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
          {/* Page Title */}
          <div className="animate-fade-in-up">
            <h1 className="text-2xl font-bold text-[#18181b] tracking-tight">내 프로필</h1>
            <p className="text-sm text-[#9898a8] mt-1">계정 정보를 관리하세요</p>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 bg-[#f0f0f8] border border-[#e2e2ea] rounded-xl p-1 animate-fade-in-up">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-150 ${
                  activeTab === tab.id
                    ? 'bg-[#e9a000] text-[#0a0a0d]'
                    : 'text-[#6b6b7b] hover:text-[#18181b]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ─────────────────────────── Profile Tab ─────────────────────────── */}
          {activeTab === 'profile' && (
            <div className="bg-[#ffffff] border border-[#e2e2ea] rounded-xl p-6 space-y-6 animate-fade-in shadow-sm">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-3">
                <div className="w-20 h-20 rounded-full bg-[#e9a000] flex items-center justify-center shrink-0">
                  <span className="text-[#0a0a0d] text-3xl font-bold uppercase select-none">
                    {(nickname || user?.nickname || '?').charAt(0)}
                  </span>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-[#18181b]">{user?.nickname}</p>
                  <p className="text-xs text-[#9898a8]">{user?.email}</p>
                </div>
              </div>

              <div className="w-full h-px bg-[#e2e2ea]" />

              {/* Form */}
              <form onSubmit={handleProfileSave} className="space-y-5">
                {/* Nickname */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#6b6b7b] uppercase tracking-wider">
                    닉네임
                  </label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    maxLength={20}
                    placeholder="닉네임을 입력하세요"
                    className="w-full px-4 py-3 rounded-xl bg-[#ffffff] border border-[#e2e2ea] text-[#18181b] text-sm placeholder-[#9898a8] focus:outline-none focus:border-[#e9a000] focus:ring-1 focus:ring-[#e9a000] transition-all duration-200"
                  />
                </div>

                {/* Bio */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#6b6b7b] uppercase tracking-wider">
                    소개 <span className="text-[#9898a8] normal-case tracking-normal">(선택)</span>
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    maxLength={500}
                    rows={4}
                    placeholder="자기소개를 작성해보세요"
                    className="w-full px-4 py-3 rounded-xl bg-[#ffffff] border border-[#e2e2ea] text-[#18181b] text-sm placeholder-[#9898a8] focus:outline-none focus:border-[#e9a000] focus:ring-1 focus:ring-[#e9a000] transition-all duration-200 resize-none"
                  />
                  <p className="text-xs text-[#9898a8] text-right">{bio.length} / 500</p>
                </div>

                {/* Feedback */}
                {profileError && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-[#fee2e2] border border-[#fecaca]">
                    <AlertCircleIcon size={14} className="text-[#ef4444] shrink-0" />
                    <p className="text-xs text-[#f87171]">{profileError}</p>
                  </div>
                )}
                {profileSuccess && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-[#dcfce7] border border-[#bbf7d0]">
                    <CheckCircleIcon size={14} className="text-[#4ade80] shrink-0" />
                    <p className="text-xs text-[#4ade80]">{profileSuccess}</p>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="w-full py-3 rounded-xl bg-[#e9a000] text-[#0a0a0d] font-semibold text-sm hover:bg-[#cc8e00] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 flex items-center justify-center gap-2"
                >
                  {profileLoading && <SpinnerIcon size={16} className="text-[#0a0a0d]" />}
                  저장하기
                </button>
              </form>
            </div>
          )}

          {/* ─────────────────────────── Password Tab ─────────────────────────── */}
          {activeTab === 'password' && (
            <div className="bg-[#ffffff] border border-[#e2e2ea] rounded-xl p-6 space-y-6 animate-fade-in shadow-sm">
              <div>
                <h2 className="text-base font-semibold text-[#18181b]">비밀번호 변경</h2>
                <p className="text-xs text-[#9898a8] mt-1">보안을 위해 주기적으로 변경하세요</p>
              </div>

              <form onSubmit={handlePasswordChange} className="space-y-5">
                {/* Current password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#6b6b7b] uppercase tracking-wider">
                    현재 비밀번호
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="현재 비밀번호"
                      className="w-full px-4 py-3 pr-11 rounded-xl bg-[#ffffff] border border-[#e2e2ea] text-[#18181b] text-sm placeholder-[#9898a8] focus:outline-none focus:border-[#e9a000] focus:ring-1 focus:ring-[#e9a000] transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9898a8] hover:text-[#6b6b7b] transition-colors"
                    >
                      {showCurrent ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                    </button>
                  </div>
                </div>

                {/* New password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#6b6b7b] uppercase tracking-wider">
                    새 비밀번호
                  </label>
                  <div className="relative">
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="새 비밀번호 (8자 이상)"
                      className="w-full px-4 py-3 pr-11 rounded-xl bg-[#ffffff] border border-[#e2e2ea] text-[#18181b] text-sm placeholder-[#9898a8] focus:outline-none focus:border-[#e9a000] focus:ring-1 focus:ring-[#e9a000] transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9898a8] hover:text-[#6b6b7b] transition-colors"
                    >
                      {showNew ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                    </button>
                  </div>
                  {newPassword && newPassword.length < 8 && (
                    <p className="text-xs text-[#f87171]">8자 이상 입력해주세요</p>
                  )}
                </div>

                {/* Confirm password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#6b6b7b] uppercase tracking-wider">
                    새 비밀번호 확인
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="새 비밀번호 재입력"
                      className="w-full px-4 py-3 pr-11 rounded-xl bg-[#ffffff] border border-[#e2e2ea] text-[#18181b] text-sm placeholder-[#9898a8] focus:outline-none focus:border-[#e9a000] focus:ring-1 focus:ring-[#e9a000] transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9898a8] hover:text-[#6b6b7b] transition-colors"
                    >
                      {showConfirm ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                    </button>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-[#f87171]">비밀번호가 일치하지 않습니다</p>
                  )}
                  {confirmPassword && newPassword === confirmPassword && newPassword.length >= 8 && (
                    <p className="text-xs text-[#4ade80]">비밀번호가 일치합니다</p>
                  )}
                </div>

                {/* Feedback */}
                {passwordError && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-[#fee2e2] border border-[#fecaca]">
                    <AlertCircleIcon size={14} className="text-[#ef4444] shrink-0" />
                    <p className="text-xs text-[#f87171]">{passwordError}</p>
                  </div>
                )}
                {passwordSuccess && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-[#dcfce7] border border-[#bbf7d0]">
                    <CheckCircleIcon size={14} className="text-[#4ade80] shrink-0" />
                    <p className="text-xs text-[#4ade80]">{passwordSuccess}</p>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="w-full py-3 rounded-xl bg-[#e9a000] text-[#0a0a0d] font-semibold text-sm hover:bg-[#cc8e00] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 flex items-center justify-center gap-2"
                >
                  {passwordLoading && <SpinnerIcon size={16} className="text-[#0a0a0d]" />}
                  비밀번호 변경
                </button>
              </form>
            </div>
          )}

          {/* ─────────────────────────── Settings Tab ─────────────────────────── */}
          {activeTab === 'settings' && (
            <div className="space-y-4 animate-fade-in">
              {/* Account info card */}
              <div className="bg-[#ffffff] border border-[#e2e2ea] rounded-xl p-6 space-y-3 shadow-sm">
                <h2 className="text-base font-semibold text-[#18181b]">계정 정보</h2>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2 border-b border-[#e2e2ea]">
                    <span className="text-xs text-[#9898a8]">이메일</span>
                    <span className="text-sm text-[#18181b]">{user?.email}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-[#e2e2ea]">
                    <span className="text-xs text-[#9898a8]">닉네임</span>
                    <span className="text-sm text-[#18181b]">{user?.nickname}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-xs text-[#9898a8]">역할</span>
                    <span className="text-sm text-[#18181b]">
                      {user?.role === 'STUDENT' ? '학생' : user?.role === 'TEACHER' ? '강사' : '관리자'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Danger zone */}
              <div className="bg-[#ffffff] border border-[#fecaca] rounded-xl p-6 space-y-4 shadow-sm">
                <div>
                  <h2 className="text-base font-semibold text-[#f87171]">위험 구역</h2>
                  <p className="text-xs text-[#9898a8] mt-1">
                    회원 탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다.
                  </p>
                </div>

                <div className="p-4 bg-[#f0f0f8] border border-[#e2e2ea] rounded-xl space-y-3">
                  <p className="text-xs text-[#6b6b7b]">
                    탈퇴를 진행하려면 아래 입력창에{' '}
                    <span className="font-bold text-[#f87171]">&apos;탈퇴&apos;</span>를 입력하세요.
                  </p>
                  <input
                    type="text"
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    placeholder="탈퇴"
                    className="w-full px-4 py-3 rounded-xl bg-[#ffffff] border border-[#e2e2ea] text-[#18181b] text-sm placeholder-[#9898a8] focus:outline-none focus:border-[#ef4444] focus:ring-1 focus:ring-[#ef4444] transition-all duration-200"
                  />

                  {deleteError && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-[#fee2e2] border border-[#fecaca]">
                      <AlertCircleIcon size={14} className="text-[#ef4444] shrink-0" />
                      <p className="text-xs text-[#f87171]">{deleteError}</p>
                    </div>
                  )}

                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading || deleteConfirm !== '탈퇴'}
                    className="w-full py-2.5 rounded-xl bg-[#ef4444] text-white font-semibold text-sm hover:bg-[#dc2626] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 flex items-center justify-center gap-2"
                  >
                    {deleteLoading && <SpinnerIcon size={16} className="text-white" />}
                    회원 탈퇴
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
