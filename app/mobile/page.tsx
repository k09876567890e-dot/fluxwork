import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createServiceClient } from "@/lib/supabase";
import { sortTasksByScore } from "@/lib/scoring";
import { mapTaskRow } from "@/lib/mappers";
import MobileClient from "@/components/mobile/MobileClient";

export default async function MobilePage() {
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
      <main className="min-h-screen p-4">
        <p className="text-red-500">タスクの読み込みに失敗しました: {error.message}</p>
      </main>
    );
  }

  const tasks = (data ?? []).map((row) => mapTaskRow(row as Record<string, unknown>));
  const { activeTasks, waitingTasks } = sortTasksByScore(tasks);

  return (
    <MobileClient
      initialActiveTasks={activeTasks}
      initialWaitingTasks={waitingTasks}
      userEmail={session.user.email}
    />
  );
}
