'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode, type Dispatch, type SetStateAction } from 'react';
import { readLibrary, writeLibrary, placeBook, type Book, type LibraryState, type Shelf } from '@/lib/books';
export type { Book } from '@/lib/books';

interface BookContextType {
  queuedBooks: Book[];
  setQueuedBooks: Dispatch<SetStateAction<Book[]>>;
  likedBooks: Book[];
  favoriteBooks: Book[];
  isHydrated: boolean;
  storageError: string | null;
  placeOnShelf: (book: Book, shelf: Shelf | null) => void;
}

const BookContext = createContext<BookContextType | undefined>(undefined);

export function BookProvider({ children }: { children: ReactNode }) {
  const [queuedBooks, setQueuedBooks] = useState<Book[]>([]);
  const [library, setLibrary] = useState<LibraryState>({ liked: [], favorites: [] });
  const [isHydrated, setIsHydrated] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [canPersist, setCanPersist] = useState(false);

  useEffect(() => {
    try {
      setLibrary(readLibrary(localStorage));
      setCanPersist(true);
    } catch {
      // Preserve inaccessible/corrupt data; do not overwrite it with an empty library.
      setStorageError('保存データを読み込めませんでした。この画面での変更は保存されません。');
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated || !canPersist) return;
    try {
      writeLibrary(localStorage, library);
      setStorageError(null);
    } catch {
      setStorageError('このブラウザに保存できません。画面を閉じると今回の変更が失われる場合があります。');
    }
  }, [library, isHydrated, canPersist]);

  const placeOnShelf = useCallback((book: Book, shelf: Shelf | null) => {
    setLibrary((previous) => placeBook(previous, book, shelf));
  }, []);

  const value = useMemo(() => ({ queuedBooks, setQueuedBooks,
    likedBooks: library.liked, favoriteBooks: library.favorites,
    isHydrated, storageError, placeOnShelf,
  }), [queuedBooks, library, isHydrated, storageError, placeOnShelf]);

  return <BookContext.Provider value={value}>{children}</BookContext.Provider>;
}

export function useBooks() {
  const context = useContext(BookContext);
  if (!context) throw new Error('useBooks must be used within a BookProvider');
  return context;
}
