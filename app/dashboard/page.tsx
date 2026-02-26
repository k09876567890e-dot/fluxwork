import dynamic from "next/dynamic";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createServiceClient } from "@/lib/supabase";
import type { UITask, UISubtask } from "@/lib/api-client";
import type { BallHolder } from "@/types";

// dnd-kit は SSR で aria-describedby の連番 ID がサーバー/クライアントで
// ずれて Hydration エラーになるため ssr: false で回避する
const DashboardShell = dynamic(
  () =>
    import("@/components/dashboard/DashboardShell").then(
      (m) => m.DashboardShell
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
        読み込み中…
      </div>
    ),
  }
);

// Supabase の snake_case レスポンスを UITask に変換（サーバーサイド用）
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(raw: Record<string, any>): UITask {
  const rawScore = raw.score as number | null;
  const score =
    rawScore === null || rawScore === undefined ? Number.MAX_VALUE : rawScore;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subtasks: UISubtask[] = Array.isArray(raw.subtasks)
    ? (raw.subtasks as Record<string, unknown>[]).map((s) => ({
        id: s.id as string,
        name: s.name as string,
        estimatedMinutes: s.estimated_minutes as number,
        isDelegatable: s.is_delegatable as boolean,
        dependsOnOthers: s.depends_on_others as boolean,
        isCompleted: s.is_completed as boolean,
      }))
    : [];

  return {
    id: raw.id as string,
    userId: raw.user_id as string,
    name: raw.name as string,
    deadline: raw.deadline as string,
    notes: raw.notes as string | undefined,
    estimatedMinutes: raw.estimated_minutes as number,
    leadTimeMinutes: raw.lead_time_minutes as number,
    ballHolder: raw.ball_holder as BallHolder,
    score,
    subtasks,
    gcalEventId: raw.gcal_event_id as string | undefined,
    isLocked: raw.is_locked as boolean,
    scheduledStart: raw.scheduled_start as string | undefined,
    scheduledEnd: raw.scheduled_end as string | undefined,
    createdAt: raw.created_at as string,
    updatedAt: raw.updated_at as string,
  };
}

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
    // DB 接続エラーの場合は空リストで表示（env 未設定時などのフォールバック）
    console.error("Supabase fetch error:", error.message);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tasks: UITask[] = (data ?? []).map((row: Record<string, any>) =>
    mapRow(row)
  );

  const activeTasks = tasks
    .filter((t) => t.ballHolder === 1)
    .sort((a, b) => b.score - a.score);

  const waitingTasks = tasks.filter((t) => t.ballHolder === 0);

  return (
    <DashboardShell
      initialActiveTasks={activeTasks}
      initialWaitingTasks={waitingTasks}
      userEmail={session.user.email}
    />
  );
}
