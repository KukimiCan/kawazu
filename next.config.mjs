// next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // ユーザーが設定した環境変数から正しいAPIのベースURLを取得
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

    // 環境変数が設定されていることを確認（設定されていない場合はエラーを避ける）
    if (!apiBaseUrl) {
      console.warn("NEXT_PUBLIC_API_URL が設定されていません。Vercelの環境変数を確認してください。");
      return [];
    }
    
    // URLの末尾にスラッシュがあれば除去（Next.jsのリライト動作のため）
    const cleanedApiBaseUrl = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;

    return [
      {
        // 修正: /api/aozora/以下のすべてのパスとクエリパラメータにマッチ
        source: '/api/aozora/:path*',
        // 修正: NEXT_PUBLIC_API_URLに転送し、パスとクエリパラメータを引き継ぐ
        destination: `${cleanedApiBaseUrl}/:path*`,
      },
      // 以前の 'bungomail' の設定は削除します
    ];
  },
};

export default nextConfig;
