'use client';

import Dialog from './Dialog';

export default function HelpModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return <Dialog open={isOpen} onClose={onClose} title="kawazu の使い方">
    <p className="dialog-intro">題名も作者も、まだ知らない。<br />まずは、冒頭を読んでみてください。</p>
    <dl className="help-list">
      <div><dt>次の作品へ</dt><dd>左へスワイプ、または左のボタン。気分に合わなければ、次の一篇へ。</dd></div>
      <div><dt>栞をはさむ</dt><dd>右へスワイプ、または「栞をはさむ」で作品を保存します。</dd></div>
      <div><dt>ひとつ戻る</dt><dd>直前に送った作品に戻れます。栞をはさんだ操作も取り消せます。</dd></div>
      <div><dt>栞</dt><dd>保存した作品の題名と作者がわかります。本文を開いたり、好きな作品を本棚に移したりできます。</dd></div>
    </dl>
    <p className="muted">キーボードの ← → でも作品を送れます。<br />「字」から書体と文字サイズを選べます。</p>
    <p className="storage-note">栞と本棚は、この端末のブラウザに保存されます。ブラウザのデータを削除すると消え、別の端末とは同期されません。</p>
    <a className="source-link" href="https://www.aozora.gr.jp/" target="_blank" rel="noopener noreferrer">作品の提供：青空文庫 ↗</a>
  </Dialog>;
}
