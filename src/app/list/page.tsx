// src/app/list/page.tsx
'use client';

import { useState } from 'react';
import { useBooks } from '@/contexts/BookContext';
import Link from 'next/link';

export default function ListPage() {
  const [activeTab, setActiveTab] = useState<'liked' | 'favorites'>('liked');
  const { likedBooks, favoriteBooks, addFavoriteBook } = useBooks();
  
  const tabStyle = "px-6 py-2 text-sm font-medium rounded-t-lg";
  const activeTabStyle = "bg-white text-gray-900 border-b-2 border-blue-500";
  const inactiveTabStyle = "bg-gray-100 text-gray-500 hover:bg-gray-200";

  const booksToDisplay = activeTab === 'liked' ? likedBooks : favoriteBooks;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* タブ切り替え */}
      <div className="flex border-b border-gray-200">
        <button onClick={() => setActiveTab('liked')} className={`${tabStyle} ${activeTab === 'liked' ? activeTabStyle : inactiveTabStyle}`}>
          興味あり ({likedBooks.length})
        </button>
        <button onClick={() => setActiveTab('favorites')} className={`${tabStyle} ${activeTab === 'favorites' ? activeTabStyle : inactiveTabStyle}`}>
          お気に入り ({favoriteBooks.length})
        </button>
      </div>
      
      {/* リスト表示 */}
      <div className="mt-6">
        {booksToDisplay.length === 0 ? (
          <p className="text-center text-gray-500 mt-12">このリストにはまだ作品がありません。</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {booksToDisplay.map((book) => (
              <div key={book.id} className="bg-white rounded-lg shadow-md p-5 flex flex-col">
                <h3 className="text-lg font-bold text-gray-900">{book.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{book.author}</p>
                <p className="text-sm text-gray-700 leading-relaxed flex-grow">
                  {book.content.substring(0, 50)}…
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={book.url} target="_blank" rel="noopener noreferrer" className="text-sm bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 transition-colors">
                    本文を読む
                  </Link>
                  {activeTab === 'liked' && (
                    <button onClick={() => addFavoriteBook(book)} className="text-sm bg-yellow-400 text-white px-3 py-1 rounded-md hover:bg-yellow-500 transition-colors">
                      お気に入り
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}