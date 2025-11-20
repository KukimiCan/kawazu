// src/app/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useBooks, Book } from '@/contexts/BookContext';
import { motion, AnimatePresence, useAnimationControls, PanInfo } from 'framer-motion';


interface ApiResponse {
    name: string;
    author: string;
    content: string;
    url: string;
}

export default function Home() {
  // ... (useStateやuseEffectなどのフックは変更なし) ...
  const [novels, setNovels] = useState<Book[]>([]);
  const { addLikedBook, likedBooks, favoriteBooks } = useBooks();
  const [isLoading, setIsLoading] = useState(true);
  const animationControls = useAnimationControls();

  // ... (fetchNovelsやhandleChoiceなどの関数も変更なし) ...
  const fetchNovels = useCallback(async (count: number) => {
    if (novels.length === 0) setIsLoading(true);
    try {
      const fetchedNovels: Book[] = [];
      const existingIds = new Set([...novels, ...likedBooks, ...favoriteBooks].map(b => b.id));
      while (fetchedNovels.length < count) {
        // NEXT_PUBLIC_API_URLが「/api/aozora」に設定されているため、
        // 実行されるURLは「/api/aozora/search?num_chars=500」となり、CORSを回避
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        
        // 修正: URLを /search から組み立てる (APIのベースURLが /api/aozora の場合)
        const response = await fetch(`${apiUrl}/search?num_chars=500`); 
        
        if (response.ok) {
          const data: ApiResponse = await response.json();
          const newBook: Book = { id: `${data.name}-${data.author}`, ...data };
          if (!existingIds.has(newBook.id)) {
            fetchedNovels.push(newBook);
            existingIds.add(newBook.id);
          }
        }
      }
      setNovels(prev => [...fetchedNovels, ...prev]);
    } catch (error) {
      console.error("小説の取得に失敗しました:", error);
    } finally {
      setIsLoading(false);
    }
  }, [novels, likedBooks, favoriteBooks]);

  useEffect(() => {
    fetchNovels(5);
  }, []);

  const handleChoice = useCallback(async (direction: 'left' | 'right') => {
    if (novels.length === 0 || isLoading) return;
    
    const topCard = novels[novels.length - 1];
    
    await animationControls.start({
      x: direction === 'right' ? 500 : -500,
      opacity: 0,
      scale: 0.9,
      transition: { duration: 0.3 }
    });

    if (direction === 'right') {
      addLikedBook(topCard);
    }
    setNovels(prev => prev.slice(0, prev.length - 1));

    if (novels.length <= 3) {
      fetchNovels(5);
    }
  }, [novels, isLoading, animationControls, addLikedBook, fetchNovels]);

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (event.key === 'ArrowLeft') handleChoice('left');
    else if (event.key === 'ArrowRight') handleChoice('right');
  }, [handleChoice]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  const topCardId = novels.length > 0 ? novels[novels.length - 1].id : null;

  useEffect(() => {
    if (topCardId) {
      animationControls.set({
        x: 0,
        y: 0,
        scale: 1,
        opacity: 1,
      });
    }
  }, [topCardId, animationControls]);

  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-5rem)] w-full bg-gray-50 overflow-hidden">
      {/* 👇 ここの max-w-md を max-w-xl に変更 */}
      <div className="relative w-[90vw] h-[90vh] max-w-xl max-h-[800px] flex items-center justify-center">
        {isLoading && novels.length === 0 && <p className="text-center text-gray-500">作品を読み込んでいます...</p>}
        
        <AnimatePresence>
          {novels.map((book, index) => {
            const isTopCard = index === novels.length - 1;
            return (
              <motion.div
                key={book.id}
                className="absolute bg-white w-full h-full rounded-2xl shadow-xl p-8 flex items-start justify-center overflow-y-auto"
                style={{ zIndex: index }}
                animate={isTopCard ? animationControls : {
                    scale: 0.95 - (novels.length - index -1) * 0.05,
                    y: (novels.length - index-1) * -15,
                    opacity: 1 - (novels.length - index-1) * 0.2,
                }}
                drag={isTopCard ? "x" : false}
                dragConstraints={{ left: -150, right: 150, top: 0, bottom: 0 }}
                onDragEnd={(event, info: PanInfo) => {
                  if (info.offset.x > 80) handleChoice('right');
                  else if (info.offset.x < -80) handleChoice('left');
                  else {
                    animationControls.start({ x: 0 });
                  }
                }}
              >
                <p className="text-gray-800 text-lg leading-relaxed whitespace-pre-wrap">
                  {book.content}
                </p>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="mt-8 flex gap-8 z-10">
        <button onClick={() => handleChoice('left')} className="p-4 bg-white rounded-full shadow-lg hover:bg-red-100 active:scale-95 transition-transform" disabled={novels.length === 0}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <button onClick={() => handleChoice('right')} className="p-4 bg-white rounded-full shadow-lg hover:bg-green-100 active:scale-95 transition-transform" disabled={novels.length === 0}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
        </button>
      </div>
    </div>
  );
}
