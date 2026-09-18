'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useBooks } from '@/contexts/BookContext';
import { fetchNovel, fetchNovels } from '@/lib/api';
import type { Book } from '@/lib/books';

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
    try {
      if (queue.current.length === 0) {
        // Render the first usable work before asking for the rest of the queue.
        for (let attempt = 0; attempt < 3 && queue.current.length === 0; attempt++) {
          append([await fetchNovel(controller.signal)]);
        }
      }
      let added = 0;
      for (let attempt = 0; attempt < 2 && added === 0; attempt++) {
        added += append(await fetchNovels(3, controller.signal));
      }
      if (!added && !controller.signal.aborted) setError('まだ読んでいない作品が見つかりませんでした。もう一度探せます。');
    } catch {
      if (!controller.signal.aborted) setError('作品を読み込めませんでした。少し待ってから、もう一度お試しください。');
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
