// next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

    // 環境変数が設定されていない、または無効な場合の処理
    if (!apiBaseUrl) {
      console.warn("NEXT_PUBLIC_API_URL が設定されていません。Vercelの環境変数を確認してください。");
      return [];
    }
    
    let destinationUrl = apiBaseUrl;
    
    // プロトコル（http:// または https://）が含まれているかチェックし、なければ安全のため 'https://' を追加
    if (!destinationUrl.startsWith('http://') && !destinationUrl.startsWith('https://')) {
      destinationUrl = `https://${destinationUrl}`;
    }

    // URLの末尾にスラッシュがあれば除去（Next.jsのリライトのパス結合で二重スラッシュになるのを避けるため）
    const cleanedDestinationUrl = destinationUrl.endsWith('/') ? destinationUrl.slice(0, -1) : destinationUrl;

    return [
      {
        source: '/api/aozora/:path*',
        // プロトコルを含む修正されたURLを使用
        destination: `${cleanedDestinationUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
