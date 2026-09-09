'use client';

import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import Link from 'next/link';
import { useBooks } from '@/contexts/BookContext';
import { useNovelQueue } from '@/hooks/useNovelQueue';
import { swipeDirection, type Book, type Shelf } from '@/lib/books';

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest('button, a, input, textarea, select, [contenteditable], dialog'));
}

export default function Home() {
  const { queuedBooks, setQueuedBooks, likedBooks, favoriteBooks, placeOnShelf, isHydrated } = useBooks();
  const { isFetching, error, refill } = useNovelQueue();
  const [lastChoice, setLastChoice] = useState<{ book: Book; saved: boolean; previousShelf: Shelf | null } | null>(null);
  const [message, setMessage] = useState('');
  const pointer = useRef<{ x: number; y: number; id: number } | null>(null);
  const choiceLock = useRef(false);
  const current = queuedBooks[0] ?? null;

  useEffect(() => { choiceLock.current = false; }, [current?.id]);

  const choose = useCallback((save: boolean) => {
    if (!current || choiceLock.current) return;
    choiceLock.current = true;
    const previousShelf = favoriteBooks.some((book) => book.id === current.id) ? 'favorites'
      : likedBooks.some((book) => book.id === current.id) ? 'liked' : null;
    if (save && !previousShelf) placeOnShelf(current, 'liked');
    setLastChoice({ book: current, saved: save, previousShelf });
    setQueuedBooks((previous) => previous.filter((book) => book.id !== current.id));
    setMessage(save ? '栞をはさみました。' : '次の作品へ進みました。');
  }, [current, favoriteBooks, likedBooks, placeOnShelf, setQueuedBooks]);

  const undo = () => {
    if (!lastChoice) return;
    if (lastChoice.saved) placeOnShelf(lastChoice.book, lastChoice.previousShelf);
    setQueuedBooks((previous) => [lastChoice.book, ...previous.filter((book) => book.id !== lastChoice.book.id)]);
    setLastChoice(null);
    setMessage('ひとつ前の作品に戻りました。');
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey ||
        isInteractiveTarget(event.target) || document.querySelector('dialog[open]') || window.getSelection()?.toString()) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        choose(event.key === 'ArrowRight');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [choose]);

  const pointerDown = (event: PointerEvent<HTMLElement>) => {
    pointer.current = null;
    if (!event.isPrimary || event.button !== 0 || isInteractiveTarget(event.target)) return;
    pointer.current = { x: event.clientX, y: event.clientY, id: event.pointerId };
  };
  const pointerUp = (event: PointerEvent<HTMLElement>) => {
    const start = pointer.current;
    pointer.current = null;
    if (!start || start.id !== event.pointerId || window.getSelection()?.toString()) return;
    const direction = swipeDirection(event.clientX - start.x, event.clientY - start.y);
    if (direction) choose(direction === 'right');
  };

  return <div className="encounter">
    <h1 className="sr-only">作品との出会い</h1>
    <section className="reader-sheet" aria-label="作品の冒頭" aria-busy={!current && (isFetching || !isHydrated)}
      onPointerDown={pointerDown} onPointerUp={pointerUp} onPointerCancel={() => { pointer.current = null; }} onPointerLeave={() => { pointer.current = null; }}>
      {current ? <div className="reader-scroll" tabIndex={0} key={current.id} aria-label="冒頭文。上下にスクロールできます">
        <p className="reading-text reader-copy">{current.content}</p>
        <span className="excerpt-end" aria-hidden="true" />
      </div> : error ? <div className="reader-state" role="alert">
        <h2>読み込めませんでした</h2><p>{error}</p>
        <button type="button" className="primary-button" onClick={() => void refill()} disabled={isFetching}>{isFetching ? '探しています…' : 'もう一度探す'}</button>
      </div> : <div className="reader-state" role="status">
        <span className="loading-line" aria-hidden="true" /><span className="sr-only">作品を読み込んでいます</span>
      </div>}
    </section>
    <div className="reader-controls">
      <div className="choice-buttons">
        <button type="button" className="secondary-button" onClick={() => choose(false)} disabled={!current}>次の一篇</button>
        <button type="button" className="primary-button" onClick={() => choose(true)} disabled={!current}><svg className="bookmark-mark" width="12" height="18" viewBox="0 0 12 18" fill="none" aria-hidden="true"><path d="M2 1.5h8v14l-4-3-4 3z" stroke="currentColor" /></svg>栞をはさむ</button>
      </div>
      <div className="reader-secondary"><button type="button" className="text-button undo-button" onClick={undo} disabled={!lastChoice}>戻る</button></div>
      <div className="reader-feedback" role="status" aria-live="polite"><span className="sr-only">{message}</span>{message === '栞をはさみました。' && <Link href="/list">栞を見る</Link>}</div>
      {error && current && <p className="refill-error" role="status">次の作品の準備ができませんでした。<button type="button" className="text-button" disabled={isFetching} onClick={() => void refill()}>再試行</button></p>}
    </div>
  </div>;
}
