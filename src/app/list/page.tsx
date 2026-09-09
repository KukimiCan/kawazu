'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useBooks } from '@/contexts/BookContext';
import { searchBooks, type Book, type Shelf } from '@/lib/books';

export default function ListPage() {
  const [activeTab, setActiveTab] = useState<Shelf>('liked');
  const [query, setQuery] = useState('');
  const [lastChange, setLastChange] = useState<{ book: Book; shelf: Shelf; message: string } | null>(null);
  const { likedBooks, favoriteBooks, placeOnShelf, isHydrated } = useBooks();
  const books = activeTab === 'liked' ? likedBooks : favoriteBooks;
  const filtered = useMemo(() => searchBooks(books, query), [books, query]);
  const changeShelf = (book: Book, shelf: Shelf | null) => {
    setLastChange({ book, shelf: activeTab, message: shelf ? `「${book.name}」を${shelf === 'favorites' ? '本棚' : '栞'}に移しました。` : `「${book.name}」を削除しました。` });
    placeOnShelf(book, shelf);
  };
  const undo = () => {
    if (!lastChange) return;
    placeOnShelf(lastChange.book, lastChange.shelf);
    setLastChange(null);
  };
  return <div className="library-page">
    <div className="library-heading"><div><p className="eyebrow">あなたの読書録</p><h1>思い出す</h1></div><Link className="text-button" href="/">一篇と出会う ↗</Link></div>
    <div className="library-toolbar">
      <div className="shelf-tabs" role="group" aria-label="保存先">
        <button type="button" aria-pressed={activeTab === 'liked'} onClick={() => setActiveTab('liked')}>栞 <span>{likedBooks.length}</span></button>
        <button type="button" aria-pressed={activeTab === 'favorites'} onClick={() => setActiveTab('favorites')}>本棚 <span>{favoriteBooks.length}</span></button>
      </div>
      <label className="search-field"><span className="sr-only">作品名・作者で検索</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="作品名・作者で検索" /></label>
    </div>
    <p className="shelf-description">{activeTab === 'liked' ? '冒頭が気になった作品。続きを読むなら、ここから。' : '栞の中から選んだ、手元に残しておきたい作品。'}</p>
    {lastChange && <div className="undo-notice" role="status"><span>{lastChange.message}</span><button type="button" className="text-button" onClick={undo}>取り消す</button></div>}
    {!isHydrated ? <p className="empty-state" role="status">保存した作品を読み込んでいます。</p> : filtered.length === 0 ?
      <div className="empty-state">
        <h2>{query.trim() ? '見つかりませんでした' : activeTab === 'liked' ? '気になる一篇に、栞を。' : '本棚は、まだ空です。'}</h2>
        <p>{query.trim() ? '別の作品名や作者名で探してみてください。' : activeTab === 'liked' ? '冒頭を読んで栞をはさむと、ここに作品が残ります。' : '栞の作品から「本棚に移す」を選ぶと、ここに残ります。'}</p>
        {query.trim() ? <button className="secondary-button" onClick={() => setQuery('')}>検索をクリア</button> : activeTab === 'liked' ? <Link className="primary-button" href="/">一篇と出会う</Link> : <button className="secondary-button" onClick={() => setActiveTab('liked')}>栞を見る</button>}
      </div> : <>
        <p className="result-count" role="status">{filtered.length} 作品{query.trim() && ` / ${books.length} 作品中`}</p>
        <div className="book-list">{filtered.map((book, index) => <article className="book-entry" key={book.id}>
          <span className="book-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
          <div className="book-details"><h2>{book.name}</h2><p className="book-author">{book.author}</p>
            <details className="book-excerpt"><summary>冒頭を読み返す</summary><p className="reading-text">{book.content}</p></details>
            <div className="book-actions"><a href={book.url} target="_blank" rel="noopener noreferrer" className="read-link">本文を読む ↗<span className="sr-only">（青空文庫を新しいタブで開く）</span></a>
              <button className="text-button" type="button" onClick={() => changeShelf(book, activeTab === 'liked' ? 'favorites' : 'liked')}>{activeTab === 'liked' ? '本棚に移す' : '栞に戻す'}</button>
              <button className="text-button delete-button" type="button" aria-label={`${book.name}を削除`} onClick={() => changeShelf(book, null)}>削除</button>
            </div>
          </div>
        </article>)}</div>
      </>}
    <p className="library-footer">栞と本棚は、このブラウザに保存されます。<br />別の端末との同期はありません。</p>
  </div>;
}
