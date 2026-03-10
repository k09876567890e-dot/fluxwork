import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">FluxWork</h1>
        <p className="text-muted-foreground text-lg max-w-md">
          AIがタスク分解・優先順位付けを代替する業務整理アプリ
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/signin"
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Googleでログイン
          </Link>
        </div>
      </div>
    </main>
  );
}
