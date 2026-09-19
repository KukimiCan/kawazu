'use client';

import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { animate, motion, useMotionValue, useReducedMotion, useTransform, type PanInfo } from 'motion/react';
import { ArrowDown, ArrowLeft, Bookmark, Check, LoaderCircle, RotateCcw } from 'lucide-react';
import { useBooks } from '@/contexts/BookContext';
import { useDisplay } from '@/contexts/DisplayContext';
import { useNovelQueue } from '@/hooks/useNovelQueue';
import { swipeDirection, type Book, type Shelf } from '@/lib/books';

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest('button, a, input, textarea, select, [contenteditable], dialog'));
}

const WritingText = memo(function WritingText({ content }: { content: string }) {
  return <p className="reading-text reader-copy" aria-label={content}>
    {Array.from(content).map((character, index) => character === '\n'
      ? <br key={index} aria-hidden="true" />
      : <span key={index} aria-hidden="true" className="writing-character"
        style={{ '--writing-delay': String(index * 12) + 'ms' } as CSSProperties}>{character}</span>)}
  </p>;
});

export default function Home() {
  const { queuedBooks, setQueuedBooks, likedBooks, favoriteBooks, placeOnShelf, isHydrated } = useBooks();
  const { font, textSize } = useDisplay();
  const { isFetching, error, refill } = useNovelQueue();
  const [lastChoice, setLastChoice] = useState<{ book: Book; saved: boolean; previousShelf: Shelf | null } | null>(null);
  const [message, setMessage] = useState('');
  const [phase, setPhase] = useState<'rest' | 'skip' | 'save'>('rest');
  const [intent, setIntent] = useState<'left' | 'right' | null>(null);
  const [canScroll, setCanScroll] = useState(false);
  const [excerptHeight, setExcerptHeight] = useState<number>();
  const activeBook = queuedBooks[0] ?? null;
  const choiceLock = useRef(false);
  const mounted = useRef(true);
  const roomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const animations = useRef<ReturnType<typeof animate>[]>([]);
  const reducedMotion = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotation = useMotionValue(0);
  const opacity = useMotionValue(1);
  const erase = useMotionValue(0);
  const maskImage = useTransform(erase, (progress) =>
    `linear-gradient(135deg, #000 ${100 - progress * 120}%, transparent ${120 - progress * 120}%)`);

  useLayoutEffect(() => {
    // Reset only after React has replaced the outgoing work, never on its last frame.
    x.set(0);
    y.set(0);
    rotation.set(0);
    opacity.set(1);
    erase.set(0);
    choiceLock.current = false;
    setPhase('rest');
  }, [activeBook?.id, x, y, rotation, opacity, erase]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      animations.current.forEach((animation) => animation.stop());
    };
  }, []);

  useLayoutEffect(() => {
    const room = roomRef.current;
    const scroller = scrollRef.current;
    if (!room || !scroller) return;
    let cancelled = false;
    const measure = () => {
      if (cancelled) return;
      const text = scroller.querySelector('.reading-text');
      if (!text) return;
      const lineHeight = parseFloat(getComputedStyle(text).lineHeight);
      // Keep half a line visible at the lower edge at every font and viewport size.
      const lines = Math.max(1, Math.floor(room.clientHeight / lineHeight - 0.5));
      const height = (lines + 0.5) * lineHeight;
      setExcerptHeight(height);
      setCanScroll(scroller.scrollTop + height < scroller.scrollHeight - 2);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(room);
    measure();
    void document.fonts.ready.then(measure);
    return () => { cancelled = true; observer.disconnect(); };
  }, [activeBook?.id, font, textSize]);

  const commitChoice = useCallback((book: Book, save: boolean) => {
    const previousShelf = favoriteBooks.some((item) => item.id === book.id) ? 'favorites'
      : likedBooks.some((item) => item.id === book.id) ? 'liked' : null;
    if (save && !previousShelf) placeOnShelf(book, 'liked');
    setLastChoice({ book, saved: save, previousShelf });
    setQueuedBooks((previous) => previous.filter((item) => item.id !== book.id));
    setMessage(save ? '栞をはさみました' : '次の一篇へ');
  }, [favoriteBooks, likedBooks, placeOnShelf, setQueuedBooks]);

  const choose = useCallback(async (save: boolean, releaseVelocity = 0) => {
    if (!activeBook || choiceLock.current) return;
    choiceLock.current = true;
    setPhase(save ? 'save' : 'skip');
    setIntent(null);
    animations.current.forEach((animation) => animation.stop());
    const duration = reducedMotion ? 0 : save ? 1 : 0.9;
    const destination = reducedMotion ? 0 : save ? Math.max(100, x.get() + 64) : Math.min(-36, x.get() - 28);
    const travel = Math.max(1, Math.abs(destination - x.get()));
    // Match the drag's release speed without a spring rebound or a stop at release.
    const departureEase: [number, number, number, number] = releaseVelocity
      ? [0.24, Math.min(0.85, Math.abs(releaseVelocity) * 0.2 * duration * 0.24 / travel), 0.4, 1]
      : [0.32, 0, 0.45, 1];
    animations.current = [
      animate(x, destination, { duration, ease: departureEase }),
      animate(y, save && !reducedMotion ? -12 : 0, { duration, ease: [0.32, 0, 0.45, 1] }),
      animate(rotation, save && !reducedMotion ? 0.8 : 0, { duration, ease: [0.32, 0, 0.45, 1] }),
      animate(opacity, [1, 1, 0], { duration, times: [0, 0.25, 1], ease: 'easeInOut' }),
      animate(erase, save || reducedMotion ? 0 : 1, { duration, ease: [0.4, 0, 0.4, 1] }),
    ];
    await Promise.all(animations.current);
    if (!mounted.current) return;
    commitChoice(activeBook, save);
  }, [activeBook, commitChoice, erase, opacity, reducedMotion, rotation, x, y]);

  const undo = () => {
    if (!lastChoice || choiceLock.current) return;
    animations.current.forEach((animation) => animation.stop());
    if (lastChoice.saved) placeOnShelf(lastChoice.book, lastChoice.previousShelf);
    setQueuedBooks((previous) => [lastChoice.book, ...previous.filter((book) => book.id !== lastChoice.book.id)]);
    setLastChoice(null);
    setMessage('ひとつ前の作品に戻りました');
    x.set(0);
    opacity.set(1);
    setIntent(null);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey ||
        isInteractiveTarget(event.target) || document.querySelector('dialog[open]')) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        void choose(event.key === 'ArrowRight');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [choose]);

  const onPan = (event: PointerEvent, info: PanInfo) => {
    if (!activeBook || choiceLock.current || isInteractiveTarget(event.target) || Math.abs(info.offset.y) > Math.abs(info.offset.x)) return;
    animations.current.forEach((animation) => animation.stop());
    x.set(reducedMotion ? 0 : Math.max(-48, Math.min(48, info.offset.x * 0.2)));
    setIntent(swipeDirection(info.offset.x, info.offset.y));
  };
  const onPanEnd = (event: PointerEvent, info: PanInfo) => {
    if (choiceLock.current || isInteractiveTarget(event.target)) return;
    const direction = swipeDirection(info.offset.x, info.offset.y);
    if (direction) void choose(direction === 'right', info.velocity.x);
    else {
      setIntent(null);
      animations.current = [animate(x, 0, { duration: reducedMotion ? 0 : 0.3, ease: 'easeOut' })];
    }
  };

  return <div className="encounter">
    <div className="encounter-meta"><span>青空文庫</span><span>一篇のはじまり</span></div>
    <motion.div className="reader-layout" onPan={onPan} onPanEnd={onPanEnd}>
      <aside className="reader-margin"><span className="section-index" aria-hidden="true">01</span><h1>出会う</h1></aside>
      <section className="reader-stage" data-phase={phase} aria-label="作品の冒頭"
        aria-busy={!activeBook && (isFetching || !isHydrated)}>
        <div className="reader-room" ref={roomRef}>
          {activeBook ? queuedBooks.slice(0, 2).map((book, index) => <motion.div key={book.id}
            ref={index === 0 ? scrollRef : undefined} className="reader-scroll" tabIndex={index === 0 ? 0 : -1}
            data-active={index === 0} aria-hidden={index !== 0} inert={index !== 0}
            aria-label="冒頭文。上下にスクロールできます"
            style={index === 0 ? { x, y, rotate: rotation, opacity, maskImage, height: excerptHeight } : { opacity: 0, height: excerptHeight }}
            onScroll={index === 0 ? (event) => { const el = event.currentTarget; setCanScroll(el.scrollTop + el.clientHeight < el.scrollHeight - 2); } : undefined}>
            <WritingText content={book.content} />
            <span className="excerpt-end" aria-hidden="true">＊</span>
          </motion.div>) : error ? <div className="reader-state" role="alert">
            <h2>少し、ひと呼吸。</h2><p>{error}</p>
            <button type="button" className="secondary-button" onClick={() => void refill()} disabled={isFetching}>
              {isFetching ? <LoaderCircle className="spinner" size={17} /> : <RotateCcw size={17} />}
              {isFetching ? '探しています' : 'もう一度探す'}
            </button>
          </div> : <div className="reader-state" role="status"><span className="loading-mark" aria-hidden="true" /><span className="loading-label">一篇を探しています</span></div>}
        </div>
      </section>
      <aside className="reader-edge" data-phase={phase} aria-label="本文のスクロール">
        <span className="edge-line" aria-hidden="true" />
        <button className="icon-button scroll-button" title="続きをスクロール" aria-label="続きをスクロール" disabled={!canScroll || phase !== 'rest'}
          onClick={() => scrollRef.current?.scrollBy({ top: scrollRef.current.clientHeight * 0.8, behavior: reducedMotion ? 'instant' : 'smooth' })}><ArrowDown size={17} strokeWidth={1.5} /></button>
      </aside>
    </motion.div>
    <div className="reader-controls">
      <div className="reader-feedback" role="status" aria-live="polite">{message && <><span className="feedback-mark" aria-hidden="true">{lastChoice?.saved ? <Check size={13} /> : null}</span>{message}</>}</div>
      <div className="choice-buttons" data-busy={phase !== 'rest'}>
        <button type="button" className="choice-skip" data-intent={intent === 'left' || phase === 'skip'} onClick={() => void choose(false)} disabled={!activeBook || phase !== 'rest'}><ArrowLeft size={19} strokeWidth={1.5} /><span>次の一篇</span></button>
        <button type="button" className="icon-button undo-button" title="ひとつ戻る" aria-label="ひとつ戻る" onClick={undo} disabled={!lastChoice || phase !== 'rest'}><RotateCcw size={17} strokeWidth={1.5} /></button>
        <button type="button" className="choice-save" data-intent={intent === 'right' || phase === 'save'} onClick={() => void choose(true)} disabled={!activeBook || phase !== 'rest'}><Bookmark size={18} strokeWidth={1.5} /><span>栞をはさむ</span></button>
      </div>
    </div>
    <footer className="encounter-footer"><span>kawazu</span><a href="https://www.aozora.gr.jp/" target="_blank" rel="noopener noreferrer">青空文庫より</a></footer>
  </div>;
}
