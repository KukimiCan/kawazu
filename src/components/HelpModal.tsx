// src/components/HelpModal.tsx
import React, { useEffect } from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgb(31_36_32_/_0.22)] px-4 backdrop-blur-[2px]"
      onMouseDown={onClose}
    >
      <div
        className="relative max-h-[min(80vh,720px)] w-full max-w-md overflow-y-auto rounded-[3px] border border-[var(--line)] bg-[var(--surface)] p-8 paper-shadow"
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 id="help-modal-title" className="text-xl font-medium text-[var(--foreground)]">作法</h2>
        <p className="mt-5 text-sm leading-8 text-[var(--muted)]">
          題も作者も見ず、ただ冒頭だけを読む。
          残したいものは右へ。流したいものは左へ。
        </p>
        <ul className="mt-7 space-y-5 text-sm text-[var(--foreground)]">
          <li className="flex gap-4">
            <span className="mt-1 text-[var(--muted)]" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" d="M7 17L17 7" />
              </svg>
            </span>
            <span className="leading-7">左へ送ると、次の作品へ移ります。</span>
          </li>
          <li className="flex gap-4">
            <span className="mt-1 text-[var(--muted)]" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 4.5h8a1 1 0 011 1v14l-5-3-5 3v-14a1 1 0 011-1z" />
              </svg>
            </span>
            <span className="leading-7">右へ送ると、栞として思い出す場所に残ります。</span>
          </li>
          <li className="flex gap-4">
            <span className="mt-1 text-[var(--muted)]" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5.5h3.5v13H5zM10.25 4.5h3.5v14h-3.5zM15.5 6.5H19v12h-3.5z" />
                <path strokeLinecap="round" d="M4.5 18.5h15" />
              </svg>
            </span>
            <span className="leading-7">思い出す場所では、栞を本棚へ移せます。</span>
          </li>
          <li className="flex gap-4">
            <span className="mt-1 text-[var(--muted)]" aria-hidden="true">字</span>
            <span className="leading-7">右上の「字」から書体を選べます。</span>
          </li>
        </ul>
        <p className="mt-8 text-sm text-[var(--muted)]">
          よき出会いを。
        </p>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-[var(--muted)] transition-colors hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]"
          aria-label="閉じる"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" d="M7 17L17 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default HelpModal;
