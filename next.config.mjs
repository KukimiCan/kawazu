// next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // 修正: 実際のAPI URLを AOZORA_API_URL から取得
    const apiBaseUrl = process.env.AOZORA_API_URL; 

    if (!apiBaseUrl) {
      console.warn("AOZORA_API_URL が設定されていません。Vercelの環境変数を確認してください。");
      return [];
    }
    
    let destinationUrl = apiBaseUrl;
    
    // プロトコルが含まれていない場合に 'https://' を追加（ビルドエラー解消のため）
    if (!destinationUrl.startsWith('http://') && !destinationUrl.startsWith('https://')) {
      destinationUrl = `https://${destinationUrl}`;
    }

    // 末尾のスラッシュを削除
    const cleanedDestinationUrl = destinationUrl.endsWith('/') ? destinationUrl.slice(0, -1) : destinationUrl;

    return [
      {
        // クライアントがリクエストするローカルプロキシパス
        source: '/api/aozora/:path*',
        // サーバー側でリライトされる実際の外部URL
        destination: `${cleanedDestinationUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
