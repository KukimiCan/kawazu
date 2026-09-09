'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { type AppFont, FONT_OPTIONS, type TextSize, useDisplay } from '@/contexts/DisplayContext';
import { useBooks } from '@/contexts/BookContext';
import HelpModal from './HelpModal';
import Dialog from './Dialog';

export default function Header() {
  const pathname = usePathname();
  const { font, setFont, textSize, setTextSize, preferenceError } = useDisplay();
  const { likedBooks, favoriteBooks, storageError } = useBooks();
  const [panel, setPanel] = useState<'help' | 'display' | null>(null);
  const count = likedBooks.length + favoriteBooks.length;
  return <>
    <a className="skip-link" href="#main-content">本文へ移動</a>
    <header className="site-header">
      <nav className="header-inner" aria-label="メインナビゲーション">
        <Link href="/" className="wordmark" aria-label="kawazu ホーム">kawazu<span aria-hidden="true">.</span></Link>
        <div className="main-links">
          <Link href="/" aria-current={pathname === '/' ? 'page' : undefined}>出会う</Link>
          <Link href="/list" aria-current={pathname === '/list' ? 'page' : undefined}>思い出す{count > 0 && <span className="nav-count">{count}</span>}</Link>
        </div>
        <div className="header-tools">
          <button className="icon-button font-button" type="button" aria-label="文字の設定" aria-haspopup="dialog" onClick={() => setPanel('display')}>字</button>
          <button className="icon-button" type="button" aria-label="使い方" aria-haspopup="dialog" onClick={() => setPanel('help')}>?</button>
        </div>
      </nav>
    </header>
    {storageError && <p className="storage-warning" role="alert">{storageError}</p>}
    <HelpModal isOpen={panel === 'help'} onClose={() => setPanel(null)} />
    <Dialog open={panel === 'display'} onClose={() => setPanel(null)} title="文字の設定">
      <label className="field-label" htmlFor="reading-font">書体</label>
      <select id="reading-font" value={font} onChange={(event) => setFont(event.target.value as AppFont)}>
        {FONT_OPTIONS.map((option) => <option value={option.id} key={option.id}>{option.label}</option>)}
      </select>
      <fieldset className="size-picker"><legend className="field-label">文字の大きさ</legend>
        {([['small', '小さめ'], ['medium', '標準'], ['large', '大きめ']] as [TextSize, string][]).map(([value, label]) =>
          <label key={value}><input type="radio" name="text-size" checked={textSize === value} onChange={() => setTextSize(value)} /><span>{label}</span></label>)}
      </fieldset>
      <p className="font-preview reading-text">気になる一文に、栞をはさむ。<br />今日の一篇を、ゆっくりと。</p>
      {preferenceError && <p className="storage-note" role="status">設定はこの画面に反映されますが、次回のために保存できませんでした。</p>}
    </Dialog>
  </>;
}
