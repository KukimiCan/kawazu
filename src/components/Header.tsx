// src/components/Header.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { AppFont, FONT_OPTIONS, useDisplay } from '@/contexts/DisplayContext';
import HelpModal from './HelpModal';

export default function Header() {
  const pathname = usePathname();
  const { font, setFont } = useDisplay();
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isFontMenuOpen, setIsFontMenuOpen] = useState(false);

  const linkStyle = "relative px-2 py-2 text-sm text-[var(--muted)] transition-colors hover:text-[var(--foreground)]";
  const activeLinkStyle = "text-[var(--foreground)] after:absolute after:left-1/2 after:bottom-1 after:h-px after:w-6 after:-translate-x-1/2 after:bg-[var(--foreground)]";

  const handleFontChange = (nextFont: AppFont) => {
    setFont(nextFont);
    setIsFontMenuOpen(false);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-20 border-b border-[var(--line)]/70 bg-[var(--background)]/86 backdrop-blur-md">
        <nav className="mx-auto grid h-20 max-w-5xl grid-cols-[1fr_auto_1fr] items-center px-5">
          <div className="text-xs tracking-[0.24em] text-[var(--muted)]">kawazu</div>

          <div className="flex items-center gap-8">
            <Link
              href="/"
              className={`${linkStyle} ${pathname === '/' ? activeLinkStyle : ''}`}
              aria-current={pathname === '/' ? 'page' : undefined}
            >
              出会う
            </Link>
            <Link
              href="/list"
              className={`${linkStyle} ${pathname === '/list' ? activeLinkStyle : ''}`}
              aria-current={pathname === '/list' ? 'page' : undefined}
            >
              思い出す
            </Link>
          </div>

          <div className="flex items-center justify-end gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsFontMenuOpen((isOpen) => !isOpen)}
                className="grid h-9 w-9 place-items-center rounded-full text-sm text-[var(--muted)] transition-colors hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]"
                aria-label="書体を選ぶ"
                aria-expanded={isFontMenuOpen}
              >
                字
              </button>
              {isFontMenuOpen && (
                <div className="absolute right-0 mt-3 max-h-[min(70vh,360px)] w-52 overflow-y-auto rounded-lg border border-[var(--line)] bg-[var(--surface)] p-1.5 shadow-[0_18px_48px_rgb(31_36_32_/_0.12)]">
                  {FONT_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleFontChange(option.id)}
                      className={`mt-0.5 flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors first:mt-0 hover:bg-[var(--surface-soft)] ${font === option.id ? 'text-[var(--foreground)]' : 'text-[var(--muted)]'}`}
                    >
                      <span>{option.label}</span>
                      {font === option.id && <span className="text-xs">一</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsHelpModalOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-full text-[var(--muted)] transition-colors hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]"
              aria-label="ヘルプ"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 17.5h.01M9.6 9.6a2.6 2.6 0 115.02.94c-.42.72-1.15 1.08-1.79 1.46-.59.35-.83.76-.83 1.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        </nav>
      </header>
      <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
    </>
  );
}
