import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/signin");

  return (
    <main className="min-h-screen p-6">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">FluxWork</h1>
        <span className="text-sm text-muted-foreground">{session.user?.email}</span>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* タイムライン（PC版） */}
        <section className="rounded-lg border p-4">
          <h2 className="mb-4 font-semibold">タイムライン</h2>
          <p className="text-sm text-muted-foreground">
            タスクをここにドラッグ&ドロップして配置します（実装予定）
          </p>
        </section>

        {/* サイドパネル */}
        <div className="space-y-4">
          {/* タスクリスト */}
          <section className="rounded-lg border p-4">
            <h2 className="mb-4 font-semibold">タスクリスト</h2>
            <p className="text-sm text-muted-foreground">
              スコア順のタスクが表示されます（実装予定）
            </p>
          </section>

          {/* ウェイティングレーン */}
          <section className="rounded-lg border border-dashed p-4">
            <h2 className="mb-4 font-semibold text-muted-foreground">
              ウェイティングレーン
            </h2>
            <p className="text-sm text-muted-foreground">
              他者待ちのタスクが表示されます（実装予定）
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
