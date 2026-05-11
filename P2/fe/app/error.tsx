'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { AlertCircleIcon, HomeIcon } from '@/components/Icons';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f4f8]">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center animate-fade-in max-w-md w-full">
          {/* Error icon */}
          <div className="w-20 h-20 rounded-full bg-[#fee2e2] border border-[#fecaca] flex items-center justify-center mx-auto mb-6">
            <AlertCircleIcon size={36} className="text-[#ef4444]" />
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-bold text-[#18181b] mb-3">
            오류가 발생했습니다
          </h1>

          {/* Error message */}
          {error?.message && (
            <div className="bg-[#ffffff] border border-[#e2e2ea] rounded-xl p-4 mb-6 text-left shadow-sm">
              <p className="text-xs font-mono text-[#6b6b7b] break-all leading-relaxed">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-[#9898a8] mt-2">
                  오류 ID: <span className="font-mono">{error.digest}</span>
                </p>
              )}
            </div>
          )}

          {!error?.message && (
            <p className="text-sm text-[#6b6b7b] mb-6">
              예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e9a000] text-[#0a0a0d] font-semibold text-sm hover:bg-[#cc8e00] transition-all duration-150"
            >
              다시 시도
            </button>

            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#f0f0f8] border border-[#e2e2ea] text-[#18181b] font-medium text-sm hover:bg-[#e8e8f2] hover:border-[#d0d0dc] transition-all duration-150"
            >
              <HomeIcon size={14} />
              홈으로
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
