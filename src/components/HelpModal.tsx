'use client';

import Dialog from './Dialog';

export default function HelpModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return <Dialog open={isOpen} onClose={onClose} title="kawazu の使い方">
    <dl className="help-list">
      <div><dt>次の作品へ</dt><dd>左へスワイプ、または「次の一篇」を選びます。</dd></div>
      <div><dt>栞をはさむ</dt><dd>右へスワイプ、または「栞をはさむ」を選ぶと作品を保存します。</dd></div>
      <div><dt>ひとつ戻る</dt><dd>直前の操作を取り消し、前の作品へ戻ります。</dd></div>
      <div><dt>栞と本棚</dt><dd>保存した作品の題名と作者を確認できます。本文を開く、または本棚へ移せます。</dd></div>
    </dl>
    <p className="muted">キーボードの ← → でも作品を送れます。<br />「字」から書体と文字サイズを選べます。</p>
    <p className="storage-note">栞と本棚は、この端末のブラウザに保存されます。ブラウザのデータを削除すると消え、別の端末とは同期されません。</p>
    <a className="source-link" href="https://www.aozora.gr.jp/" target="_blank" rel="noopener noreferrer">作品の提供：青空文庫 ↗</a>
  </Dialog>;
}
