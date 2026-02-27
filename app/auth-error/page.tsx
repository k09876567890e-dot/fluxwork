import Link from "next/link";

interface Props {
  searchParams: Promise<{ error?: string }>;
}

const ERROR_MESSAGES: Record<string, string> = {
  Configuration: "サーバー設定に問題があります。管理者に連絡してください。",
  AccessDenied: "アクセスが拒否されました。",
  Verification: "認証リンクが無効か期限切れです。",
  OAuthSignin: "Google認証の開始に失敗しました。",
  OAuthCallback: "Google認証のコールバックでエラーが発生しました。",
  OAuthCreateAccount: "アカウントの作成に失敗しました。",
  EmailCreateAccount: "メールアカウントの作成に失敗しました。",
  Callback: "コールバック処理でエラーが発生しました。",
  Default: "認証中にエラーが発生しました。",
};

export default async function AuthErrorPage({ searchParams }: Props) {
  const { error } = await searchParams;
  const message = ERROR_MESSAGES[error ?? ""] ?? ERROR_MESSAGES.Default;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="w-full max-w-sm space-y-6 rounded-lg border p-8 shadow-sm text-center">
        <h1 className="text-2xl font-bold text-destructive">認証エラー</h1>
        <p className="text-sm text-muted-foreground">{message}</p>
        {error && (
          <p className="text-xs text-muted-foreground font-mono bg-muted rounded px-2 py-1">
            エラーコード: {error}
          </p>
        )}
        <Link
          href="/signin"
          className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm hover:bg-accent transition-colors"
        >
          ログイン画面に戻る
        </Link>
      </div>
    </main>
  );
}
