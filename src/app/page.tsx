// src/app/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useBooks, Book } from '@/contexts/BookContext';

interface ApiResponse {
  name: string;
  author: string;
  content: string;
  url: string;
}

const API_BASE_PATH = (process.env.NEXT_PUBLIC_AOZORA_API_BASE_PATH ?? '/api/aozora').replace(/\/$/, '');
const INTRO_LENGTH = 500;
const FETCH_BATCH_SIZE = 5;
const TARGET_QUEUE_SIZE = 10;
const MAX_FETCH_ATTEMPT_MULTIPLIER = 6;
const REQUEST_TIMEOUT_MS = 10000;
const TEXT_CHUNK_SIZE = 2;
const TEXT_ENTER_STAGGER_MS = 6;
const TEXT_ENTER_TAIL_STAGGER_MS = 2;
const TEXT_EXIT_STAGGER_MS = 3;
const TEXT_ENTER_DURATION_MS = 300;
const TEXT_EXIT_BASE_DURATION_MS = 300;
const TEXT_EXIT_DURATION_VARIANCE_MS = 220;
const TEXT_ENTER_FULL_STAGGER_INDEX = 90;
const MAX_TEXT_EXIT_STAGGER_INDEX = 90;

type ChoiceDirection = 'left' | 'right';

interface CharacterMotionProps {
  content: string;
  direction: ChoiceDirection | null;
  onExitComplete: () => void;
}

function isApiResponse(value: unknown): value is ApiResponse {
  if (!value || typeof value !== 'object') return false;

  const maybeResponse = value as Record<string, unknown>;
  return (
    typeof maybeResponse.name === 'string' &&
    typeof maybeResponse.author === 'string' &&
    typeof maybeResponse.content === 'string' &&
    typeof maybeResponse.url === 'string'
  );
}

function createBook(data: ApiResponse): Book {
  return {
    id: `${data.url}-${data.name}-${data.author}`,
    ...data,
  };
}

function createRequestTimeout() {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  return { controller, timeoutId };
}

async function fetchRandomNovel(): Promise<Book> {
  const { controller, timeoutId } = createRequestTimeout();

  try {
    const response = await fetch(`${API_BASE_PATH}/search?num_chars=${INTRO_LENGTH}`, {
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`API responded with ${response.status}`);
    }

    const data: unknown = await response.json();
    if (!isApiResponse(data)) {
      throw new Error('API response shape is invalid');
    }

    return createBook(data);
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function fetchRandomNovels(count: number): Promise<Book[]> {
  const { controller, timeoutId } = createRequestTimeout();

  try {
    const response = await fetch(`${API_BASE_PATH}/search/batch?count=${count}&num_chars=${INTRO_LENGTH}`, {
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Batch API responded with ${response.status}`);
    }

    const data: unknown = await response.json();
    if (!Array.isArray(data)) {
      throw new Error('Batch API response shape is invalid');
    }

    return data.filter(isApiResponse).map(createBook);
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function getTextEnterDelay(index: number) {
  if (index <= TEXT_ENTER_FULL_STAGGER_INDEX) {
    return index * TEXT_ENTER_STAGGER_MS;
  }

  return (
    TEXT_ENTER_FULL_STAGGER_INDEX * TEXT_ENTER_STAGGER_MS +
    (index - TEXT_ENTER_FULL_STAGGER_INDEX) * TEXT_ENTER_TAIL_STAGGER_MS
  );
}

function CharacterMotion({ content, direction, onExitComplete }: CharacterMotionProps) {
  const segments = useMemo(
    () => Array.from(content).reduce<string[]>((chunks, character) => {
      if (character === '\n') {
        chunks.push(character);
        return chunks;
      }

      const lastChunk = chunks[chunks.length - 1];
      if (!lastChunk || lastChunk === '\n' || Array.from(lastChunk).length >= TEXT_CHUNK_SIZE) {
        chunks.push(character);
        return chunks;
      }

      chunks[chunks.length - 1] = `${lastChunk}${character}`;
      return chunks;
    }, []),
    [content]
  );

  useEffect(() => {
    if (!direction) return;

    const timeoutId = window.setTimeout(
      onExitComplete,
      TEXT_EXIT_BASE_DURATION_MS + TEXT_EXIT_DURATION_VARIANCE_MS + MAX_TEXT_EXIT_STAGGER_INDEX * TEXT_EXIT_STAGGER_MS
    );

    return () => window.clearTimeout(timeoutId);
  }, [direction, onExitComplete]);

  return (
    <p
      key={content}
      className={`character-text whitespace-pre-wrap text-base leading-8 text-[var(--foreground)] sm:text-lg ${
        direction ? `is-leaving-${direction}` : 'is-entering'
      }`}
      style={{
        '--text-enter-duration': `${TEXT_ENTER_DURATION_MS}ms`,
      } as React.CSSProperties}
    >
      {segments.map((segment, index) => {
        if (segment === '\n') {
          return <br key={`line-${index}`} />;
        }

        return (
          <span
            key={`${segment}-${index}`}
            className="text-segment inline-block"
            style={{
              '--text-enter-delay': `${getTextEnterDelay(index)}ms`,
              '--text-exit-delay': `${Math.min(index, MAX_TEXT_EXIT_STAGGER_INDEX) * TEXT_EXIT_STAGGER_MS}ms`,
              '--text-exit-duration': `${TEXT_EXIT_BASE_DURATION_MS + ((index * 37) % TEXT_EXIT_DURATION_VARIANCE_MS)}ms`,
              '--text-exit-x': `${96 + (index % 12) * 5}px`,
              '--text-exit-y': `${-4 + (index % 5) * 2}px`,
            } as React.CSSProperties}
          >
            {segment.replaceAll(' ', '\u00A0')}
          </span>
        );
      })}
    </p>
  );
}

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest('button, a, input, textarea, select, [data-ignore-swipe]'));
}

export default function Home() {
  const { queuedBooks: novels, setQueuedBooks: setNovels, addLikedBook, likedBooks, favoriteBooks } = useBooks();
  const [isFetching, setIsFetching] = useState(false);
  const [pendingChoice, setPendingChoice] = useState<'left' | 'right' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const knownBookIdsRef = useRef<Set<string>>(new Set());
  const isFetchingRef = useRef(false);
  const pointerStartXRef = useRef<number | null>(null);

  const fetchNovels = useCallback(async (count: number) => {
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;
    setIsFetching(true);
    setErrorMessage(null);

    const fetchedNovels: Book[] = [];
    const existingIds = new Set(knownBookIdsRef.current);
    let lastError = '';

    try {
      const maxAttempts = count * MAX_FETCH_ATTEMPT_MULTIPLIER;

      for (let attempts = 0; fetchedNovels.length < count && attempts < maxAttempts;) {
        const remainingCount = count - fetchedNovels.length;
        const requestCount = Math.min(remainingCount, maxAttempts - attempts);
        const results = await Promise.allSettled([fetchRandomNovels(requestCount)]);

        attempts += requestCount;

        for (const result of results) {
          if (result.status === 'rejected') {
            lastError = result.reason instanceof Error ? result.reason.message : 'Unknown API error';
            const fallbackResults = await Promise.allSettled(
              Array.from({ length: requestCount }, () => fetchRandomNovel())
            );

            for (const fallbackResult of fallbackResults) {
              if (fallbackResult.status === 'rejected') {
                lastError = fallbackResult.reason instanceof Error ? fallbackResult.reason.message : 'Unknown API error';
                continue;
              }

              if (!existingIds.has(fallbackResult.value.id)) {
                fetchedNovels.push(fallbackResult.value);
                existingIds.add(fallbackResult.value.id);
              }

              if (fetchedNovels.length >= count) {
                break;
              }
            }

            break;
          }

          for (const newBook of result.value) {
            if (!existingIds.has(newBook.id)) {
              fetchedNovels.push(newBook);
              existingIds.add(newBook.id);
            }

            if (fetchedNovels.length >= count) {
              break;
            }
          }

          if (fetchedNovels.length >= count) {
            break;
          }
        }
      }

      if (fetchedNovels.length > 0) {
        setNovels(prev => [...fetchedNovels, ...prev]);
      } else {
        setErrorMessage(
          lastError
            ? `作品を取得できませんでした。API設定または接続状態を確認してください。(${lastError})`
            : '作品を取得できませんでした。時間をおいてもう一度お試しください。'
        );
      }
    } finally {
      setIsFetching(false);
      isFetchingRef.current = false;
    }
  }, [setNovels]);

  useEffect(() => {
    knownBookIdsRef.current = new Set([...novels, ...likedBooks, ...favoriteBooks].map(b => b.id));
  }, [novels, likedBooks, favoriteBooks]);

  useEffect(() => {
    if (novels.length < TARGET_QUEUE_SIZE) {
      void fetchNovels(Math.min(FETCH_BATCH_SIZE, TARGET_QUEUE_SIZE - novels.length));
    }
  }, [fetchNovels, novels.length]);

  const currentNovel = novels.length > 0 ? novels[novels.length - 1] : null;

  const handleChoice = useCallback((direction: ChoiceDirection) => {
    if (!currentNovel || pendingChoice) return;

    setPendingChoice(direction);
  }, [currentNovel, pendingChoice]);

  const completeChoice = useCallback(() => {
    if (!pendingChoice || !currentNovel) return;

    if (pendingChoice === 'right') {
      addLikedBook(currentNovel);
    }

    setNovels(prev => prev.slice(0, prev.length - 1));
    setPendingChoice(null);
  }, [pendingChoice, currentNovel, addLikedBook, setNovels]);

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!currentNovel || pendingChoice || isInteractiveTarget(event.target)) return;
    pointerStartXRef.current = event.clientX;
  }, [currentNovel, pendingChoice]);

  const handlePointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!currentNovel || pendingChoice || pointerStartXRef.current === null) return;

    const offsetX = event.clientX - pointerStartXRef.current;
    pointerStartXRef.current = null;

    if (offsetX > 80) handleChoice('right');
    else if (offsetX < -80) handleChoice('left');
  }, [currentNovel, handleChoice, pendingChoice]);

  const handlePointerCancel = useCallback(() => {
    pointerStartXRef.current = null;
  }, []);

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (event.key === 'ArrowLeft') handleChoice('left');
    else if (event.key === 'ArrowRight') handleChoice('right');
  }, [handleChoice]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  return (
    <div
      className="flex min-h-[calc(100vh-5rem)] w-full touch-pan-y select-none flex-col items-center justify-center gap-7 bg-[var(--background)] px-4 py-7"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onPointerLeave={handlePointerCancel}
    >
      <div className="card-stage relative flex w-full max-w-xl items-center justify-center">
        {isFetching && novels.length === 0 && (
          <div className="flex flex-col items-center gap-5 text-[var(--muted)]">
            <span className="breath-loader" aria-hidden="true" />
            <p className="text-sm">しばし</p>
          </div>
        )}

        {errorMessage && novels.length === 0 && (
          <div className="max-w-md rounded-lg border border-[var(--line)] bg-[var(--surface)] p-6 text-center paper-shadow">
            <p className="text-sm leading-relaxed text-[var(--foreground)]">{errorMessage}</p>
            <button
              type="button"
              onClick={() => void fetchNovels(FETCH_BATCH_SIZE)}
              className="mt-5 rounded-full border border-[var(--line)] px-5 py-2 text-sm text-[var(--foreground)]"
            >
              再読み込み
            </button>
          </div>
        )}
        
        {currentNovel && (
          <div
            className="reading-pane absolute h-full w-full overflow-hidden"
            draggable={false}
          >
            <div className="novel-scroll-window hidden-scrollbar overflow-y-auto px-8 pb-8 pt-9 sm:px-10">
              <CharacterMotion
                key={currentNovel.id}
                content={currentNovel.content}
                direction={pendingChoice}
                onExitComplete={completeChoice}
              />
            </div>
          </div>
        )}
      </div>

      <div className="z-10 flex gap-5">
        <button
          type="button"
          onClick={() => handleChoice('left')}
          data-ignore-swipe
          className="grid h-14 w-14 place-items-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] disabled:cursor-not-allowed disabled:opacity-40"
          disabled={novels.length === 0 || pendingChoice !== null}
          aria-label="流す"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" d="M7 17L17 7" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => handleChoice('right')}
          data-ignore-swipe
          className="grid h-14 w-14 place-items-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-40"
          disabled={novels.length === 0 || pendingChoice !== null}
          aria-label="思い出に残す"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 4.5h8a1 1 0 011 1v14l-5-3-5 3v-14a1 1 0 011-1z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
