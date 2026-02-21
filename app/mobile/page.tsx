import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function MobilePage() {
  const session = await auth();
  if (!session) redirect("/signin");

  return (
    <main className="min-h-screen p-4">
      <header className="mb-6">
        <h1 className="text-xl font-bold">FluxWork</h1>
      </header>

      <div className="space-y-4">
        {/* タスク入力 */}
        <section className="rounded-lg border p-4">
          <h2 className="mb-3 font-semibold">タスクを追加</h2>
          <p className="text-sm text-muted-foreground">
            タスク入力フォーム（実装予定）
          </p>
        </section>

        {/* 破綻判定 */}
        <section className="rounded-lg border p-4">
          <h2 className="mb-3 font-semibold">今日の余裕</h2>
          <p className="text-sm text-muted-foreground">
            スケジュール破綻判定（実装予定）
          </p>
        </section>

        {/* ウェイティングレーン（簡易） */}
        <section className="rounded-lg border border-dashed p-4">
          <h2 className="mb-3 font-semibold text-muted-foreground">
            他者待ち
          </h2>
          <p className="text-sm text-muted-foreground">
            ウェイティングレーン（実装予定）
          </p>
        </section>
      </div>
    </main>
  );
}
