# kawazu

青空文庫の作品と偶然に出会うための小さな Next.js アプリです。
カードに表示された作品の冒頭を読み、左右スワイプまたはボタンで「興味あり」を保存できます。

API は [KukimiCan/aozora_api](https://github.com/KukimiCan/aozora_api) の `/search` エンドポイントを使います。

## セットアップ

```bash
npm install
cp .env.example .env.local
npm run dev
```

`.env.local` の `AOZORA_API_URL` には `aozora_api` の公開 URL を指定します。
末尾のスラッシュはあってもなくても動きます。

```env
AOZORA_API_URL=https://your-aozora-api.example.com
NEXT_PUBLIC_SITE_URL=https://your-kawazu-app.example.com
```

## API

フロントエンドは `/api/aozora/search?num_chars=500` を呼びます。
Next.js の rewrites により、サーバー側で `AOZORA_API_URL/search?num_chars=500` に転送されます。

期待するレスポンス:

```json
{
  "name": "作品名",
  "author": "著者名",
  "content": "冒頭文...",
  "url": "https://www.aozora.gr.jp/..."
}
```

## コマンド

```bash
npm run lint
npm run build
npm start
```
