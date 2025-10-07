// src/components/Header.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react'; // ★ useStateをインポート
import HelpModal from './HelpModal'; // ★ HelpModalをインポート

export default function Header() {
  const pathname = usePathname();
  // ★ モーダルの表示状態を管理するstateをHeader内に定義
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  const linkStyle = "px-4 py-2 rounded-md text-sm font-medium transition-colors";
  const activeLinkStyle = "bg-gray-200 text-gray-900";
  const inactiveLinkStyle = "text-gray-500 hover:bg-gray-100";

  return (
    // ★ React Fragment (<>) で全体を囲む
    <>
      <header className="fixed top-0 left-0 right-0 z-10 bg-white bg-opacity-80 backdrop-blur-sm border-b border-gray-200">
        <nav className="flex justify-center items-center p-4 space-x-4">
          <Link href="/" className={`${linkStyle} ${pathname === '/' ? activeLinkStyle : inactiveLinkStyle}`}>
            出会う
          </Link>
          <Link href="/list" className={`${linkStyle} ${pathname === '/list' ? activeLinkStyle : inactiveLinkStyle}`}>
            思い出す
          </Link>
          {/* ★ ヘルプアイコンボタン */}
          <button
            onClick={() => setIsHelpModalOpen(true)}
            className="p-2 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"
            aria-label="ヘルプ"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </nav>
      </header>
      {/* ★ ヘルプモーダルをHeaderコンポーネント内で呼び出す */}
      <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
    </>
  );
}