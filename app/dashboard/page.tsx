import dynamic from "next/dynamic";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createServiceClient } from "@/lib/supabase";
import { sortTasksByScore } from "@/lib/scoring";
import { mapTaskRow } from "@/lib/mappers";
// dnd-kit は SSR で aria-describedby の連番 ID がサーバー/クライアントで
// ずれて Hydration エラーになるため ssr: false で回避する
const DashboardClient = dynamic(
  () => import("@/components/dashboard/DashboardClient"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen items-center justify-center text-muted-foreground text-sm">
        読み込み中…
      </div>
    ),
  }
);

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/signin");

  const db = createServiceClient();
  const { data, error } = await db
    .from("tasks")
    .select("*, subtasks(*)")
    .eq("user_id", session.user.email)
    .order("score", { ascending: false });

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-red-500">タスクの読み込みに失敗しました: {error.message}</p>
      </main>
    );
  }

  const tasks = (data ?? []).map((row) => mapTaskRow(row as Record<string, unknown>));
  const { activeTasks, waitingTasks } = sortTasksByScore(tasks);

  return (
    <DashboardClient
      initialActiveTasks={activeTasks}
      initialWaitingTasks={waitingTasks}
      userEmail={session.user.email}
    />
  );
}
