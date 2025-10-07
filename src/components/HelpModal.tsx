// src/components/HelpModal.tsx
import React from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600/50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 m-4 max-w-md w-full relative">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">使用方法</h2>
        <p className="mb-3 text-gray-700">
          青空文庫の膨大な作品群から、あなたにおすすめの小説を見つけるお手伝いをします。
        </p>
        <ul className="list-disc pl-5 mb-4 text-gray-700">
          <li className="mb-2">
            <span className="font-semibold">小説を読む:</span> カードに表示された小説の冒頭を読みます。
          </li>
          <li className="mb-2">
            <span className="font-semibold">左右にスワイプ:</span>
            <ul className="list-circle pl-4 text-sm">
              <li><span className="font-bold">右にスワイプ</span> または <span className="font-bold">「❤」ボタン</span> / <span className="font-bold">右矢印キー</span>: 興味がある作品です。あなたの「興味あり」リストに追加されます。</li>
              <li><span className="font-bold">左にスワイプ</span> または <span className="font-bold">「✖」ボタン</span> / <span className="font-bold">左矢印キー</span>: 興味がない作品です。次の作品が表示されます。</li>
            </ul>
          </li>
          <li className="mb-2">
            <span className="font-semibold">「興味あり」リスト:</span> ナビゲーションバーの「思い出す」をクリックすると、あなたが興味をもった作品を一覧で見ることができます。全文へのリンクもあります．
          </li>
          <li className="mb-2">
            <span className="font-semibold">「お気に入り」リスト:</span> 「興味あり」リストから、特に気に入った作品を「お気に入り」に登録できます。
          </li>
        </ul>
        <p className="text-gray-700">
          よき出会いを．
        </p>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-2xl font-bold"
          aria-label="閉じる"
        >
          &times;
        </button>
      </div>
    </div>
  );
};

export default HelpModal;