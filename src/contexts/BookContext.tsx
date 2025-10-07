// src/contexts/BookContext.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
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
  likedBooks: Book[];
  favoriteBooks: Book[];
  addLikedBook: (book: Book) => void;
  addFavoriteBook: (book: Book) => void;
  removeLikedBook: (bookId: string) => void;
}

// Contextを作成
const BookContext = createContext<BookContextType | undefined>(undefined);

// Contextを提供するためのProviderコンポーネント
export function BookProvider({ children }: { children: ReactNode }) {
  const [likedBooks, setLikedBooks] = useState<Book[]>([]);
  const [favoriteBooks, setFavoriteBooks] = useState<Book[]>([]);

  // 初回ロード時にlocalStorageからデータを復元
  useEffect(() => {
    try {
      const storedLiked = localStorage.getItem("likedBooks");
      if (storedLiked) setLikedBooks(JSON.parse(storedLiked));
      const storedFavorites = localStorage.getItem("favoriteBooks");
      if (storedFavorites) setFavoriteBooks(JSON.parse(storedFavorites));
    } catch (e) {
      console.error(e);
    }
  }, []);

  // likedBooksが更新されたらlocalStorageに保存
  useEffect(() => {
    localStorage.setItem("likedBooks", JSON.stringify(likedBooks));
  }, [likedBooks]);

  // favoriteBooksが更新されたらlocalStorageに保存
  useEffect(() => {
    localStorage.setItem("favoriteBooks", JSON.stringify(favoriteBooks));
  }, [favoriteBooks]);

  const addLikedBook = (book: Book) => {
    if (
      !likedBooks.some((b) => b.id === book.id) &&
      !favoriteBooks.some((b) => b.id === book.id)
    ) {
      setLikedBooks((prev) => [book, ...prev]);
    }
  };

  const addFavoriteBook = (book: Book) => {
    if (!favoriteBooks.some((b) => b.id === book.id)) {
      setFavoriteBooks((prev) => [book, ...prev]);
      // お気に入りに追加したら、興味ありリストからは削除する
      setLikedBooks((prev) => prev.filter((b) => b.id !== book.id));
    }
  };

  const removeLikedBook = (bookId: string) => {
    setLikedBooks((prev) => prev.filter((b) => b.id !== bookId));
  };

  const value = {
    likedBooks,
    favoriteBooks,
    addLikedBook,
    addFavoriteBook,
    removeLikedBook,
  };

  return <BookContext.Provider value={value}>{children}</BookContext.Provider>;
}

// Contextを簡単に使うためのカスタムフック
export function useBooks() {
  const context = useContext(BookContext);
  if (context === undefined) {
    throw new Error("useBooks must be used within a BookProvider");
  }
  return context;
}
