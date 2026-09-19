'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useBooks } from '@/contexts/BookContext';
import { fetchNovel, fetchNovels } from '@/lib/api';
import type { Book } from '@/lib/books';

const MINIMUM_QUEUE_SIZE = 2;
const REFILL_BATCH_SIZE = 4;
const REFILL_ATTEMPTS = 3;

function waitForRetry(signal: AbortSignal, delayMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(finish, delayMs);

    function finish() {
      signal.removeEventListener('abort', abort);
      resolve();
    }

    function abort() {
      window.clearTimeout(timeout);
      signal.removeEventListener('abort', abort);
      reject(new DOMException('Aborted', 'AbortError'));
    }

    if (signal.aborted) abort();
    else signal.addEventListener('abort', abort, { once: true });
  });
}

export function useNovelQueue() {
  const { queuedBooks, setQueuedBooks, likedBooks, favoriteBooks, isHydrated } = useBooks();
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = useRef<AbortController | null>(null);
  const known = useRef(new Set<string>());
  const queue = useRef(queuedBooks);
  queue.current = queuedBooks;

  useEffect(() => {
    for (const book of [...queuedBooks, ...likedBooks, ...favoriteBooks]) known.current.add(book.id);
  }, [queuedBooks, likedBooks, favoriteBooks]);

  useEffect(() => () => { pending.current?.abort(); pending.current = null; }, []);

  const refill = useCallback(async () => {
    if (pending.current || !isHydrated) return;
    const controller = new AbortController();
    pending.current = controller;
    setIsFetching(true);
    setError(null);
    const append = (books: Book[]) => {
      if (controller.signal.aborted) return 0;
      const fresh = books.filter((book) => {
        if (known.current.has(book.id)) return false;
        known.current.add(book.id);
        return true;
      });
      if (fresh.length) {
        queue.current = [...queue.current, ...fresh];
        setQueuedBooks((previous) => [...previous, ...fresh]);
      }
      return fresh.length;
    };
    let sawRequestFailure = false;
    try {
      for (let attempt = 0; attempt < REFILL_ATTEMPTS && queue.current.length < MINIMUM_QUEUE_SIZE; attempt++) {
        try {
          append(await fetchNovels(REFILL_BATCH_SIZE, controller.signal));
        } catch {
          // A warm single-item cache can still answer when a batch request hits
          // a cold serverless instance. Try one item before backing off.
          try {
            append([await fetchNovel(controller.signal)]);
          } catch {
            sawRequestFailure = true;
          }
        }

        if (queue.current.length < MINIMUM_QUEUE_SIZE && attempt < REFILL_ATTEMPTS - 1) {
          await waitForRetry(controller.signal, 300 * (attempt + 1));
        }
      }
      if (queue.current.length === 0 && !controller.signal.aborted) {
        setError(sawRequestFailure
          ? '作品を読み込めませんでした。少し待ってから、もう一度お試しください。'
          : 'まだ読んでいない作品が見つかりませんでした。もう一度探せます。');
      }
    } catch {
      if (!controller.signal.aborted && queue.current.length === 0) {
        setError('作品を読み込めませんでした。少し待ってから、もう一度お試しください。');
      }
    } finally {
      if (pending.current === controller) {
        pending.current = null;
        setIsFetching(false);
      }
    }
  }, [isHydrated, setQueuedBooks]);

  useEffect(() => {
    if (isHydrated && queuedBooks.length < 2 && !error) void refill();
  }, [isHydrated, queuedBooks.length, error, refill]);

  return { isFetching, error, refill };
}
