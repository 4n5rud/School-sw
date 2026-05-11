import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-[#e2e2ea]">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-10 mb-10">
          <div>
            <div className="flex items-center gap-0.5 mb-4">
              <span className="text-lg font-bold text-[#e9a000]">Stock</span>
              <span className="text-lg font-bold text-[#18181b]">Class</span>
            </div>
            <p className="text-sm text-[#9898a8] leading-relaxed">
              초보 투자자를 위한 신뢰할 수 있는<br />금융 교육 플랫폼
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[#18181b] mb-4">서비스</h4>
            <ul className="space-y-2.5 text-sm text-[#9898a8]">
              <li><Link href="/" className="hover:text-[#6b6b7b] transition-colors duration-150">강의 탐색</Link></li>
              <li><a href="#" className="hover:text-[#6b6b7b] transition-colors duration-150">공지사항</a></li>
              <li><a href="#" className="hover:text-[#6b6b7b] transition-colors duration-150">FAQ</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[#18181b] mb-4">회사</h4>
            <ul className="space-y-2.5 text-sm text-[#9898a8]">
              <li><a href="#" className="hover:text-[#6b6b7b] transition-colors duration-150">문의하기</a></li>
              <li><a href="#" className="hover:text-[#6b6b7b] transition-colors duration-150">채용정보</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[#18181b] mb-4">법적 정보</h4>
            <ul className="space-y-2.5 text-sm text-[#9898a8]">
              <li><a href="#" className="hover:text-[#6b6b7b] transition-colors duration-150">이용약관</a></li>
              <li><a href="#" className="hover:text-[#6b6b7b] transition-colors duration-150">개인정보보호정책</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#e2e2ea] pt-8 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-sm text-[#9898a8]">&copy; 2025 StockClass. All rights reserved.</p>
          <p className="text-xs text-[#d0d0dc]">투자에는 위험이 따릅니다. 교육 목적으로만 활용하세요.</p>
        </div>
      </div>
    </footer>
  );
}
