// src/app/list/page.tsx
'use client';

import { useState } from 'react';
import { useBooks } from '@/contexts/BookContext';
import Link from 'next/link';

export default function ListPage() {
  const [activeTab, setActiveTab] = useState<'liked' | 'favorites'>('liked');
  const { likedBooks, favoriteBooks, addFavoriteBook, removeLikedBook, removeFavoriteBook } = useBooks();
  
  const tabStyle = "relative px-1 pb-3 text-sm transition-colors";
  const activeTabStyle = "text-[var(--foreground)] after:absolute after:left-0 after:bottom-0 after:h-px after:w-full after:bg-[var(--foreground)]";
  const inactiveTabStyle = "text-[var(--muted)] hover:text-[var(--foreground)]";

  const booksToDisplay = activeTab === 'liked' ? likedBooks : favoriteBooks;

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10 sm:py-14">
      <div className="mb-10 flex items-end justify-between border-b border-[var(--line)]">
        <div className="flex gap-8">
          <button
            type="button"
            onClick={() => setActiveTab('liked')}
            className={`${tabStyle} ${activeTab === 'liked' ? activeTabStyle : inactiveTabStyle}`}
            aria-pressed={activeTab === 'liked'}
          >
            栞 <span className="ml-1 text-xs text-[var(--muted)]">{likedBooks.length}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('favorites')}
            className={`${tabStyle} ${activeTab === 'favorites' ? activeTabStyle : inactiveTabStyle}`}
            aria-pressed={activeTab === 'favorites'}
          >
            本棚 <span className="ml-1 text-xs text-[var(--muted)]">{favoriteBooks.length}</span>
          </button>
        </div>
      </div>
      
      <div>
        {booksToDisplay.length === 0 ? (
          <div className="mt-20 text-center text-[var(--muted)]">
            <p className="text-sm">まだ何も残っていません。</p>
            <p className="mt-3 text-xs">一篇を右へ送ると、栞としてここに残ります。</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--line)]">
            {booksToDisplay.map((book) => (
              <article key={book.id} className="group py-7">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <h3 className="text-lg font-medium leading-snug text-[var(--foreground)]">{book.name}</h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">{book.author}</p>
                  </div>
                  {activeTab === 'liked' && (
                    <button
                      type="button"
                      onClick={() => addFavoriteBook(book)}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[var(--muted)] transition-colors hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]"
                      aria-label={`${book.name}を本棚に移す`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5.5h3.5v13H5zM10.25 4.5h3.5v14h-3.5zM15.5 6.5H19v12h-3.5z" />
                        <path strokeLinecap="round" d="M4.5 18.5h15" />
                      </svg>
                    </button>
                  )}
                </div>
                <p className="mt-4 line-clamp-3 text-sm leading-7 text-[var(--muted)]">
                  {book.content}
                </p>
                <div className="mt-5 flex items-center gap-5 text-sm">
                  <Link
                    href={book.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--foreground)] underline decoration-[var(--line)] underline-offset-4 transition-colors hover:decoration-[var(--foreground)]"
                  >
                    本文を読む
                  </Link>
                  <button
                    type="button"
                    onClick={() => activeTab === 'liked' ? removeLikedBook(book.id) : removeFavoriteBook(book.id)}
                    className="text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
                  >
                    削除
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
