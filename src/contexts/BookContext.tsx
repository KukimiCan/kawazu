// src/contexts/BookContext.tsx
"use client";

import {
  createContext,
  Dispatch,
  useContext,
  useState,
  useEffect,
  ReactNode,
  SetStateAction,
  useCallback,
  useMemo,
} from "react";

// アプリケーション全体で使うBookの型
export interface Book {
  id: string;
  name: string;
  author: string;
  content: string;
  url: string;
}

// Contextが持つデータの型
interface BookContextType {
  queuedBooks: Book[];
  likedBooks: Book[];
  favoriteBooks: Book[];
  setQueuedBooks: Dispatch<SetStateAction<Book[]>>;
  addLikedBook: (book: Book) => void;
  addFavoriteBook: (book: Book) => void;
  removeLikedBook: (bookId: string) => void;
  removeFavoriteBook: (bookId: string) => void;
}

const BookContext = createContext<BookContextType | undefined>(undefined);

function isBook(value: unknown): value is Book {
  if (!value || typeof value !== "object") return false;

  const maybeBook = value as Record<string, unknown>;
  return (
    typeof maybeBook.id === "string" &&
    typeof maybeBook.name === "string" &&
    typeof maybeBook.author === "string" &&
    typeof maybeBook.content === "string" &&
    typeof maybeBook.url === "string"
  );
}

function readStoredBooks(key: string): Book[] {
  const storedValue = localStorage.getItem(key);
  if (!storedValue) return [];

  const parsedValue: unknown = JSON.parse(storedValue);
  if (!Array.isArray(parsedValue)) return [];

  return parsedValue.filter(isBook);
}

export function BookProvider({ children }: { children: ReactNode }) {
  const [queuedBooks, setQueuedBooks] = useState<Book[]>([]);
  const [likedBooks, setLikedBooks] = useState<Book[]>([]);
  const [favoriteBooks, setFavoriteBooks] = useState<Book[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      setLikedBooks(readStoredBooks("likedBooks"));
      setFavoriteBooks(readStoredBooks("favoriteBooks"));
    } catch (e) {
      console.error(e);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem("likedBooks", JSON.stringify(likedBooks));
  }, [isHydrated, likedBooks]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem("favoriteBooks", JSON.stringify(favoriteBooks));
  }, [isHydrated, favoriteBooks]);

  const addLikedBook = useCallback((book: Book) => {
    setLikedBooks((previousBooks) => {
      if (
        previousBooks.some((b) => b.id === book.id) ||
        favoriteBooks.some((b) => b.id === book.id)
      ) {
        return previousBooks;
      }

      return [book, ...previousBooks];
    });
  }, [favoriteBooks]);

  const addFavoriteBook = useCallback((book: Book) => {
    setFavoriteBooks((previousBooks) => {
      if (previousBooks.some((b) => b.id === book.id)) {
        return previousBooks;
      }

      return [book, ...previousBooks];
    });
    setLikedBooks((prev) => prev.filter((b) => b.id !== book.id));
  }, []);

  const removeLikedBook = useCallback((bookId: string) => {
    setLikedBooks((prev) => prev.filter((b) => b.id !== bookId));
  }, []);

  const removeFavoriteBook = useCallback((bookId: string) => {
    setFavoriteBooks((prev) => prev.filter((b) => b.id !== bookId));
  }, []);

  const value = useMemo(() => ({
    queuedBooks,
    likedBooks,
    favoriteBooks,
    setQueuedBooks,
    addLikedBook,
    addFavoriteBook,
    removeLikedBook,
    removeFavoriteBook,
  }), [
    queuedBooks,
    likedBooks,
    favoriteBooks,
    setQueuedBooks,
    addLikedBook,
    addFavoriteBook,
    removeLikedBook,
    removeFavoriteBook,
  ]);

  return <BookContext.Provider value={value}>{children}</BookContext.Provider>;
}

export function useBooks() {
  const context = useContext(BookContext);
  if (context === undefined) {
    throw new Error("useBooks must be used within a BookProvider");
  }
  return context;
}
