import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createServiceClient } from "@/lib/supabase";
import { sortTasksByScore } from "@/lib/scoring";
import { mapTaskRow } from "@/lib/mappers";
import DashboardClient from "@/components/dashboard/DashboardClient";

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
