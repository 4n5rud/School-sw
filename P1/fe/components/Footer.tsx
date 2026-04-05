export default function Footer() {
  return (
    <footer className="bg-[#1a1a1a] text-gray-400 mt-20">
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
        {/* Top Section */}
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-lg font-bold mb-4"><span className="text-[#FFD700]">Stock</span><span className="text-[#ffffff]">Class</span></h3>
            <p className="text-sm text-gray-500">
              초보 투자자를 위한 신뢰할 수 있는 금융 교육 플랫폼
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-[#ffffff] font-semibold mb-4">서비스</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-[#ffffff] transition">
                  강의 탐색
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#ffffff] transition">
                  공지사항
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#ffffff] transition">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-[#ffffff] font-semibold mb-4">회사</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-[#ffffff] transition">
                  문의하기
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#ffffff] transition">
                  채용정보
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-[#ffffff] font-semibold mb-4">정보</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-[#ffffff] transition">
                  이용약관
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#ffffff] transition">
                  개인정보보호정책
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-700 pt-8 text-center text-sm">
          <p>&copy; 2024 StockClass. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
