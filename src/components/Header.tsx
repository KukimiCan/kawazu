'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { BookOpen, Library, CircleHelp, Type } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { type AppFont, FONT_OPTIONS, type TextSize, useDisplay } from '@/contexts/DisplayContext';
import { useBooks } from '@/contexts/BookContext';
import HelpModal from './HelpModal';
import Dialog from './Dialog';

export default function Header() {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  const { font, setFont, textSize, setTextSize, preferenceError } = useDisplay();
  const { likedBooks, favoriteBooks, storageError } = useBooks();
  const [panel, setPanel] = useState<'help' | 'display' | null>(null);
  const count = likedBooks.length + favoriteBooks.length;
  return <>
    <a className="skip-link" href="#main-content">本文へ移動</a>
    <header className="site-header">
      <nav className="header-inner" aria-label="メインナビゲーション">
        <Link href="/" className="wordmark" aria-label="kawazu ホーム">kawazu<span className="brand-seal" aria-hidden="true">文</span></Link>
        <div className="main-links">
          <Link href="/" aria-current={pathname === '/' ? 'page' : undefined}><BookOpen size={16} strokeWidth={1.5} /><span>出会う</span>{pathname === '/' && <motion.span className="nav-indicator" layoutId="main-navigation" aria-hidden="true" transition={{ duration: reducedMotion ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }} />}</Link>
          <Link href="/list" aria-current={pathname === '/list' ? 'page' : undefined}><Library size={16} strokeWidth={1.5} /><span>思い出す</span>{count > 0 && <span className="nav-count">{count}</span>}{pathname === '/list' && <motion.span className="nav-indicator" layoutId="main-navigation" aria-hidden="true" transition={{ duration: reducedMotion ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }} />}</Link>
        </div>
        <div className="header-tools">
          <button className="icon-button" type="button" title="文字の設定" aria-label="文字の設定" aria-haspopup="dialog" onClick={() => setPanel('display')}><Type size={19} strokeWidth={1.5} /></button>
          <button className="icon-button help-button" type="button" title="使い方" aria-label="使い方" aria-haspopup="dialog" onClick={() => setPanel('help')}><CircleHelp size={18} strokeWidth={1.5} /></button>
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
      <p className="font-preview reading-text">春の川を、静かな風が渡る。</p>
      {preferenceError && <p className="storage-note" role="status">設定はこの画面に反映されますが、次回のために保存できませんでした。</p>}
    </Dialog>
  </>;
}
