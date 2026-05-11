import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { HomeIcon } from '@/components/Icons';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f4f4f8]">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center animate-fade-in-up max-w-md w-full">
          {/* Large 404 */}
          <div className="relative mb-6">
            <p className="text-[160px] font-black leading-none text-[#e9a000] opacity-15 select-none">
              404
            </p>
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-8xl font-black text-[#e9a000] leading-none select-none">
                404
              </p>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-bold text-[#18181b] mb-3">
            페이지를 찾을 수 없습니다
          </h1>

          {/* Description */}
          <p className="text-sm text-[#6b6b7b] leading-relaxed mb-8">
            요청하신 페이지가 존재하지 않거나 이동되었습니다.
            <br />
            주소를 다시 확인하거나 홈으로 돌아가세요.
          </p>

          {/* Decorative divider */}
          <div className="w-16 h-px bg-[#e2e2ea] mx-auto mb-8" />

          {/* Home button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#e9a000] text-[#0a0a0d] font-semibold text-sm hover:bg-[#cc8e00] transition-all duration-150 shadow-lg shadow-[#e9a000]/20"
          >
            <HomeIcon size={16} />
            홈으로 돌아가기
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
